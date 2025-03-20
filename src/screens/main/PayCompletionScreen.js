import React, { useEffect, useState, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, Animated, Easing, BackHandler } from "react-native";
import {
  initiateSTKPush,
  checkTransactionStatus,
} from "../../services/mpesaService";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../utils/supabase.js";

const PayCompletionScreen = ({ route, navigation }) => {
  const { amount, phone, accountReference } = route.params;
  const [userPhone, setUserPhone] = useState(phone || "");
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const [isProcessing, setIsProcessing] = useState(true);

  const dot1Animation = useRef(new Animated.Value(0)).current;
  const dot2Animation = useRef(new Animated.Value(0)).current;
  const dot3Animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startDotAnimation();
    initializePayment();
  }, []);

  const startDotAnimation = () => {
    const createDotAnimation = (dotAnim) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );
    };

    createDotAnimation(dot1Animation).start();
    setTimeout(() => createDotAnimation(dot2Animation).start(), 150);
    setTimeout(() => createDotAnimation(dot3Animation).start(), 300);
  };

  const initializePayment = async () => {
    try {
      let phoneToUse = userPhone;
      if (!phoneToUse) {
        const storedPhone = await AsyncStorage.getItem("phoneNumber");
        if (storedPhone) {
          phoneToUse = storedPhone;
          setUserPhone(storedPhone);
        } else {
          throw new Error("Phone number not available");
        }
      }

      processPayment(phoneToUse);
    } catch (error) {
      console.error("Error initializing payment:", error);
      setIsProcessing(false);
      navigation.replace("PayDetailsScreen", {
        transactionId: null,
        error: "Add your phone number",
        transactionData: null,
      });
    }
  };

  const processPayment = async (phoneToUse) => {
    try {
      const response = await initiateSTKPush(
        phoneToUse,
        amount,
        accountReference
      );
      if (response && response.CheckoutRequestID) {
        checkTransactionStatusLoop(response.CheckoutRequestID);
      } else {
        throw new Error("Payment request failed");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setIsProcessing(false);
      navigation.replace("PayDetailsScreen", {
        transactionId: null,
        error: "Payment request failed",
        transactionData: null,
      });
    }
  };

  const fetchTransactionDetails = async (checkoutRequestId) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("checkout_request_id", checkoutRequestId)
        .single();

      if (error) {
        console.error("Error fetching transaction:", error);
        return { data: null, error: error.message };
      } else {
        return { data, error: null };
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      return { data: null, error: err.message };
    }
  };

  const checkTransactionStatusLoop = async (checkoutRequestId) => {
    let attempts = 0;
    const maxAttempts = 2;
    const retryDelay = 10000;

    const checkStatus = async () => {
      console.log(`Checking status, attempt ${attempts + 1}/${maxAttempts}`);

      const { data: statusData, error: statusError } =
        await checkTransactionStatus(checkoutRequestId);

      if (statusError) {
        console.log("Error checking transaction status:", statusError);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, retryDelay);
        } else {
          const { data: transactionData, error: fetchError } =
            await fetchTransactionDetails(checkoutRequestId);
          navigation.replace("PayDetailsScreen", {
            transactionId: checkoutRequestId,
            error: fetchError || "Transaction is still processing",
            transactionData,
          });
        }
        return;
      }

      if (statusData) {
        console.log("Transaction status:", statusData.status);
        const { data: transactionData, error: fetchError } =
          await fetchTransactionDetails(checkoutRequestId);
        navigation.replace("PayDetailsScreen", {
          transactionId: checkoutRequestId,
          error: fetchError,
          transactionData,
        });
      } else {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, retryDelay);
        } else {
          const { data: transactionData, error: fetchError } =
            await fetchTransactionDetails(checkoutRequestId);
          navigation.replace("PayDetailsScreen", {
            transactionId: checkoutRequestId,
            error: fetchError || "Transaction is still processing",
            transactionData,
          });
        }
      }
    };

    setTimeout(checkStatus, 10000);
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [])
  );

  const getDotStyle = (animValue) => {
    return {
      width: 15,
      height: 15,
      borderRadius: 10,
      backgroundColor: "#6a5acd",
      marginHorizontal: 5,
      transform: [
        {
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1.2],
          }),
        },
      ],
      opacity: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 1],
      }),
    };
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: isDarkTheme ? "#121212" : "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontFamily: "Archivo_700Bold",
          marginBottom: 20,
          color: isDarkTheme ? "#fff" : "#000",
        }}
      >
        {isProcessing ? "Processing Payment" : "Verifying Payment"}
      </Text>

      <Text
        style={{
          fontSize: 16,
          fontFamily: "Inter_600SemiBold",
          marginBottom: 30,
          color: isDarkTheme ? "#ccc" : "#555",
          textAlign: "center",
          paddingHorizontal: 20,
        }}
      >
        {isProcessing
          ? "Please check your phone for the M-Pesa prompt and enter your PIN"
          : "Checking payment status..."}
      </Text>

      <View
        style={{
          flexDirection: "row",
          width: 80,
          justifyContent: "center",
          alignItems: "center",
          height: 20,
        }}
      >
        <Animated.View style={getDotStyle(dot1Animation)} />
        <Animated.View style={getDotStyle(dot2Animation)} />
        <Animated.View style={getDotStyle(dot3Animation)} />
      </View>
    </View>
  );
};

export default PayCompletionScreen;
