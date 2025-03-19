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

const PayStatsScreen = () => {
  const navigation = useNavigation();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    const { data, error } = await supabase
      .from("mpesa")
      .select(
        "phone, account_reference, mpesa_receipt_number, amount, created_at"
      )
      .eq("is_successful", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else {
      setTransactions(data);
    }

    if (isRefreshing) setRefreshing(false);
    else setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const groupTransactionsByDate = (transactions) => {
    return transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.created_at).toDateString();
      if (!acc[date]) acc[date] = { total: 0, transactions: [] };
      acc[date].total += transaction.amount;
      acc[date].transactions.push(transaction);
      return acc;
    }, {});
  };

  const formattedTransactions = groupTransactionsByDate(transactions);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkTheme ? "#121212" : "#fff",
        padding: 20,
      }}
    >
      {/* Header */}
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
          Transactions
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkTheme ? "#fff" : "#000"} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTransactions(true)}
            />
          }
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
                        {tx.phone}
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
                        + KSH {tx.amount}
                      </Text>
                      <Text
                        style={{
                          color: isDarkTheme ? "#bbb" : "#666",
                          fontSize: 11,
                          fontFamily: "Inter_600SemiBold",
                        }}
                      >
                        {new Date(tx.created_at).toLocaleTimeString("en-US", {
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

export default PayStatsScreen;
