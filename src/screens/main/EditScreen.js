import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../redux/slices/themeSlice";
import * as NavigationBar from "expo-navigation-bar";

const EditScreen = ({ navigation }) => {
  const [displayName, setDisplayName] = useState("");
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

  const handleInputChange = (text) => {
    setDisplayName(text);
    setIsButtonVisible(
      text.trim() !== "" && /^[a-zA-Z\s]*$/.test(text) && text.length <= 25
    );
  };

  const handleDone = async () => {
    if (displayName.length > 25) {
      setErrorMessage("Excess characters");
      setIsErrorModalVisible(true);
    } else if (!/^[a-zA-Z\s]*$/.test(displayName)) {
      setErrorMessage("Invalid characters");
      setIsErrorModalVisible(true);
    } else {
      try {
        const { data: user, error: authError } = await supabase.auth.updateUser(
          {
            data: { display_name: displayName },
          }
        );

        if (authError) {
          setErrorMessage("Failed to update display name");
          setIsErrorModalVisible(true);
          return;
        }

        const { error: tableError } = await supabase
          .from("users")
          .update({ display_name: displayName })
          .eq("id", user.user.id);

        if (tableError) {
          setErrorMessage("Failed to update user table");
          setIsErrorModalVisible(true);
          return;
        }

        setIsSuccessModalVisible(true);
      } catch (err) {
        setErrorMessage("An unexpected error occurred");
        setIsErrorModalVisible(true);
      }
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
    <KeyboardAvoidingView style={styles.container} behavior="padding">
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
          Edit Display Name
        </Text>
      </View>

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
          fontFamily="Inter_600SemiBold"
          selectionColor={isDarkTheme ? "#ccc" : "#666666"}
          value={displayName}
          onChangeText={handleInputChange}
          maxFontSizeMultiplier={1.2}
        />
      </View>

      {/* Done Button */}
      {isButtonVisible && (
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText} maxFontSizeMultiplier={1.2}>
            DONE
          </Text>
        </TouchableOpacity>
      )}

      {/* Error Modal */}
      <Modal
        visible={isErrorModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsErrorModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons
              name="close-circle"
              size={80}
              color="#d9534f"
              style={{ paddingTop: -10, bottom: 5 }}
            />
            <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText} maxFontSizeMultiplier={1.2}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              Changes saved
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#6a5acd" }]}
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
    </KeyboardAvoidingView>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();
  return {
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      paddingTop: insets.top,
      // paddingBottom: insets.bottom,
      // paddingLeft: insets.left,
      // paddingRight: insets.right,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    headerText: {
      marginLeft: 10,
      fontSize: 18,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    inputContainer: {
      marginTop: 50,
      alignItems: "center",
    },
    input: {
      width: "85%",
      height: 50,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "gray",
      paddingHorizontal: 20,
      fontSize: 16,
      color: isDarkTheme ? "#f5f5f5" : "#000",
    },
    doneButton: {
      marginTop: 40,
      backgroundColor: "#6a5acd",
      borderRadius: 25,
      paddingVertical: 10,
      paddingHorizontal: 30,
      alignSelf: "center",
    },
    doneButtonText: {
      color: "#fff",
      fontSize: 17,
      fontFamily: "Inter_700Bold",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
    },
    modalContent: {
      backgroundColor: isDarkTheme ? "#000" : "#fff",
      borderRadius: 25,
      padding: 45,
      paddingTop: 20,
      alignItems: "center",
      width: "80%",
    },
    modalText: {
      fontSize: 22,
      color: isDarkTheme ? "#f6f6f6" : "#333",
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

export default EditScreen;
