import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { fetchSundayGuide } from "../services/supabaseService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import Modal from "react-native-modal";
import { supabase } from "../utils/supabase";

export default function SundayGuideCard({ refreshKey }) {
  const [guideData, setGuideData] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedChurch, setSelectedChurch] = useState(null);
  const theme = useSelector((state) => state.theme.theme);
  const styles = getStyle(theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const [isEditor, setIsEditor] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("editor")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setIsEditor(data.editor);
      }
    };

    fetchUserRole();
  }, []);

  const getTodayDateString = () => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    const getSelectedChurch = async () => {
      try {
        const storedChurch = await AsyncStorage.getItem("selectedChurch");
        if (storedChurch) {
          setSelectedChurch(JSON.parse(storedChurch));
          setError("");
        } else {
          setError("No church selected");
        }
      } catch (error) {
        setError("Error retrieving church information");
      }
    };

    getSelectedChurch();
  }, [refreshKey]);

  const fetchAndUpdateGuide = async () => {
    if (!selectedChurch || !selectedChurch.church_id) {
      setError("Church ID is undefined");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await fetchSundayGuide(selectedChurch.church_id);
      const todayString = getTodayDateString();
      const matchingEntries = data.filter((entry) => entry.day === todayString);

      if (matchingEntries.length > 0) {
        const grouped = groupByService(matchingEntries);
        setGroupedData(grouped);
        setSelectedService(Object.keys(grouped)[0] || null);
        setGuideData(matchingEntries);
        await AsyncStorage.setItem(
          "sundayGuide",
          JSON.stringify(matchingEntries)
        );
      } else {
        setGuideData([]);
        setGroupedData({});
        setError("No new content available at this time");
        await AsyncStorage.setItem("sundayGuide", JSON.stringify([]));
      }
    } catch (err) {
      setError("Check your connection");
      const cachedGuide = await AsyncStorage.getItem("sundayGuide");
      if (cachedGuide) {
        const cachedData = JSON.parse(cachedGuide);
        setGuideData(cachedData);
        setGroupedData(groupByService(cachedData));
        setSelectedService(Object.keys(groupByService(cachedData))[0] || null);
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

  useEffect(() => {
    if (selectedChurch) {
      fetchAndUpdateGuide();
    }
  }, [selectedChurch, refreshKey]);

  useFocusEffect(
    useCallback(() => {
      const checkForUpdates = async () => {
        if (!selectedChurch || !selectedChurch.church_id) return;

        try {
          const data = await fetchSundayGuide(selectedChurch.church_id);
          const todayString = getTodayDateString();
          const matchingEntries = data.filter(
            (entry) => entry.day === todayString
          );

          const cachedGuide = await AsyncStorage.getItem("sundayGuide");
          const cachedData = cachedGuide ? JSON.parse(cachedGuide) : [];

          if (JSON.stringify(matchingEntries) !== JSON.stringify(cachedData)) {
            setGuideData(matchingEntries);
            setGroupedData(groupByService(matchingEntries));
            setSelectedService(
              Object.keys(groupByService(matchingEntries))[0] || null
            );
            await AsyncStorage.setItem(
              "sundayGuide",
              JSON.stringify(matchingEntries)
            );
          }
        } catch (err) {
          //console.log('Refresh failed:', err);
        }
      };

      checkForUpdates();
    }, [selectedChurch])
  );

  const groupByService = (data) => {
    return data.reduce((acc, item) => {
      if (!acc[item.service]) acc[item.service] = [];
      acc[item.service].push(item);
      return acc;
    }, {});
  };

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
          <Text style={styles.errorTitle}>Sunday Guide</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.historyPillButton}
            onPress={() => navigation.navigate("SundayGuideHistoryScreen")}
          >
            <Text style={styles.historyPillButtonText}>
              View previous guides
            </Text>
          </TouchableOpacity>
          {isEditor && (
            <TouchableOpacity
              style={[styles.historyButton, { right: 10 }]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color="white" />
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        <Animated.View style={[styles.card]}>
          <Text style={styles.title}>Sunday Guide</Text>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate("SundayGuideScreen")}
          >
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>
          {isEditor && (
            <TouchableOpacity
              style={[styles.historyButton, { right: 60 }]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color="white" />
            </TouchableOpacity>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            {Object.keys(groupedData).map((service) => (
              <TouchableOpacity
                key={service}
                style={[
                  styles.servicePillButton,
                  selectedService === service && {
                    backgroundColor: isDarkTheme ? "#444" : "#bbb",
                    borderColor: isDarkTheme ? "#fff" : "#222",
                  },
                ]}
                onPress={() => setSelectedService(service)}
              >
                <Text
                  style={[
                    styles.historyPillButtonText,
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

          <FlatList
            data={(groupedData[selectedService] || []).slice(0, 3)}
            renderItem={({ item }) => (
              <View style={styles.guideItem}>
                <Text style={styles.guideTitle}>{item.title}</Text>
                <Text style={styles.guideContent}>{item.content}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No new content available</Text>
            }
            contentContainerStyle={{ flexGrow: 1 }}
            scrollEnabled={false}
          />
        </Animated.View>
      )}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onSwipeComplete={() => setModalVisible(false)}
        swipeDirection="down"
        style={{ justifyContent: "flex-end", margin: 0 }}
        backdropColor="rgba(0, 0, 0, 0.07)"
        animationInTiming={400}
        animationOutTiming={400}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalBar} />
          <Text style={styles.modalTitle}>Edit Sunday Guide</Text>
          <TouchableOpacity style={styles.modalButton}>
            <Text style={styles.modalButtonText}>Create new programme</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton}>
            <Text style={styles.modalButtonText}>Edit existing programme</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  return {
    card: {
      borderRadius: 10,
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      marginBottom: 40,
      padding: 16,
      shadowColor: isDarkTheme ? "#aaa" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
      width: 380,
      maxWidth: 380,
    },
    title: {
      fontSize: 19,
      fontWeight: "300",
      marginBottom: 8,
      color: isDarkTheme ? "#fff" : "#000",
    },
    guideItem: {
      marginBottom: 12,
    },
    guideTitle: {
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#333",
      marginBottom: 4,
    },
    guideContent: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#999" : "#555",
    },
    errorText: {
      color: isDarkTheme ? "#999" : "#555",
      fontSize: 14,
      fontFamily: "Archivo_700Bold",
      textAlign: "center",
      marginVertical: 25,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#999" : "#555",
      textAlign: "center",
      marginVertical: 50,
    },
    errorCard: {
      height: 200,
      width: 380,
      borderRadius: 10,
      marginBottom: 40,
      padding: 16,
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
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
      backgroundColor: "#6A5ACD",
      borderRadius: 20,
      width: 35,
      height: 35,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    historyPillButton: {
      marginTop: 2,
      alignSelf: "center",
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#EDEDED",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: isDarkTheme ? "#fff" : "#555",
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
    historyPillButtonText: {
      color: isDarkTheme ? "#fff" : "#555",
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.07)",
    },
    modalContent: {
      backgroundColor: isDarkTheme ? "#292929" : "#fff",
      padding: 20,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      alignItems: "center",
    },
    modalBar: {
      width: 70,
      height: 5,
      backgroundColor: "#aaa",
      borderRadius: 10,
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: "Archivo_700Bold",
      marginBottom: 20,
      color: isDarkTheme ? "#fff" : "#333",
    },
    modalButton: {
      width: "90%",
      padding: 15,
      backgroundColor: isDarkTheme ? "#121212" : "#ededed",
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 10,
    },
    modalButtonText: {
      color: isDarkTheme ? "#fff" : "#333",
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
    modalCloseText: {
      color: "#6A5ACD",
      marginTop: 10,
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
  };
};
