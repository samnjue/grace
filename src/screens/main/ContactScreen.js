import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as MailComposer from "expo-mail-composer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../redux/slices/themeSlice";
import * as NavigationBar from "expo-navigation-bar";

const ContactScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateFields = () => {
    if (!firstName.trim()) return "First name is required";
    if (!email.trim()) return "Email is required";
    if (!validateEmail(email)) return "Enter a valid email address";
    if (!comment.trim()) return "Comment is required";
    if (comment.replace(/\s+/g, "").length < 30) return "Too few characters";
    return null;
  };

  const handleSend = async () => {
    const error = validateFields();
    if (error) {
      setErrorMessage(error);
      setIsErrorModalVisible(true);
      return;
    }

    try {
      const emailBody = `Name: ${firstName}\nEmail: ${email}\nComment: ${comment}`;
      const emailOptions = {
        recipients: ["ivorymailservice@gmail.com"],
        subject: "Get in Touch with Ivory",
        body: emailBody,
        isHtml: false,
      };

      const result = await MailComposer.composeAsync(emailOptions);

      if (result.status === "sent") {
        setIsSuccessModalVisible(true);
        setFirstName("");
        setEmail("");
        setComment("");
      } else {
        throw new Error("Unable to send");
      }
    } catch (error) {
      setErrorMessage("Unable to send");
      setIsErrorModalVisible(true);
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

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(isDarkTheme ? "#121212" : "#fff");
    NavigationBar.setButtonStyleAsync(isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#121212" : "#fff"}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            style={{ color: isDarkTheme ? "#fff" : "#000" }}
          />
        </TouchableOpacity>
        <Text style={styles.headerText} maxFontSizeMultiplier={1.2}>
          How can we help?
        </Text>
      </View>

      {/* Input Fields */}
      <View style={styles.formContainer}>
        <Text style={styles.inputLabel} maxFontSizeMultiplier={1.2}>
          First name
        </Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          maxFontSizeMultiplier={1.2}
          fontFamily="Inter_600SemiBold"
          selectionColor={isDarkTheme ? "#ccc" : "#666666"}
          fontSize={16}
        />

        <Text style={styles.inputLabel} maxFontSizeMultiplier={1.2}>
          Email
        </Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          maxFontSizeMultiplier={1.2}
          fontFamily="Inter_600SemiBold"
          selectionColor={isDarkTheme ? "#ccc" : "#000"}
          fontSize={16}
        />

        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Enter comment..."
          placeholderTextColor={isDarkTheme ? "#ccc" : "#666666"}
          fontFamily="Archivo_700Bold"
          fontSize={17}
          multiline
          maxFontSizeMultiplier={1.2}
          color={isDarkTheme ? "#fff" : "#000"}
          selectionColor={isDarkTheme ? "#ccc" : "#000"}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
        <Text style={styles.sendButtonText} maxFontSizeMultiplier={1.2}>
          Submit
        </Text>
      </TouchableOpacity>

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalVisible}
        transparent={true}
        animationType="none"
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
              Sent successfully!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalButtonText} maxFontSizeMultiplier={1.2}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    </View>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();
  return {
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      paddingBottom: 0,
    },
    headerText: {
      marginLeft: 10,
      fontSize: 24,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    formContainer: {
      marginVertical: 20,
      marginLeft: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#ccc" : "#666",
      marginBottom: 5,
    },
    input: {
      height: 40,
      width: "95%",
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 15,
      color: isDarkTheme ? "#f5f5f5" : "#000",
    },
    commentInput: {
      height: 100,
      width: "95%",
      borderWidth: 1,
      borderColor: isDarkTheme ? "#393939" : "#e4e4e4",
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingTop: 10,
      textAlignVertical: "top",
      backgroundColor: isDarkTheme ? "#393939" : "#e6e6e6",
    },
    sendButton: {
      backgroundColor: "#6a5acd",
      width: "90%",
      marginLeft: 20,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
    },
    sendButtonText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
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
      color: isDarkTheme ? "#fff" : "#333",
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

export default ContactScreen;
