import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ReceiptsScreen = () => {
  const navigation = useNavigation();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  const [transactions, setTransactions] = useState([]);
  const [churchName, setChurchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserChurchAndTransactions = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      //console.log("Fetched phoneNumber from AsyncStorage:", phoneNumber);

      if (!phoneNumber) {
        throw new Error("No phone number found in AsyncStorage");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");
      //console.log("Authenticated user ID:", user.id);

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("selected_church")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;
      //console.log("User data:", userData);

      const { data: churchData, error: churchError } = await supabase
        .from("churches")
        .select("name")
        .eq("id", userData.selected_church)
        .single();

      if (churchError) throw churchError;
      setChurchName(churchData.name);
      //console.log("Church name:", churchData.name);

      const { data: transactionData, error: transactionError } = await supabase
        .from("mpesa")
        .select(
          "phone, account_reference, mpesa_receipt_number, amount, created_at"
        )
        .eq("is_successful", true)
        .eq("phone", phoneNumber)
        .order("created_at", { ascending: false });

      if (transactionError) throw transactionError;
      //console.log("Fetched transactions:", transactionData);

      setTransactions(transactionData || []);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    } finally {
      if (isRefreshing) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserChurchAndTransactions();
  }, []);

  const groupTransactionsByDate = (transactions) => {
    return transactions.reduce((acc, transaction) => {
      const adjustedDate = new Date(transaction.created_at);
      adjustedDate.setHours(adjustedDate.getHours() + 3);
      const date = adjustedDate.toDateString();

      if (!acc[date]) acc[date] = { total: 0, transactions: [] };
      acc[date].total += transaction.amount;
      acc[date].transactions.push({ ...transaction, adjustedDate });
      return acc;
    }, {});
  };

  const formattedTransactions = groupTransactionsByDate(transactions);

  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkTheme ? "#121212" : "#fff",
        padding: 20,
        paddingTop: 10 + insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontFamily: "Archivo_700Bold",
            color: isDarkTheme ? "#fff" : "#000",
            marginLeft: 10,
          }}
        >
          Receipts
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#6a5acd" />
        </View>
      ) : transactions.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Archivo_700Bold",
              color: isDarkTheme ? "#bbb" : "#666",
              textAlign: "center",
            }}
          >
            No receipts found.
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUserChurchAndTransactions(true)}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(formattedTransactions).map(
            ([date, { total, transactions }]) => (
              <View key={date} style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Archivo_700Bold",
                      color: isDarkTheme ? "#fff" : "#333",
                    }}
                  >
                    {new Date(date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Archivo_700Bold",
                      color: isDarkTheme ? "#bf76f3" : "#6a5acd",
                    }}
                  >
                    KSH {total.toFixed(2)}
                  </Text>
                </View>

                {transactions.map((tx) => (
                  <View
                    key={tx.mpesa_receipt_number}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                    }}
                  >
                    <Ionicons
                      name="person-circle"
                      size={50}
                      color={isDarkTheme ? "gray" : "#aaa"}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={{
                          color: isDarkTheme ? "#fff" : "#000",
                          fontSize: 14,
                          fontFamily: "Inter_600SemiBold",
                        }}
                      >
                        {churchName}
                      </Text>
                      <Text
                        style={{
                          color: isDarkTheme ? "#bbb" : "#666",
                          fontSize: 12,
                          fontFamily: "Archivo_700Bold",
                        }}
                      >
                        {tx.account_reference}
                      </Text>
                      <Text
                        style={{
                          color: isDarkTheme ? "#bbb" : "#666",
                          fontSize: 10,
                          fontFamily: "Inter_700Bold",
                        }}
                      >
                        {tx.mpesa_receipt_number}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          color: isDarkTheme ? "#4CAF50" : "#50C878",
                          fontSize: 14,
                          fontFamily: "Inter_600SemiBold",
                        }}
                      >
                        - KSH {tx.amount}
                      </Text>
                      <Text
                        style={{
                          color: isDarkTheme ? "#bbb" : "#666",
                          fontSize: 11,
                          fontFamily: "Inter_600SemiBold",
                        }}
                      >
                        {tx.adjustedDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default ReceiptsScreen;
