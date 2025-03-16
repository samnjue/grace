import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PayOptionsScreen = ({ route, navigation }) => {
  const { title } = route.params;
  const [amount, setAmount] = useState("");
  const [group, setGroup] = useState("");
  const [isAmountFocused, setAmountFocused] = useState(false);
  const [isGroupFocused, setGroupFocused] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const isButtonEnabled = amount.trim() !== "" && group.trim() !== "";

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme, isAmountFocused, isGroupFocused);

  useEffect(() => {
    const getPhoneNumber = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem("phoneNumber");
        if (storedPhone) {
          setPhoneNumber(storedPhone);
        }
      } catch (error) {
        console.error("Error retrieving phone number:", error);
      }
    };

    getPhoneNumber();
  }, []);

  const handlePayPress = () => {
    if (isButtonEnabled) {
      navigation.navigate("PayCompletionScreen", {
        amount: amount,
        phone: phoneNumber,
        accountReference: title + " - " + group,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>{title}</Text>
      </View>

      {/* Input Fields */}
      <Text style={styles.amountLabel}>Amount</Text>
      <TextInput
        style={[
          styles.input,
          isAmountFocused ? styles.inputFocused : styles.inputBlurred,
        ]}
        keyboardType="numeric"
        placeholder="Enter amount"
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        selectionColor={isDarkTheme ? "#ccc" : "#666666"}
        fontFamily="Inter_600SemiBold"
        onFocus={() => setAmountFocused(true)}
        onBlur={() => setAmountFocused(false)}
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.groupLabel}>Group</Text>
      <TextInput
        style={[
          styles.input,
          isGroupFocused ? styles.inputFocused : styles.inputBlurred,
        ]}
        placeholder="e.g Main or Youth"
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        selectionColor={isDarkTheme ? "#ccc" : "#666666"}
        fontFamily="Inter_600SemiBold"
        onFocus={() => setGroupFocused(true)}
        onBlur={() => setGroupFocused(false)}
        value={group}
        onChangeText={setGroup}
      />

      {/* Pay Button */}
      <TouchableOpacity
        onPress={handlePayPress}
        style={[styles.payButton, !isButtonEnabled && styles.payButtonDisabled]}
        disabled={!isButtonEnabled}
      >
        <Text style={styles.payText}>Pay</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyle = (theme, isAmountFocused, isGroupFocused) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");

  return {
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    headerText: {
      fontSize: 22,
      fontFamily: "Archivo_700Bold",
      marginLeft: 10,
      color: isDarkTheme ? "#fff" : "#000",
    },
    amountLabel: {
      fontSize: isAmountFocused ? 22 : 20,
      fontFamily: "Inter_600SemiBold",
      color: isAmountFocused ? "#6a5acd" : isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    groupLabel: {
      fontSize: isGroupFocused ? 22 : 20,
      fontFamily: "Inter_600SemiBold",
      color: isGroupFocused ? "#6a5acd" : isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    input: {
      height: 50,
      borderWidth: 2,
      borderRadius: 10,
      paddingHorizontal: 10,
      fontSize: 16,
      marginBottom: 15,
      color: isDarkTheme ? "#f5f5f5" : "#000",
    },
    inputFocused: {
      borderColor: "#6a5acd",
    },
    inputBlurred: {
      borderColor: "#ccc",
    },
    payButton: {
      backgroundColor: "#6a5acd",
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      marginTop: 20,
    },
    payButtonDisabled: {
      backgroundColor: "#aaa",
    },
    payText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
    },
  };
};

export default PayOptionsScreen;
