import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Linking,
  ScrollView,
  BackHandler,
  StatusBar,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { supabase } from "../../utils/supabase";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logOut } from "../../redux/slices/userSlice";
import { useSelector } from "react-redux";
import { setTheme } from "../../redux/slices/themeSlice";
import * as NavigationBar from "expo-navigation-bar";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useFocusEffect } from "@react-navigation/native";

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const [userUID, setUserUID] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);
  const [isLogOutModalVisible, setIsLogOutModalVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("");
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

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
      Alert.alert("Error", "Something went wrong");
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

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

  const getBlobFromUri = async (uri) => {
    try {
      const response = await fetch(uri);
      if (!response.ok) throw new Error("Failed to fetch image URI");
      return await response.blob();
    } catch (error) {
      console.error("Blob creation error:", error);
      throw error;
    }
  };

  const resizeImage = async (uri) => {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 100, height: 100 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  };

  const handleProfileImageChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        console.log("Image URI:", imageUri);

        const resizedUri = await resizeImage(imageUri);
        console.log("Resized Image URI:", resizedUri);

        const blob = await getBlobFromUri(resizedUri);
        console.log("Blob created successfully");

        const fileName = `${userUID}-${Date.now()}.jpg`;
        console.log("File name:", fileName);

        const { data, error } = await supabase.storage
          .from("profile_images")
          .upload(fileName, blob, {
            contentType: "image/jpeg",
          });

        if (error) {
          console.error("Supabase upload error:", error);
          Alert.alert("Error", "Failed to upload image to storage");
          return;
        }

        console.log("Upload successful:", data);

        const { data: publicUrlData } = supabase.storage
          .from("profile_images")
          .getPublicUrl(fileName);

        const publicUrl = publicUrlData?.publicUrl;
        if (!publicUrl) {
          console.error("Failed to retrieve public URL");
          Alert.alert("Error", "Could not get image public URL");
          return;
        }

        console.log("Public URL:", publicUrl);

        const { error: updateError } = await supabase
          .from("users")
          .update({ profile_image_url: publicUrl })
          .eq("id", userUID);

        if (updateError) {
          console.error("Database update error:", updateError);
          Alert.alert(
            "Error",
            "Failed to update profile image in the database"
          );
          return;
        }

        setProfileImage(publicUrl);
        await AsyncStorage.setItem("profileImage", publicUrl);

        Alert.alert("Success", "Profile image updated successfully");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      Alert.alert("Error", "Something went wrong while uploading the image");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handleLogOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);

      await AsyncStorage.multiRemove([
        "userSession",
        "selectedChurch",
        "selectedDistrict",
        "supabaseSession",
      ]);

      dispatch(logOut());
      navigation.replace("AuthStack");
    } catch (err) {
      setErrorMessage("Failed to log out. Please try again.");
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => false
    );
    return () => backHandler.remove();
  }, []);

  const openPlayStore = () => {
    Linking.openURL(
      "https://play.google.com/store/apps/details?id=com.grace.ivory"
    );
  };

  const openWebsite = () => {
    Linking.openURL("https://ivorykenya.wordpress.com/about/");
  };

  const showThemeSelector = () => {
    setThemeModalVisible(true);
  };

  const handleThemeChange = async (theme) => {
    try {
      setSelectedTheme(theme);
      await AsyncStorage.setItem("selectedTheme", theme);
      dispatch(setTheme(theme));
      setThemeModalVisible(false);
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  };

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("selectedTheme");
        if (savedTheme) {
          dispatch(setTheme(savedTheme));
        }
      } catch (err) {
        console.error("Failed to load theme from AsyncStorage:", err);
      }
    };
    loadSavedTheme();
  }, [dispatch]);

  const styles = getStyle(theme);

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("selectedTheme");
        if (savedTheme) {
          dispatch(setTheme(savedTheme));
          setSelectedTheme(savedTheme);
        }
      } catch (err) {
        console.error("Failed to load theme from AsyncStorage:", err);
      }
    };
    loadSavedTheme();
  }, [dispatch]);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(isDarkTheme ? "#121212" : "#fff");
    NavigationBar.setButtonStyleAsync(isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#121212" : "#fff"}
      />
      <Header title="Profile" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6A5ACD"]}
          />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => navigation.navigate("mpesaScreen")}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <Ionicons name="person-circle" size={70} color="gray" />
            )}
          </TouchableOpacity>

          <View style={styles.uidContainer}>
            <Text style={styles.uidText} maxFontSizeMultiplier={0}>
              {errorMessage || (displayName ? displayName : `#${userUID}`)}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("EditScreen")}>
              <Ionicons
                name="create-outline"
                size={25}
                color={isDarkTheme ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={0}>
            SETTINGS
          </Text>
          {/* <Notification /> */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("ShareScreen")}
          >
            <Ionicons
              name="link-outline"
              size={30}
              color={isDarkTheme ? "#fff" : "#333"}
            />
            <Text style={styles.buttonText} maxFontSizeMultiplier={0}>
              Share App Link
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={showThemeSelector}>
            <Ionicons
              name="bulb-outline"
              size={30}
              color={isDarkTheme ? "#fff" : "#333"}
            />
            <Text style={styles.buttonText}>Appearance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logOutButton}
            onPress={() => setIsLogOutModalVisible(true)}
          >
            <Ionicons name="log-out-outline" size={28} color="white" />
            <Text style={styles.logOutText} maxFontSizeMultiplier={0}>
              LOG OUT
            </Text>
          </TouchableOpacity>
        </View>

        {/* Log Out Modal */}
        <Modal
          visible={isLogOutModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsLogOutModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Are you sure you want to log out?
              </Text>
              <View style={styles.modalButtons}>
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.yesButton}
                    onPress={handleLogOut}
                  >
                    <Text style={styles.yesButtonText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsLogOutModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Theme Selector Modal */}
        <Modal
          visible={isThemeModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={() => setThemeModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.themeModalTitle} maxFontSizeMultiplier={0}>
                Appearance
              </Text>
              {["Light Theme", "Dark Theme"].map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={styles.modalOption}
                  onPress={() => handleThemeChange(theme)}
                >
                  <Ionicons
                    name={
                      selectedTheme === theme
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color="#6a5acd"
                  />
                  <Text
                    style={styles.themeModalOptionText}
                    maxFontSizeMultiplier={0}
                  >
                    {theme}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalButton}
                  onPress={() => setThemeModalVisible(false)}
                >
                  <Text
                    style={styles.modalButtonText}
                    maxFontSizeMultiplier={0}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={0}>
            SUPPORT
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("ContactScreen")}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={30}
              color={isDarkTheme ? "#fff" : "#333"}
            />
            <Text style={styles.buttonText} maxFontSizeMultiplier={0}>
              Contact Us
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.section, { paddingTop: 5 }]}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={0}>
            ABOUT
          </Text>
          <TouchableOpacity
            style={[styles.button, { paddingBottom: 10, marginBottom: 10 }]}
            onPress={openPlayStore}
          >
            <Ionicons
              name="star-outline"
              size={30}
              color={isDarkTheme ? "#fff" : "#333"}
            />
            <Text style={styles.buttonText} maxFontSizeMultiplier={0}>
              Rate the App
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button]} onPress={openWebsite}>
            <Ionicons
              name="information-circle-outline"
              size={32}
              color={isDarkTheme ? "#fff" : "#333"}
            />
            <Text style={styles.buttonText} maxFontSizeMultiplier={0}>
              Privacy Policy & Account Deletion
            </Text>
          </TouchableOpacity>
          <Text style={styles.versionText} maxFontSizeMultiplier={0}>
            v1.13.36
          </Text>
          {/* <Text style={styles.versionText} maxFontSizeMultiplier={0}>
                        © 2025 ivory
                    </Text> */}
        </View>
      </ScrollView>
    </View>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  return {
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
    },
    profileSection: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      paddingBottom: 10,
      paddingTop: 5,
    },
    uidContainer: {
      flex: 1,
      flexWrap: "wrap",
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 10,
    },
    uidText: {
      fontSize: 17,
      fontWeight: "bold",
      color: isDarkTheme ? "#f5f5f5" : "#333",
      marginRight: 10,
      flexShrink: 1,
    },
    section: {
      padding: 15,
      paddingBottom: -8,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#FFF" : "#333",
      marginBottom: 10,
      left: 4,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      marginBottom: 15,
    },
    buttonText: {
      marginLeft: 10,
      fontSize: 17,
      fontFamily: "Inter",
      color: isDarkTheme ? "#FFF" : "#333",
    },
    logOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "red",
      padding: 10,
      borderRadius: 25,
      marginTop: 10,
    },
    logOutText: {
      color: "white",
      fontFamily: "Inter_700Bold",
      marginLeft: 5,
      fontSize: 15,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
    },
    modalContent: {
      width: "80%",
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#fff",
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#fff" : "#333",
      textAlign: "center",
      marginBottom: 10,
      marginTop: 10,
    },
    themeModalTitle: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#fff" : "#333",
      right: 75,
      bottom: 20,
      marginBottom: 0,
      marginTop: 10,
    },
    themeModalOptionText: {
      fontSize: 16,
      fontFamily: "Inter_500Medium",
      color: isDarkTheme ? "#fff" : "#333",
      paddingLeft: 10,
    },
    modalButtonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      width: "100%",
      marginBottom: 10,
      marginLeft: 10,
    },
    modalOptionText: {
      fontSize: 16,
      marginLeft: 10,
      fontFamily: "Inter",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
    },
    yesButton: {
      flex: 1,
      backgroundColor: "red",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      marginLeft: 10,
    },
    yesButtonText: {
      fontFamily: "Inter_700Bold",
      color: "#fff",
      fontSize: 16,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: "#fff",
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#fff",
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
    modalButtonText: {
      fontSize: 18,
      color: "#6a5acd",
      fontFamily: "Inter_700Bold",
    },
    versionText: {
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      color: "gray",
      marginTop: 10,
      left: 10,
    },
    scrollContent: {
      paddingBottom: 60,
    },
  };
};

export default ProfileScreen;
