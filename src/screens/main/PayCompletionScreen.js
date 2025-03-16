import React, { useEffect, useState } from "react";
import { View, Text, Animated, Easing } from "react-native";
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
  const [animations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    startAnimation();
    initializePayment();
  }, []);

  const startAnimation = () => {
    animations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            delay: index * 200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
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
        error: "Payment initialization failed",
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
          width: 60,
          justifyContent: "space-between",
        }}
      >
        {[0, 1, 2].map((_, index) => {
          return (
            <Animated.View
              key={index}
              style={{
                right: 7,
                marginRight: 5,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#6a5acd",
                transform: [
                  {
                    translateY: animations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    }),
                  },
                ],
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

export default PayCompletionScreen;
