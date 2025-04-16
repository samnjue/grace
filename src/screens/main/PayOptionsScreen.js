import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

const PayOptionsScreen = ({ route, navigation }) => {
  const { title, accountName } = route.params; // Get title and accountName from navigation params
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState(accountName || title); // State for editable Account Name, initialized with accountName or title
  const [isAmountFocused, setAmountFocused] = useState(false);
  const [isAccountFocused, setAccountFocused] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [totalRaised, setTotalRaised] = useState(0);

  const isButtonEnabled = amount.trim() !== "" && account.trim() !== "";

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme, isAmountFocused, isAccountFocused);

  // Fetch phone number from AsyncStorage
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

  // Fetch total amount raised from mpesa table
  useEffect(() => {
    const fetchTotalRaised = async () => {
      if (!accountName) return; // Skip if accountName is not provided

      try {
        const { data, error } = await supabase
          .from("mpesa")
          .select("amount")
          .eq("account_reference", accountName);

        if (error) throw error;

        // Calculate total amount raised
        const total = data.reduce((sum, record) => sum + record.amount, 0);
        setTotalRaised(total);
      } catch (error) {
        console.error("Error fetching total raised:", error);
      }
    };

    fetchTotalRaised();
  }, [accountName]);

  const formatAmount = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePayPress = () => {
    if (isButtonEnabled) {
      navigation.navigate("PayCompletionScreen", {
        amount: amount,
        phone: phoneNumber,
        accountReference: account, // Use the edited account value
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

      {/* Total Amount Raised */}
      {accountName && (
        <View style={styles.totalRaisedContainer}>
          <Text style={styles.totalRaisedLabel}>Total Raised:</Text>
          <Text style={styles.totalRaisedText}>
            {formatAmount(totalRaised)} KES
          </Text>
        </View>
      )}

      {/* Amount Input */}
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

      {/* Account Name (Editable) */}
      <Text style={styles.groupLabel}>Account Name</Text>
      <TextInput
        style={[
          styles.input,
          isAccountFocused ? styles.inputFocused : styles.inputBlurred,
        ]}
        placeholder="e.g., Main or Youth"
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        selectionColor={isDarkTheme ? "#ccc" : "#666666"}
        fontFamily="Inter_600SemiBold"
        onFocus={() => setAccountFocused(true)}
        onBlur={() => setAccountFocused(false)}
        value={account}
        onChangeText={setAccount}
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

const getStyle = (theme, isAmountFocused, isAccountFocused) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();

  return {
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
      paddingTop: insets.top,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      paddingTop: 7,
    },
    headerText: {
      fontSize: 22,
      fontFamily: "Archivo_700Bold",
      marginLeft: 10,
      color: isDarkTheme ? "#fff" : "#000",
    },
    totalRaisedContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      padding: 10,
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      borderRadius: 10,
    },
    totalRaisedLabel: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    totalRaisedText: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: "#6a5acd",
    },
    amountLabel: {
      fontSize: isAmountFocused ? 22 : 20,
      fontFamily: "Inter_600SemiBold",
      color: isAmountFocused ? "#6a5acd" : isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    groupLabel: {
      fontSize: isAccountFocused ? 22 : 20,
      fontFamily: "Inter_600SemiBold",
      color: isAccountFocused ? "#6a5acd" : isDarkTheme ? "#fff" : "#000",
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
