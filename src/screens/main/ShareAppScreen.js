import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Clipboard from "@react-native-clipboard/clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../redux/slices/themeSlice";

const ShareAppScreen = ({ navigation }) => {
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const appLink =
    "https://play.google.com/store/apps/details?id=com.grace.ivory";

  const handleCopyLink = () => {
    Clipboard.setString(appLink);
    setIsSuccessModalVisible(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out the Grace app: ${appLink}`,
      });
    } catch (error) {
      console.error("Error sharing app link:", error);
    }
  };

  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  const styles = getStyle(theme);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("appTheme");
        if (storedTheme) {
          dispatch(setTheme(storedTheme));
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    loadTheme();
  }, [dispatch]);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("appTheme", theme);
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    };

    saveTheme();
  }, [theme]);

  // useEffect(() => {
  //   NavigationBar.setBackgroundColorAsync(isDarkTheme ? "#121212" : "#fff");
  //   NavigationBar.setButtonStyleAsync(isDarkTheme ? "dark" : "light");
  // }, [isDarkTheme]);

  return (
    <View style={styles.container}>
      {/* <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#121212" : "#fff"}
      /> */}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            style={{ color: isDarkTheme ? "#fff" : "#000" }}
          />
        </TouchableOpacity>
        <Text style={styles.headerText} maxFontSizeMultiplier={1}>
          Share Play Store Link
        </Text>
      </View>

      {/* App Image and Name */}
      <View style={styles.content}>
        <Image
          source={require("../../../assets/adaptive-icon.png")}
          style={styles.image}
        />
        <Text style={styles.appName} maxFontSizeMultiplier={1}>
          Grace
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
          <Text style={styles.copyButtonText} maxFontSizeMultiplier={1.2}>
            Copy Link
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText} maxFontSizeMultiplier={1.2}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSuccessModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons
              name="checkmark-circle"
              size={80}
              color="#32d15d"
              style={{ paddingTop: -10, bottom: 5 }}
            />
            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
              Link copied to clipboard!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalButtonText} maxFontSizeMultiplier={1.2}>
                Nice!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();
  return {
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingTop: insets.top,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      //marginBottom: 20,
      padding: 16,
    },
    headerText: {
      marginLeft: 10,
      fontSize: 18,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    content: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    image: {
      width: 400,
      height: 400,
      resizeMode: "contain",
      bottom: 40,
    },
    appName: {
      marginTop: 20,
      bottom: 130,
      fontSize: 30,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      bottom: 30,
      padding: 18,
    },
    copyButton: {
      flex: 1,
      marginRight: 10,
      backgroundColor: "#d3d3d3",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
    },
    copyButtonText: {
      fontFamily: "Inter_700Bold",
      color: "#000",
      fontSize: 16,
    },
    shareButton: {
      flex: 1,
      marginLeft: 10,
      backgroundColor: "#6a5acd",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
    },
    shareButtonText: {
      fontFamily: "Inter_700Bold",
      color: "#fff",
      fontSize: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      //backgroundColor: "rgba(0, 0, 0, 0.1)",
    },
    modalContent: {
      backgroundColor: isDarkTheme ? "#000" : "#fff",
      borderRadius: 25,
      padding: 45,
      paddingTop: 20,
      alignItems: "center",
      width: "80%",
      borderColor: isDarkTheme ? "" : "#333",
      borderWidth: 0.5,
    },
    modalText: {
      fontSize: 22,
      color: isDarkTheme ? "#fff" : "#000",
      marginVertical: 7,
      marginTop: -10,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
      top: 18,
    },
    modalButton: {
      marginTop: 20,
      backgroundColor: "#6a5acd",
      height: 50,
      width: 150,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      top: 25,
    },
    modalButtonText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      textAlign: "center",
    },
  };
};

export default ShareAppScreen;
