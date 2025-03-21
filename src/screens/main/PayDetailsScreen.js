import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  BackHandler,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

const PayDetailsScreen = ({ route }) => {
  const { transactionId, transactionData, error } = route.params;
  const navigation = useNavigation();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  const getStatusContent = () => {
    if (error) {
      return {
        title: "Error",
        message: `${error}`,
        success: false,
      };
    }

    if (!transactionData) {
      return {
        title: "Transaction Not Found",
        message: "Unable to retrieve transaction details.",
        success: false,
      };
    }

    if (transactionData.is_successful) {
      return {
        title: "Payment Successful",
        success: true,
      };
    }

    const failureReason =
      transactionData.result_desc || "Payment failed or was canceled.";
    return {
      title: "Payment Unsuccessful",
      message: failureReason,
      success: false,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    date.setHours(date.getHours() + 3);

    return date.toLocaleString();
  };

  const { title, message, success } = getStatusContent();

  const renderDetailRow = (label, value) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: isDarkTheme ? "#333" : "#E0E0E0",
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontFamily: "Inter_600SemiBold",
          color: isDarkTheme ? "#ccc" : "#666",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 15,
          fontFamily: "Inter_400Regular",
          color: isDarkTheme ? "#fff" : "#333",
          textAlign: "right",
          maxWidth: "60%",
        }}
      >
        {value || "N/A"}
      </Text>
    </View>
  );

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

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: isDarkTheme ? "#121212" : "#fff",
        padding: 20,
      }}
    >
      <View
        style={{
          width: "100%",
          alignItems: "center",
          marginTop: 30,
          marginBottom: -80,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontFamily: "Archivo_700Bold",
            color: isDarkTheme ? "#fff" : "#000",
          }}
        >
          Giving
        </Text>
      </View>
      <View style={{ flex: 1 }} />

      <View
        style={{
          width: "90%",
          padding: 20,
          backgroundColor: isDarkTheme ? "#1E1E1E" : "#F5F5F5",
          borderRadius: 15,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          alignItems: "center",
        }}
      >
        {transactionData === undefined && !error ? (
          <ActivityIndicator
            size="large"
            color={isDarkTheme ? "#fff" : "#000"}
          />
        ) : (
          <ScrollView
            contentContainerStyle={{
              alignItems: "center",
              width: "100%",
            }}
            showsVerticalScrollIndicator={false}
          >
            {success ? (
              <Ionicons name="checkmark-circle" size={80} color="#32CD32" />
            ) : (
              <Ionicons name="close-circle" size={80} color="#FF0000" />
            )}

            <Text
              style={{
                fontSize: 22,
                fontFamily: "Archivo_700Bold",
                color: isDarkTheme ? "#fff" : "#000",
                marginVertical: 20,
                textAlign: "center",
              }}
            >
              {title}
            </Text>

            {!success && message && (
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_400Regular",
                  textAlign: "center",
                  color: isDarkTheme ? "#ccc" : "#555",
                  marginBottom: 10,
                }}
              >
                {message}
              </Text>
            )}

            {success && transactionData && (
              <View style={{ width: "100%", marginTop: 10 }}>
                {renderDetailRow("Amount", `KSH ${transactionData.amount}`)}
                {renderDetailRow("Phone", `+${transactionData.phone}`)}
                {renderDetailRow(
                  "M-Pesa Receipt",
                  transactionData.mpesa_receipt_number
                )}
                {renderDetailRow(
                  "Date",
                  formatDate(transactionData.created_at)
                )}

                {/* {transactionData.metadata &&
                  Object.keys(transactionData.metadata).length > 0 && (
                    <>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: "Inter_600SemiBold",
                          color: isDarkTheme ? "#fff" : "#000",
                          marginTop: 10,
                          marginBottom: 10,
                        }}
                      >
                        Additional Details
                      </Text>

                      {Object.entries(transactionData.metadata).map(
                        ([key, value]) =>
                          renderDetailRow(
                            key.charAt(0).toUpperCase() +
                              key.slice(1).replace(/_/g, " "),
                            typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)
                          )
                      )}
                    </>
                  )} */}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <View style={{ flex: 1, justifyContent: "flex-end", marginBottom: 30 }}>
        <TouchableOpacity
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "GracePesa" }],
            })
          }
          style={{
            backgroundColor: success ? "green" : "#FF0000",
            paddingVertical: 12,
            paddingHorizontal: 40,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: "#fff",
              fontFamily: "Archivo_700Bold",
            }}
          >
            DONE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PayDetailsScreen;
