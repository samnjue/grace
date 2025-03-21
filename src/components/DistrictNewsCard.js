import React, { useEffect, useState, useRef, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, Animated } from "react-native";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { fetchDistrictNews } from "../services/supabaseService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export default function DistrictNewsCard({ refreshKey }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedDistrict = useSelector((state) => state.user.selectedDistrict);
  const theme = useSelector((state) => state.theme.theme);
  const styles = getStyle(theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const refreshNews = async () => {
        if (!selectedDistrict) return;

        try {
          const data = await fetchDistrictNews(selectedDistrict);
          if (data.length > 0) {
            setNews(data);
            await AsyncStorage.setItem(
              `districtNews_${selectedDistrict}`,
              JSON.stringify(data)
            );
          }
        } catch (err) {
          //console.log('Refresh failed:', err);
        }
      };

      refreshNews();
    }, [selectedDistrict])
  );

  useEffect(() => {
    const getNews = async () => {
      if (!selectedDistrict) {
        setError("No district selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await fetchDistrictNews(selectedDistrict);
        if (data.length > 0) {
          setNews(data);
          await AsyncStorage.setItem(
            `districtNews_${selectedDistrict}`,
            JSON.stringify(data)
          );
        } else {
          setError("No information posted");
        }
      } catch (err) {
        setError("Check your connection");
        const cachedNews = await AsyncStorage.getItem(
          `districtNews_${selectedDistrict}`
        );
        if (cachedNews) {
          setNews(JSON.parse(cachedNews));
        }
      } finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 400,
            delay: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    getNews();
  }, [selectedDistrict, refreshKey]);

  const renderNewsItem = ({ item }) => (
    <View style={styles.newsItem}>
      <Text style={styles.newsTitle} maxFontSizeMultiplier={1.2}>
        {item.title}
      </Text>
      <Text style={styles.newsContent} maxFontSizeMultiplier={1.2}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <View>
      {loading ? (
        <Animated.View style={[styles.shimmerWrapper, { opacity: fadeAnim }]}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={
              isDarkTheme
                ? ["#202020", "#181818", "#202020"]
                : ["#e1e1e1", "#eeeeee", "#e1e1e1"]
            }
            style={styles.shimmerCard}
            autoRun={true}
          />
        </Animated.View>
      ) : error ? (
        <Animated.View style={[styles.errorCard]}>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate("DistrictNewsScreen")}
          >
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.errorTitle} maxFontSizeMultiplier={1.2}>
            District News
          </Text>
          <Text style={styles.errorText} maxFontSizeMultiplier={1.2}>
            {error}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.card]}>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate("DistrictNewsScreen")}
          >
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.title} maxFontSizeMultiplier={1.2}>
            District News
          </Text>
          <FlatList
            data={news}
            renderItem={renderNewsItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={styles.emptyText} maxFontSizeMultiplier={1.2}>
                No information posted. Check back later.
              </Text>
            }
            contentContainerStyle={{ flexGrow: 1 }}
            scrollEnabled={false}
          />
        </Animated.View>
      )}
    </View>
  );
}

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  return {
    card: {
      borderRadius: 10,
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      marginBottom: 16,
      padding: 16,
      shadowColor: isDarkTheme ? "#aaa" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
      width: 380,
      maxWidth: 380,
      position: "relative",
    },
    title: {
      fontSize: 19,
      fontWeight: "300",
      marginBottom: 8,
      color: isDarkTheme ? "#fff" : "#000",
    },
    newsItem: {
      marginBottom: 12,
    },
    newsTitle: {
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#333",
      marginBottom: 4,
    },
    newsContent: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#999" : "#555",
    },
    errorText: {
      color: isDarkTheme ? "#999" : "#555",
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 50,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#555",
      textAlign: "center",
      marginVertical: 8,
    },
    errorCard: {
      borderRadius: 10,
      marginBottom: 16,
      padding: 16,
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
      height: 200,
      width: 380,
    },
    errorTitle: {
      fontSize: 19,
      fontWeight: "300",
      marginBottom: 8,
      color: isDarkTheme ? "#fff" : "#000",
    },
    shimmerWrapper: {
      borderRadius: 10,
      marginBottom: 16,
      overflow: "hidden",
    },
    shimmerCard: {
      borderRadius: 10,
      minHeight: 200,
      backgroundColor: isDarkTheme ? "#1d1d1d" : "#eeeeee",
      height: 250,
      width: 380,
    },
    historyButton: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "#6a5acd",
      borderRadius: 20,
      width: 35,
      height: 35,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
  };
};
