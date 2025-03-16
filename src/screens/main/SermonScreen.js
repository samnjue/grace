import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { StatusBar } from "react-native";
import Slider from "@react-native-community/slider";
import AudioService from "../../services/audioService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SermonScreen = ({ route }) => {
  const {
    sermon_image,
    sermon,
    sermon_metadata,
    sermon_content,
    sermon_audio,
  } = route.params;
  const navigation = useNavigation();
  const theme = useSelector((state) => state.theme.theme);
  const insets = useSafeAreaInsets();

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Add a separate state for seeking operations
  const [isSeeking, setIsSeeking] = useState(false);

  // Animation value for the pulsating effect
  const pulsateAnim = useRef(new Animated.Value(1)).current;

  // Start the pulsating animation when loading
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulsateAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulsateAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animation when not loading
      pulsateAnim.setValue(1);
      Animated.timing(pulsateAnim).stop();
    }
  }, [isLoading, pulsateAnim]);

  useEffect(() => {
    const setupAudio = async () => {
      // Set loading state to true when starting to set up audio
      setIsLoading(true);
      await AudioService.init();

      if (AudioService.currentUri === sermon_audio) {
        setIsLoaded(true);
        setIsLoading(false);
        setIsPlaying(AudioService.isPlaying);

        if (AudioService.sound) {
          const status = await AudioService.sound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 1);
          }
        }
      } else if (sermon_audio) {
        await loadSermonAudio();
      }
    };

    setupAudio();

    return () => {
      if (AudioService.sound && sermon_audio === AudioService.currentUri) {
        AudioService.saveSession();
      }
    };
  }, []);

  useEffect(() => {
    const unregisterCallback = AudioService.registerStatusCallback(
      onPlaybackStatusUpdate
    );

    return () => {
      unregisterCallback();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const syncUIWithAudioState = async () => {
        if (AudioService.currentUri === sermon_audio && AudioService.sound) {
          setIsLoaded(true);
          setIsLoading(false);
          setIsPlaying(AudioService.isPlaying);

          const status = await AudioService.sound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 1);
          }
        } else if (sermon_audio && !isLoaded) {
          setIsLoading(true);
          await loadSermonAudio();
        }
      };

      syncUIWithAudioState();

      return () => {};
    }, [sermon_audio, isLoaded])
  );

  const loadSermonAudio = async () => {
    if (!sermon_audio) return;

    try {
      setIsLoading(true);
      const metadata = {
        title: sermon,
        author: sermon_metadata.split(" • ")[0] || "Speaker",
        imageUri: sermon_image,
      };

      await AudioService.loadAudio(sermon_audio, metadata);
      setIsLoaded(true);
      setIsLoading(false);

      const savedPosition = await AsyncStorage.getItem(
        `audioPosition-${sermon_audio}`
      );
      if (savedPosition) {
        const startPosition = parseInt(savedPosition, 10);
        await AudioService.seekTo(startPosition);
      }
    } catch (error) {
      console.error("Error loading sermon audio:", error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 1);
      setIsPlaying(status.isPlaying);

      // Only update loading state when not in the middle of a seek operation
      if (!isSeeking) {
        setIsLoading(false);
      }
    } else if (status.isBuffering && !isSeeking) {
      // Only set loading if we're buffering and not just seeking
      setIsLoading(true);
    }
  };

  const togglePlayPause = async () => {
    if (isLoading && !isSeeking) return; // Prevent interaction while loading (but allow during seeking)

    requestAnimationFrame(async () => {
      if (isPlaying) {
        await AudioService.pause();
      } else {
        setIsLoading(true); // Show loading when starting playback
        await AudioService.play();
      }
    });
  };

  const seekAudio = async (newPosition) => {
    if (isLoading && !isSeeking) return; // Prevent interaction while loading (but allow new seeks during seeking)

    requestAnimationFrame(async () => {
      if (AudioService.sound) {
        // Don't show full loading UI for quick seek operations
        setIsSeeking(true);
        await AudioService.seekTo(newPosition);
        setIsSeeking(false);
      }
    });
  };

  const forwardAudio = () => {
    if (isLoading && !isSeeking) return null;
    const newPosition = Math.min(position + 5000, duration);
    seekAudio(newPosition);
  };

  const rewindAudio = () => {
    if (isLoading && !isSeeking) return null;
    const newPosition = Math.max(position - 5000, 0);
    seekAudio(newPosition);
  };

  const saveAudioPosition = async () => {
    if (sermon_audio && position > 0) {
      try {
        await AsyncStorage.setItem(
          `audioPosition-${sermon_audio}`,
          position.toString()
        );
      } catch (error) {
        console.error("Error saving audio position:", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      saveAudioPosition();
    };
  }, [position]);

  const [scrollY] = useState(new Animated.Value(0));
  const fadeInOut = scrollY.interpolate({
    inputRange: [250, 330],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const styles = getStyle(theme, insets);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  // Determine if controls should be disabled
  const controlsDisabled = isLoading && !isSeeking;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        animated
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: sermon_image }} style={styles.image} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{sermon}</Text>
          <Text style={styles.metadata}>{sermon_metadata}</Text>
          {sermon_audio && (
            <View style={styles.audioPlayer}>
              <Animated.View
                style={{
                  width: "100%",
                  opacity: isLoading && !isSeeking ? pulsateAnim : 1,
                }}
              >
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={duration}
                  value={position}
                  onSlidingComplete={seekAudio}
                  thumbTintColor="#6a5acd"
                  minimumTrackTintColor={isDarkTheme ? "#6a5acd" : "#6a5acd"}
                  maximumTrackTintColor={isDarkTheme ? "#999" : "#444"}
                  disabled={controlsDisabled}
                />
              </Animated.View>
              <View style={styles.audioControls}>
                <Text style={styles.audioTime}>
                  {Math.floor(position / 60000)}:
                  {((position % 60000) / 1000).toFixed(0).padStart(2, "0")}
                </Text>

                <TouchableOpacity
                  onPress={rewindAudio}
                  disabled={controlsDisabled}
                  style={controlsDisabled ? styles.disabledButton : null}
                >
                  <Ionicons
                    name="play-back"
                    size={30}
                    color={
                      controlsDisabled
                        ? isDarkTheme
                          ? "#666"
                          : "#aaa"
                        : isDarkTheme
                          ? "#fff"
                          : "#000"
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={togglePlayPause}
                  disabled={controlsDisabled}
                  style={controlsDisabled ? styles.disabledButton : null}
                >
                  {isLoading && !isSeeking ? (
                    <Animated.View style={{ opacity: pulsateAnim }}>
                      <Ionicons
                        name="infinite-outline"
                        size={47}
                        color={isDarkTheme ? "#aaa" : "#888"}
                      />
                    </Animated.View>
                  ) : (
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={47}
                      color={isDarkTheme ? "#fff" : "#000"}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={forwardAudio}
                  disabled={controlsDisabled}
                  style={controlsDisabled ? styles.disabledButton : null}
                >
                  <Ionicons
                    name="play-forward"
                    size={30}
                    color={
                      controlsDisabled
                        ? isDarkTheme
                          ? "#666"
                          : "#aaa"
                        : isDarkTheme
                          ? "#fff"
                          : "#000"
                    }
                  />
                </TouchableOpacity>

                <Text style={styles.audioTime}>
                  {Math.floor(duration / 60000)}:
                  {((duration % 60000) / 1000).toFixed(0).padStart(2, "0")}
                </Text>
              </View>
              {isLoading && !isSeeking && (
                <Text style={styles.loadingText}>Loading audio...</Text>
              )}
            </View>
          )}
          <Text style={styles.content}>{sermon_content}</Text>
        </View>
      </ScrollView>

      <Animated.View style={[styles.topBar, { opacity: fadeInOut }]}>
        <TouchableOpacity
          style={styles.topBarBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1} ellipsizeMode="tail">
          {sermon}
        </Text>
      </Animated.View>
    </View>
  );
};

const getStyle = (theme, insets) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
    },
    imageContainer: {
      height: 300,
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    backButton: {
      position: "absolute",
      top: insets.top + 10,
      left: 15,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      padding: 10,
      borderRadius: 50,
    },
    contentContainer: {
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#333",
    },
    metadata: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#bbb" : "#777",
      marginTop: 5,
      marginLeft: 15,
      lineHeight: 21,
    },
    content: {
      fontSize: 20,
      fontWeight: "600",
      fontFamily: "SourceSerif4_400Regular",
      color: isDarkTheme ? "#f7f7f7" : "#222",
      marginTop: 20,
      lineHeight: 24,
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingTop: insets.top,
    },
    topBarBackButton: {
      padding: 10,
    },
    topBarTitle: {
      fontSize: 18,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#121212",
      marginLeft: 10,
      flex: 1,
    },
    audioPlayer: {
      marginVertical: 20,
      padding: 15,
      borderRadius: 10,
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#f2f2f2",
      alignItems: "center",
    },
    audioControls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 10,
    },
    audioTime: {
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#999" : "#444",
    },
    controlButton: {
      alignItems: "center",
    },
    controlLabel: {
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#bbb" : "#555",
      marginTop: 2,
    },
    disabledButton: {
      opacity: 0.5,
    },
    loadingText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#999" : "#666",
      marginTop: 10,
      textAlign: "center",
    },
  });
};

export default SermonScreen;
