import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSelector } from "react-redux";
import Ionicons from "@expo/vector-icons/Ionicons";
import Header from "../../components/Header";

const GracePesaScreen = () => {
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  return (
    <View style={styles.container}>
      <Header title="Money" />

      <View style={styles.content}>
        <Text style={{ color: "red", textAlign: "center" }}>
          This page is under development, features do not work
        </Text>
        {/* Phone Card */}
        <View style={styles.phoneCard}>
          <Text style={styles.cardTitle}>Phone Number</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Events Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color={styles.iconColor}
            />
            <Text style={styles.cardTitle}>Upcoming Events</Text>
          </View>
          <Text style={styles.noEvents}>No upcoming events</Text>
        </View>

        {/* Give Section */}
        <View style={styles.giveSection}>
          <View style={styles.giveHeader}>
            <Ionicons name="cash-outline" size={32} color={styles.iconColor} />
            <Text style={styles.giveTitle}>Give</Text>
          </View>

          <View style={styles.giveContainer}>
            <TouchableOpacity style={styles.giveButton}>
              <Image
                source={require("../../../assets/gradient_twelve.jpeg")}
                style={styles.buttonImage}
              />
              <Text style={styles.buttonText}>Offering</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.giveButton}>
              <Image
                source={require("../../../assets/gradient_seven.jpeg")}
                style={styles.buttonImage}
              />
              <Text style={styles.buttonText}>Tithe</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.giveButton}>
              <Image
                source={require("../../../assets/gradient_nine.jpeg")}
                style={styles.buttonImage}
              />
              <Text style={styles.buttonText}>Thanksgiving</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.giveButton}>
              <Image
                source={require("../../../assets/gradient_five.jpeg")}
                style={styles.buttonImage}
              />
              <Text style={styles.buttonText}>Donation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");

  return {
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
    },
    content: {
      paddingHorizontal: 15,
    },
    card: {
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      padding: 15,
      borderRadius: 10,
      marginVertical: 10,
      elevation: 3,
      position: "relative",
      marginBottom: 15,
    },
    phoneCard: {
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      padding: 15,
      borderRadius: 10,
      marginVertical: 10,
      elevation: 3,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardTitle: {
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
      marginLeft: 8,
    },
    giveTitle: {
      fontSize: 25,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
      marginLeft: 8,
    },
    addButton: {
      backgroundColor: isDarkTheme ? "#6a5acd" : "#6a5acd",
      borderRadius: 25,
      marginTop: 6,
      padding: 8,
      position: "absolute",
      right: 15,
      top: "50%",
      transform: [{ translateY: -12 }],
    },
    addButtonText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#fff",
      paddingHorizontal: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    giveHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 12,
      marginBottom: 5,
    },
    noEvents: {
      fontSize: 14,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#bbb" : "#666",
      textAlign: "center",
      margin: 90,
    },
    giveSection: {
      marginTop: 5,
    },
    giveContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: 10,
    },
    giveButton: {
      width: "49%",
      height: 90,
      borderRadius: 15,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    buttonImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    buttonText: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: "#fff",
      textShadowColor: "rgba(0, 0, 0, 0.5)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 5,
    },
    iconColor: isDarkTheme ? "#fff" : "#000",
  };
};

export default GracePesaScreen;
