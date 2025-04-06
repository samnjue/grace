import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";

export default function SundayGuideScreen() {
  const [guideData, setGuideData] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const scrollViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedDay, initialService } = route.params || {};
  const [isHistoryData, setIsHistoryData] = useState(false);

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  useEffect(() => {
    loadGuideData();
  }, [selectedDay]);

  const getFormattedDate = () => {
    if (selectedDay) return selectedDay;
    const date = new Date();
    const options = { weekday: "long", day: "numeric", month: "long" };
    return date.toLocaleDateString("en-US", options);
  };

  const groupByService = (data) => {
    return data.reduce((acc, item) => {
      if (!acc[item.service]) acc[item.service] = [];
      acc[item.service].push(item);
      return acc;
    }, {});
  };

  const loadGuideData = async () => {
    try {
      const storedHistoryData =
        await AsyncStorage.getItem("SundayGuideHistory");
      const storedData = await AsyncStorage.getItem("sundayGuide");

      let data = [];

      if (storedHistoryData) {
        const parsedHistory = JSON.parse(storedHistoryData);
        if (selectedDay) {
          data = parsedHistory.filter((item) => item.day === selectedDay);
          setIsHistoryData(true);
        }
      }

      if (data.length === 0 && storedData) {
        data = JSON.parse(storedData);
        setIsHistoryData(false);
      } else if (data.length > 0) {
        setIsHistoryData(true);
      }

      const grouped = groupByService(data);
      setGroupedData(grouped);
      setSelectedService(initialService || Object.keys(grouped)[0] || null);
      setGuideData(data);
    } catch (error) {
      console.error("Error loading guide data:", error);
    }
  };

  const renderCards = () => {
    const currentServiceData = groupedData[selectedService] || [];

    return (
      <View style={styles.cardsContainer}>
        {currentServiceData.map((item, index) => (
          <View key={index} style={styles.cardContainer}>
            <View
              style={[
                styles.card,
                item.tenzi_number ? { paddingBottom: 45 } : {},
                item.chapter ? { paddingBottom: 45 } : {},
                item.sermon ? { paddingBottom: 45 } : {},
              ]}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.content}>{item.content}</Text>

              {item.tenzi_number && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    let parsedSongData;
                    try {
                      parsedSongData = JSON.parse(item.songData);
                    } catch (error) {
                      return;
                    }

                    navigation.navigate("SelectedSongScreen", {
                      songTitle: item.songTitle,
                      songData: parsedSongData,
                      type: "Tenzi",
                    });
                  }}
                >
                  <Text style={styles.buttonText}>View</Text>
                </TouchableOpacity>
              )}

              {item.chapter && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    let parsedSongData;
                    try {
                      parsedSongData = JSON.parse(item.songData);
                    } catch (error) {
                      return;
                    }

                    navigation.navigate("ChapterScreen", {
                      book: item.book,
                      chapter: item.chapter,
                    });
                  }}
                >
                  <Text style={styles.buttonText}>View</Text>
                </TouchableOpacity>
              )}

              {item.sermon && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    navigation.navigate("SermonScreen", {
                      sermon_image: item.sermon_image,
                      sermon: item.sermon,
                      sermon_metadata: item.sermon_metadata,
                      sermon_content: item.sermon_content,
                      sermon_audio: item.sermon_audio,
                    });
                  }}
                >
                  <Text style={styles.buttonText}>Open</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {getFormattedDate()}
        </Text>

        {!isHistoryData && (
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => navigation.navigate("SundayGuideHistoryScreen")}
          >
            <Ionicons
              name="time-outline"
              size={24}
              color={isDarkTheme ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Service Selection Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.servicePillsContainer}
        contentContainerStyle={styles.servicePillsContent}
      >
        {Object.keys(groupedData).map((service) => (
          <TouchableOpacity
            key={service}
            style={[
              styles.servicePillButton,
              selectedService === service && {
                backgroundColor: isDarkTheme ? "#6a5acd" : "#928ddf",
                borderColor: isDarkTheme ? "#928ddf" : "#a09de4",
              },
            ]}
            onPress={() => {
              setSelectedService(service);
            }}
          >
            <Text
              style={[
                styles.servicePillButtonText,
                selectedService === service && {
                  color: isDarkTheme ? "#fff" : "#222",
                },
              ]}
            >
              {service}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCards()}
      </ScrollView>
    </View>
  );
}

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  return {
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    backButton: {
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: "SourceSerif4_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    cardsContainer: {
      paddingHorizontal: 20,
      alignItems: "center",
      marginTop: 16,
    },
    cardContainer: {
      marginBottom: 20,
      width: "100%",
      maxWidth: 500,
    },
    card: {
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      borderRadius: 10,
      padding: 19,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    title: {
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#333",
      marginBottom: 8,
    },
    content: {
      fontSize: 16,
      fontFamily: "SourceSerif4_700Bold",
      color: isDarkTheme ? "#dedede" : "#555",
      lineHeight: 20,
    },
    viewButton: {
      position: "absolute",
      bottom: 10,
      right: 10,
      backgroundColor: "#6a5acd",
      paddingVertical: 6,
      paddingHorizontal: 15,
      borderRadius: 20,
    },
    buttonText: {
      color: "white",
      fontFamily: "Inter_700Bold",
    },
    timeButton: {
      marginLeft: "auto",
      padding: 8,
      borderRadius: 20,
      backgroundColor: isDarkTheme ? "#333" : "#f0f0f0",
      elevation: 3,
    },
    servicePillsContainer: {
      maxHeight: 50,
      marginBottom: 10,
    },
    servicePillsContent: {
      paddingHorizontal: 12,
    },
    servicePillButton: {
      marginTop: 2,
      marginHorizontal: 7,
      alignSelf: "center",
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#EDEDED",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: isDarkTheme ? "#fff" : "#555",
    },
    servicePillButtonText: {
      color: isDarkTheme ? "#fff" : "#555",
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
  };
};
