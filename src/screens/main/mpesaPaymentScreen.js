import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { initiatePayment } from "../../services/mpesaService";
import { useSelector } from "react-redux";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
} from "@react-native-firebase/firestore";

const MpesaPaymentScreen = () => {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  const handlePayment = async () => {
    if (!phone || !amount) {
      Alert.alert("Error", "Please enter phone number and amount");
      return;
    }

    try {
      const response = await initiatePayment(phone, amount);

      if (response && response.success) {
        Alert.alert("Success", "STK Push Sent. Check your phone!");

        setTimeout(async () => {
          const db = getFirestore();

          const transactionRef = doc(
            db,
            "mpesaTransactions",
            response.data.CheckoutRequestID
          );
          const transactionSnap = await getDoc(transactionRef);

          if (transactionSnap.exists()) {
            const transactionData = transactionSnap.data();
            if (transactionData.ResultCode === 0) {
              Alert.alert("Payment Successful", "Thank you for your donation!");
            } else {
              Alert.alert("Payment Failed", transactionData.ResultDesc);
            }
          } else {
            Alert.alert(
              "Payment Status Unknown",
              "Check later in transaction history."
            );
          }
        }, 5000);
      }
    } catch (error) {
      Alert.alert("Error", "Payment failed. Try again.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ color: isDarkTheme ? "#fff" : "#222" }}>
        Enter Phone Number:
      </Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="2547XXXXXXXX"
        placeholderTextColor={isDarkTheme ? "#ccc" : "#666"}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          padding: 8,
          marginBottom: 10,
          color: isDarkTheme ? "#fff" : "#222",
        }}
      />

      <Text style={{ color: isDarkTheme ? "#fff" : "#222" }}>
        Enter Amount:
      </Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount"
        placeholderTextColor={isDarkTheme ? "#ccc" : "#666"}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          padding: 8,
          marginBottom: 10,
          color: isDarkTheme ? "#fff" : "#222",
        }}
      />

      <Button title="Pay with Mpesa" onPress={handlePayment} />
    </View>
  );
};

export default MpesaPaymentScreen;
