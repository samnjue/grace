import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchDistrictNewsScreen } from "../../services/supabaseService";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";
import { deleteNewsItem } from "../../services/supabaseService";

export default function DistrictNewsScreen() {
  const theme = useSelector((state) => state.theme.theme);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [newsItemToDelete, setNewsItemToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const styles = getStyle(theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  useEffect(() => {
    const fetchSelectedDistrict = async () => {
      try {
        const storedDistrict = await AsyncStorage.getItem("selectedDistrict");

        if (storedDistrict) {
          const parsedDistrict = JSON.parse(storedDistrict);

          const districtWithCorrectKey = {
            ...parsedDistrict,
            district_id: parsedDistrict.district_id,
          };
          setSelectedDistrict(districtWithCorrectKey);
          setError("");
        } else {
          setError("No district selected");
        }
      } catch (error) {
        console.error("Error retrieving district information:", error);
        setError("Error retrieving district information");
      }
    };

    fetchSelectedDistrict();
  }, []);

  // useEffect(() => {

  // }, [selectedDistrict]);

  const getNews = async () => {
    if (!selectedDistrict) return;

    try {
      setLoading(true);
      const data = await fetchDistrictNewsScreen(selectedDistrict.district_id);
      if (data.length > 0) {
        setNews(data);
        await AsyncStorage.setItem("districtNews", JSON.stringify(data));
        setError("");
      } else {
        setError("No information posted");
      }
    } catch {
      setError("Check your connection");
      const cachedNews = await AsyncStorage.getItem("districtNews");
      if (cachedNews) {
        setNews(JSON.parse(cachedNews));
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getNews();
    }, [selectedDistrict])
  );

  const formatDate = (isoString) => {
    const postDate = new Date(isoString);
    const now = new Date();
    const timeDifference = now - postDate;
    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 2 * oneDay;

    const hours = postDate.getHours() % 12 || 12;
    const minutes = String(postDate.getMinutes()).padStart(2, "0");
    const ampm = postDate.getHours() >= 12 ? "pm" : "am";

    if (timeDifference < oneDay) {
      return `${hours}:${minutes} ${ampm}`;
    } else if (timeDifference < twoDays) {
      return `Yesterday ${hours}:${minutes} ${ampm}`;
    } else {
      const postYear = postDate.getFullYear();
      const nowYear = now.getFullYear();
      const day = postDate.getDate();
      const month = postDate.toLocaleString("default", { month: "short" });

      if (postYear === nowYear) {
        return `${day} ${month} ${hours}:${minutes} ${ampm}`;
      } else {
        return `${day} ${month} ${postYear} ${hours}:${minutes} ${ampm}`;
      }
    }
  };

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!error && user) {
        setCurrentUser(user);
      }
    };
    fetchCurrentUser();
  }, []);

  const renderNewsItem = ({ item }, currentUser) => {
    return (
      <View style={styles.newsCard}>
        <Text style={styles.newsTitle} maxFontSizeMultiplier={1.2}>
          {item.title}
        </Text>
        <Text style={styles.newsContent} maxFontSizeMultiplier={1.2}>
          {item.content}
        </Text>
        <Text style={styles.postInfo} maxFontSizeMultiplier={1.2}>
          {`posted by ${item.user_name || "Anonymous"} · ${item.date ? formatDate(item.date) : "Unknown date"}`}
        </Text>
        {currentUser?.id === item.user_id && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item)}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={isDarkTheme ? "#aaa" : "#888"}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleDeletePress = async (item) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("User not authenticated");
      return;
    }

    if (item.user_id === user.id) {
      setNewsItemToDelete(item);
      setIsDeleteModalVisible(true);
    }
  };

  const confirmDelete = async () => {
    if (!newsItemToDelete) return;

    try {
      await deleteNewsItem(newsItemToDelete.id);
      setNews(news.filter((newsItem) => newsItem.id !== newsItemToDelete.id));
      setIsDeleteModalVisible(false);
    } catch (error) {
      setError("Error deleting the post");
    }
  };

  const handleRefresh = async () => {
    const getNews = async () => {
      if (!selectedDistrict) return;

      try {
        setLoading(true);
        const data = await fetchDistrictNewsScreen(
          selectedDistrict.district_id
        );
        if (data.length > 0) {
          setNews(data);
          await AsyncStorage.setItem("districtNews", JSON.stringify(data));
          setError("");
        } else {
          setError("No information posted");
        }
      } catch {
        setError("Check your connection");
        const cachedNews = await AsyncStorage.getItem("districtNews");
        if (cachedNews) {
          setNews(JSON.parse(cachedNews));
        }
      } finally {
        setLoading(false);
      }
    };

    setRefreshing(true);
    await getNews();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.toLowerCase().includes("dark") ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>District News</Text>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#6A5ACD" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {/* Floating Button */}
          {!error.includes("Check your connection") && (
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => navigation.navigate("PostNewsScreen")}
            >
              <Ionicons name="chatbox-ellipses" size={24} color="#fff" />
              <Text style={styles.floatingButtonText}>Announce</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={news}
          renderItem={(item) => renderNewsItem(item, currentUser)}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No information posted. Check back later
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#6A5ACD"]}
            />
          }
        />
      )}

      {/* Floating Button */}
      {!error.includes("Check your connection") && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate("PostNewsScreen")}
        >
          <Ionicons name="chatbox-ellipses" size={24} color="#fff" />
          <Text style={styles.floatingButtonText}>Announce</Text>
        </TouchableOpacity>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Delete post?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.exitButton}
                onPress={confirmDelete}
              >
                <Text style={styles.exitButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();
  return {
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomColor: isDarkTheme ? "#121212" : "#fff",
    },
    backButton: {
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      fontSize: 17,
      fontWeight: "bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    listContainer: {
      padding: 16,
      paddingBottom: 55,
    },
    newsCard: {
      borderWidth: 1,
      borderColor: isDarkTheme ? "#444" : "#ddd",
      backgroundColor: isDarkTheme ? "#1e1e1e" : "#f9f9f9",
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    newsTitle: {
      fontSize: 18,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
      marginBottom: 8,
    },
    newsContent: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#ddd" : "#333",
    },
    emptyText: {
      fontSize: 16,
      textAlign: "center",
      color: isDarkTheme ? "#999" : "#555",
    },
    floatingButton: {
      position: "absolute",
      bottom: 16 + insets.top,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#6a5acd",
      borderRadius: 30,
      paddingHorizontal: 16,
      paddingVertical: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    floatingButtonText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      marginLeft: 8,
    },
    postInfo: {
      marginTop: 21,
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#aaa" : "#666",
      textAlign: "right",
    },
    deleteButton: {
      position: "absolute",
      top: 10,
      left: 340,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      //backgroundColor: "rgba(0, 0, 0, 0.1)",
      elevation: 5,
      shadowColor: isDarkTheme ? "#ccc" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
    },
    modalContent: {
      width: "80%",
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
    },
    modalText: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#fff" : "#555",
      textAlign: "center",
      marginBottom: 10,
      marginTop: 10,
    },
    modalButtonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 25,
      width: "100%",
    },
    exitButton: {
      flex: 1,
      backgroundColor: "#D2042D",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      marginLeft: 10,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      marginRight: 10,
    },
    exitButtonText: {
      fontFamily: "Inter_700Bold",
      color: "#fff",
      fontSize: 16,
    },
    cancelButtonText: {
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
      fontSize: 16,
    },
  };
};
