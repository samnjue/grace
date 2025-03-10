import React, { useEffect, useState } from "react";
import { View, Text, Alert, Animated, Easing } from "react-native";
import { initiatePayment } from "../../services/mpesaService";
import { useSelector } from "react-redux";
import firebase from "@react-native-firebase/app";
import "@react-native-firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    startAnimation();
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      let phoneToUse = userPhone;

      if (!phoneToUse) {
        try {
          const storedPhone = await AsyncStorage.getItem("phoneNumber");
          if (storedPhone) {
            phoneToUse = storedPhone;
            setUserPhone(storedPhone);
          } else {
            throw new Error("Phone number not available");
          }
        } catch (error) {
          console.error("Error retrieving phone number:", error);
          Alert.alert("Error", "Could not retrieve phone number");
          navigation.goBack();
          return;
        }
      }

      processPayment(phoneToUse);
    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Error", "Payment initialization failed");
      navigation.goBack();
    }
  };

  const processPayment = async (phoneToUse) => {
    try {
      const response = await initiatePayment(
        phoneToUse,
        amount,
        accountReference
      );
      if (response && response.success) {
        checkTransactionStatus(response.data.CheckoutRequestID);
      } else {
        setIsProcessing(false);
        Alert.alert("Payment Failed", "Please try again.");
        navigation.goBack();
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Error", "Payment initiation failed.");
      navigation.goBack();
    }
  };

  const checkTransactionStatus = async (checkoutRequestID) => {
    setTimeout(async () => {
      try {
        // Use the Cloud Function instead of direct Firestore access
        const checkStatus = firebase
          .functions()
          .httpsCallable("checkTransactionStatus");
        const result = await checkStatus({ checkoutRequestID });

        setIsProcessing(false);

        if (result.data.exists) {
          if (result.data.isSuccessful) {
            Alert.alert("Payment Successful", "Thank you for your payment!");
            navigation.reset({
              index: 0,
              routes: [{ name: "Giving" }], // Adjust to your app's main screen name
            });
          } else {
            const errorMessage = result.data.resultDesc || "Transaction failed";
            Alert.alert("Payment Failed", errorMessage);
            navigation.goBack();
          }
        } else {
          // Check again after a short delay as the transaction might still be processing
          setTimeout(() => recheckTransaction(checkoutRequestID), 10000);
        }
      } catch (error) {
        console.error("Error checking transaction:", error);
        setIsProcessing(false);
        Alert.alert("Error", "Could not verify payment status");
        navigation.goBack();
      }
    }, 30000);
  };

  const recheckTransaction = async (checkoutRequestID) => {
    try {
      // Use the Cloud Function instead of direct Firestore access
      const checkStatus = firebase
        .functions()
        .httpsCallable("checkTransactionStatus");
      const result = await checkStatus({ checkoutRequestID });

      if (result.data.exists) {
        if (result.data.isSuccessful) {
          Alert.alert("Payment Successful", "Thank you for your payment!");
          navigation.reset({
            index: 0,
            routes: [{ name: "Giving" }], // Adjust to your app's main screen name
          });
        } else {
          const errorMessage = result.data.resultDesc || "Transaction failed";
          Alert.alert("Payment Failed", errorMessage);
        }
      } else {
        Alert.alert(
          "Payment Status Unknown",
          "Your payment is being processed. Please check transaction history later."
        );
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error rechecking transaction:", error);
      Alert.alert("Error", "Could not verify payment status");
      navigation.goBack();
    }
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
