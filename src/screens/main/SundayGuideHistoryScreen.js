import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { fetchSundayGuide } from "../../services/supabaseService";

export default function SundayGuideHistoryScreen() {
  const [groupedHistory, setGroupedHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedChurch, setSelectedChurch] = useState(null);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const getSelectedChurch = async () => {
      try {
        const storedChurch = await AsyncStorage.getItem("selectedChurch");
        if (storedChurch) {
          const parsedChurch = JSON.parse(storedChurch);
          setSelectedChurch(parsedChurch);
          fetchHistory(parsedChurch.church_id);
        } else {
          setError("No church selected");
          setLoading(false);
        }
      } catch (error) {
        setError("Error retrieving church information");
        setLoading(false);
      }
    };

    const fetchHistory = async (churchId) => {
      if (!churchId) {
        setError("Church ID is undefined");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const historyData = await fetchSundayGuide(churchId);

        if (historyData.length > 0) {
          await AsyncStorage.setItem(
            "SundayGuideHistory",
            JSON.stringify(historyData)
          );

          const groupedData = historyData.reduce((acc, item) => {
            if (!acc[item.day]) {
              acc[item.day] = [];
            }
            acc[item.day].push(item);
            return acc;
          }, {});

          setGroupedHistory(groupedData);
        } else {
          setError("No history available");
        }
      } catch (err) {
        setError("Error fetching history. Check your connection.");
        const cachedHistory = await AsyncStorage.getItem("SundayGuideHistory");
        if (cachedHistory) {
          setGroupedHistory(JSON.parse(cachedHistory));
        }
      } finally {
        setLoading(false);
      }
    };

    getSelectedChurch();
  }, []);

  const renderHistoryCards = () => {
    const days = Object.keys(groupedHistory).reverse();
    if (days.length === 0) {
      return (
        <Text style={styles.emptyText}>{error || "No content available"}</Text>
      );
    }

    return days.map((day) => (
      <TouchableOpacity
        key={day}
        style={styles.historyCard}
        onPress={() =>
          navigation.navigate("SundayGuideScreen", { selectedDay: day })
        }
      >
        <Text style={styles.historyDay}>{day}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        <Text style={styles.headerTitle}>Sunday Guide History</Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#6a5acd" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>{renderHistoryCards()}</View>
        </ScrollView>
      )}
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
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    contentContainer: {
      paddingBottom: 20,
    },
    historyCard: {
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#f0f0f0",
      padding: 20,
      paddingVertical: 30,
      borderRadius: 10,
      marginBottom: 12,
    },
    historyDay: {
      fontSize: 18,
      fontFamily: "SourceSerif4_700Bold",
      color: isDarkTheme ? "#fff" : "#333",
      marginBottom: 4,
    },
    historySubtitle: {
      fontSize: 14,
      color: isDarkTheme ? "#bbb" : "#555",
    },
    emptyText: {
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#999" : "#555",
      textAlign: "center",
      marginTop: 20,
    },
  };
};
