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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../redux/slices/themeSlice";
import * as NavigationBar from "expo-navigation-bar";

const NumberScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isNumberSaved, setIsNumberSaved] = useState(false);

  useEffect(() => {
    const loadPhoneNumber = async () => {
      const savedNumber = await AsyncStorage.getItem("phoneNumber");
      if (savedNumber) {
        setPhoneNumber(savedNumber);
        setIsNumberSaved(true);
      }
    };
    loadPhoneNumber();
  }, []);

  const handleInputChange = (text) => {
    setPhoneNumber(text);
    setIsButtonVisible(/^0\d{9}$/.test(text));
  };

  const handleDone = async () => {
    if (!/^0\d{9}$/.test(phoneNumber)) {
      setErrorMessage(
        "Invalid phone number. Must start with 0 and be 10 digits long."
      );
      setIsErrorModalVisible(true);
    } else {
      await AsyncStorage.setItem("phoneNumber", phoneNumber);
      setIsSuccessModalVisible(true);
    }
  };

  const handleDelete = async () => {
    await AsyncStorage.removeItem("phoneNumber");
    setPhoneNumber("");
    setIsNumberSaved(false);
    setIsButtonVisible(false);
  };

  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(isDarkTheme ? "#121212" : "#fff");
    NavigationBar.setButtonStyleAsync(isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#121212" : "#fff"}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Phone Number</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="eg. 0721····82"
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
          selectionColor={isDarkTheme ? "#ccc" : "#666666"}
          fontFamily="Inter_600SemiBold"
          keyboardType="numeric"
          maxLength={10}
          value={phoneNumber}
          onChangeText={handleInputChange}
        />
      </View>
      {isButtonVisible && (
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>DONE</Text>
        </TouchableOpacity>
      )}
      {isNumberSaved && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>DELETE</Text>
        </TouchableOpacity>
      )}
      <Modal visible={isErrorModalVisible} transparent animationType="none">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="close-circle" size={80} color="#d9534f" />
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={isSuccessModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={80} color="#32d15d" />
            <Text style={styles.modalText}>Phone number saved</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalButtonText}>Nice!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  return {
    container: { flex: 1, backgroundColor: isDarkTheme ? "#121212" : "#fff" },
    header: { flexDirection: "row", alignItems: "center", padding: 16 },
    headerText: {
      marginLeft: 10,
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    inputContainer: { marginTop: 50, alignItems: "center" },
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
    doneButtonText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
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
      alignItems: "center",
      width: "80%",
    },
    modalText: {
      fontSize: 22,
      color: isDarkTheme ? "#f6f6f6" : "#333",
      fontFamily: "Inter_700Bold",
      marginVertical: 7,
      textAlign: "center",
    },
    modalButton: {
      marginTop: 20,
      backgroundColor: "#6a5acd",
      height: 50,
      width: 150,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    modalButtonText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      textAlign: "center",
    },
    deleteButton: {
      marginTop: 15,
      backgroundColor: "red",
      borderRadius: 25,
      paddingVertical: 10,
      paddingHorizontal: 30,
      alignSelf: "center",
    },
    deleteButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "bold",
    },
  };
};

export default NumberScreen;
