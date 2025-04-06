import React, { useState, useCallback, useEffect } from "react";
import {
  RefreshControl,
  View,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  BackHandler,
  StatusBar,
  Alert,
} from "react-native";
import VerseCard from "../../components/VerseCard";
import DistrictNewsCard from "../../components/DistrictNewsCard";
import SundayGuideCard from "../../components/SundayGuideCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { useFocusEffect } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTheme } from "../../redux/slices/themeSlice";
import { supabase } from "../../utils/supabase";
import { logIn } from "../../redux/slices/userSlice";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  const refreshSession = async () => {
    try {
      const savedSession = await AsyncStorage.getItem("supabaseSession");
      if (!savedSession) return;

      const session = JSON.parse(savedSession);
      const { expires_at, refresh_token } = session;

      const currentTime = Math.floor(Date.now() / 1000);
      if (expires_at - currentTime > 300) {
        return;
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        console.error("Session refresh error:", error);
        return;
      }

      if (data?.session) {
        await AsyncStorage.setItem(
          "supabaseSession",
          JSON.stringify(data.session)
        );
        await AsyncStorage.setItem("userSession", JSON.stringify(data.session));

        dispatch(
          logIn({ email: data.session.user.email, session: data.session })
        );
        console.log("Session refreshed successfully");
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshSession, 1000 * 60 * 5);
    refreshSession();

    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        Alert.alert("Error", "Unable to fetch user data");
        return;
      }

      setUserUID(user.id);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (userError) {
        Alert.alert("Error", "Unable to fetch profile data");
        return;
      }

      setDisplayName(userData.display_name || "");
      setProfileImage(userData.profile_image_url || "");

      await AsyncStorage.setItem("displayName", userData.display_name || "");
      await AsyncStorage.setItem(
        "profileImage",
        userData.profile_image_url || ""
      );
    } catch (err) {
      //Alert.alert('Error', 'Something went wrong');
    }
  };

  const loadOfflineData = async () => {
    try {
      const offlineDisplayName = await AsyncStorage.getItem("displayName");
      const offlineProfileImage = await AsyncStorage.getItem("profileImage");

      if (offlineDisplayName) setDisplayName(offlineDisplayName);
      if (offlineProfileImage) setProfileImage(offlineProfileImage);
    } catch (err) {
      console.error("Failed to load offline data:", err);
    }
  };

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const savedSession = await AsyncStorage.getItem("supabaseSession");
        if (savedSession) {
          const session = JSON.parse(savedSession);

          const { error } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });

          if (error) {
            console.error("Failed to restore session:", error);
            Alert.alert(
              "Error",
              "Failed to restore user session. Please log in again."
            );
            return;
          }
        }

        await loadOfflineData();

        await fetchUserData();
      } catch (err) {
        console.error("Session initialization error:", err);
        Alert.alert(
          "Error",
          "An unexpected error occurred while restoring your session."
        );
      }
    };

    initializeProfile();
  }, []);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("appTheme");
        if (storedTheme) {
          dispatch(setTheme(storedTheme));
        }
      } catch (error) {
        //console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, [dispatch]);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("appTheme", theme);
      } catch (error) {
        //console.error('Error saving theme:', error);
      }
    };

    saveTheme();
  }, [theme]);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(isDarkTheme ? "#121212" : "#fff");
    NavigationBar.setButtonStyleAsync(isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((prevKey) => prevKey + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 10);
  }, []);

  const handleBackPress = () => {
    setIsExitModalVisible(true);
    return true;
  };

  useFocusEffect(
    React.useCallback(() => {
      BackHandler.addEventListener("hardwareBackPress", handleBackPress);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    }, [])
  );

  const renderItem = ({ item }) => {
    switch (item) {
      case "VerseCard":
        return <VerseCard refreshKey={refreshKey} />;
      case "DistrictNewsCard":
        return <DistrictNewsCard refreshKey={refreshKey} />;
      case "SundayGuideCard":
        return <SundayGuideCard refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        //paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: isDarkTheme ? "#121212" : "#fff",
        marginBottom: 15,
      }}
    >
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#121212" : "#fff"}
      />
      <Header title="Home" />
      <FlatList
        data={["VerseCard", "DistrictNewsCard", "SundayGuideCard"]}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6A5ACD"]}
          />
        }
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Exit App Modal */}
      <Modal
        visible={isExitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsExitModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Are you sure you want to exit Grace?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.exitButton}
                onPress={() => {
                  setIsExitModalVisible(false);
                  BackHandler.exitApp();
                }}
              >
                <Text style={styles.exitButtonText}>Exit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsExitModalVisible(false)}
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
  return {
    scrollContainer: {
      padding: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
    },
    modalContent: {
      width: "80%",
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
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
    cancelButton: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      marginRight: 10,
    },
    cancelButtonText: {
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
      fontSize: 16,
    },
    exitButton: {
      flex: 1,
      backgroundColor: "#D2042D",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      marginLeft: 10,
    },
    exitButtonText: {
      fontFamily: "Inter_700Bold",
      color: "#fff",
      fontSize: 16,
    },
  };
};
