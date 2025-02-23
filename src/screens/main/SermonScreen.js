import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { StatusBar } from 'react-native';

const SermonScreen = ({ route }) => {
    const { sermon_image, sermon, sermon_metadata, sermon_content, sermon_audio } = route.params;
    const navigation = useNavigation();
    const theme = useSelector((state) => state.theme.theme);
    const insets = useSafeAreaInsets();

    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(1);

    useEffect(() => {
        if (sermon_audio) {
            loadAudio();
        }
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sermon_audio]);

    const loadAudio = async () => {
        const { sound } = await Audio.Sound.createAsync(
            { uri: sermon_audio },
            { shouldPlay: false },
            onPlaybackStatusUpdate
        );
        setSound(sound);
    };

    const onPlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 1);
            setIsPlaying(status.isPlaying);
        }
    };

    const togglePlayPause = async () => {
        if (sound) {
            if (isPlaying) {
                await sound.pauseAsync();
            } else {
                await sound.playAsync();
            }
        }
    };

    const seekAudio = async (newPosition) => {
        if (sound) {
            await sound.setPositionAsync(newPosition);
        }
    };

    const forwardAudio = async () => {
        seekAudio(position + 10000);
    };

    const rewindAudio = async () => {
        seekAudio(position - 10000);
    };

    const [scrollY] = useState(new Animated.Value(0));

    const fadeInOut = scrollY.interpolate({
        inputRange: [250, 330],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const styles = getStyle(theme, insets);
    const isDarkTheme = theme.toLowerCase().includes('dark');

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                //backgroundColor={isDarkTheme ? '#121212' : '#fff'}
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
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.title}>{sermon}</Text>
                    <Text style={styles.metadata}>{sermon_metadata}</Text>
                    {sermon_audio && (
                        <View style={styles.audioPlayer}>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0}
                                maximumValue={duration}
                                value={position}
                                onSlidingComplete={seekAudio}
                                minimumTrackTintColor={isDarkTheme ? '#fff' : '#000'}
                                maximumTrackTintColor="#777"
                            />
                            <View style={styles.audioControls}>
                                <Text style={styles.audioTime}>
                                    {Math.floor(position / 60000)}:{((position % 60000) / 1000).toFixed(0).padStart(2, '0')}
                                </Text>

                                <TouchableOpacity onPress={rewindAudio}>
                                    <Ionicons name="play-back" size={30} color={isDarkTheme ? '#fff' : '#000'} />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={togglePlayPause}>
                                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color={isDarkTheme ? '#fff' : '#000'} />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={forwardAudio}>
                                    <Ionicons name="play-forward" size={30} color={isDarkTheme ? '#fff' : '#000'} />
                                </TouchableOpacity>

                                <Text style={styles.audioTime}>
                                    {Math.floor(duration / 60000)}:{((duration % 60000) / 1000).toFixed(0).padStart(2, '0')}
                                </Text>
                            </View>
                        </View>
                    )}
                    <Text style={styles.content}>{sermon_content}</Text>
                </View>
            </ScrollView>

            <Animated.View style={[styles.topBar, { opacity: fadeInOut }]}>
                <TouchableOpacity style={styles.topBarBackButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text
                    style={styles.topBarTitle}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                >{sermon}</Text>
            </Animated.View>
        </View>
    );
};

const getStyle = (theme, insets) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
        },
        imageContainer: {
            height: 300,
            position: 'relative',
        },
        image: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        backButton: {
            position: 'absolute',
            top: insets.top + 10,
            left: 15,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: 10,
            borderRadius: 50,
        },
        contentContainer: {
            padding: 20,
        },
        title: {
            fontSize: 28,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#333',
        },
        metadata: {
            fontSize: 13,
            fontFamily: 'Inter_700Bold',
            color: isDarkTheme ? '#bbb' : '#777',
            marginTop: 5,
            marginLeft: 15,
            lineHeight: 21
        },
        content: {
            fontSize: 20,
            fontWeight: '600',
            fontFamily: 'SourceSerif4_400Regular',
            color: isDarkTheme ? '#f7f7f7' : '#222',
            marginTop: 20,
            lineHeight: 24,
        },
        topBar: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            paddingTop: insets.top,
        },
        topBarBackButton: {
            padding: 10,
        },
        topBarTitle: {
            fontSize: 18,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#121212',
            marginLeft: 10,
            flex: 1,
        },
        audioPlayer: {
            marginVertical: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor: '#f2f2f2',
            alignItems: 'center',
        },
        audioControls: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 10,
        },
        audioTime: {
            fontSize: 14,
            fontFamily: 'Inter_700Bold',
            color: '#444',
        },
    });
};

export default SermonScreen;
