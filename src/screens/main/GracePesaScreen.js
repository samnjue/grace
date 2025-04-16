import React, { useCallback, useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSelector } from "react-redux";
import Ionicons from "@expo/vector-icons/Ionicons";
import Header from "../../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "react-native-gesture-handler";
import { supabase } from "../../utils/supabase";
import Swiper from "react-native-swiper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GracePesaScreen = ({ navigation }) => {
  const theme = useSelector((state) => state.theme.theme);
  const styles = getStyle(theme);

  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isPesa, setIsPesa] = useState(false);
  const [fundraisers, setFundraisers] = useState([]);

  // Placeholder images for event cards
  const placeholderImages = [
    require("../../../assets/gradient_five.jpeg"),
    require("../../../assets/gradient_seven.jpeg"),
  ];

  useFocusEffect(
    useCallback(() => {
      const fetchPhoneNumber = async () => {
        const storedNumber = await AsyncStorage.getItem("phoneNumber");
        setPhoneNumber(storedNumber);
      };
      fetchPhoneNumber();
    }, [])
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("pesa, selected_church")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setIsPesa(data.pesa);

        // Fetch fundraisers matching the user's selected_church
        const { data: fundraiserData, error: fundraiserError } = await supabase
          .from("fundraisers")
          .select("*")
          .eq("church", data.selected_church);

        if (fundraiserError) throw fundraiserError;

        setFundraisers(fundraiserData);
      }
    };

    fetchUserData();
  }, []);

  const calculateDaysLeft = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  const calculatePercentage = (raised, target) => {
    return Math.min((raised / target) * 100, 100).toFixed(1);
  };

  const formatAmount = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderFundraiserCard = (fundraiser, index) => {
    const daysLeft = calculateDaysLeft(fundraiser.deadline);
    const percentage = calculatePercentage(
      fundraiser.raised_amount,
      fundraiser.target
    );
    return (
      <TouchableOpacity
        key={fundraiser.id}
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate("PayOptionsScreen", {
            title: fundraiser.title,
            accountName: fundraiser.title,
          })
        }
        activeOpacity={1}
      >
        <Image
          source={placeholderImages[index % placeholderImages.length]}
          style={styles.eventImage}
        />
        <View style={styles.daysLeftBadge}>
          <Text style={styles.daysLeftText}>
            {daysLeft > 0
              ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
              : "Ended"}
          </Text>
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{fundraiser.title}</Text>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
        <View style={styles.separator} />
        <Text style={styles.progressText}>
          {formatAmount(fundraiser.raised_amount)} of{" "}
          {formatAmount(fundraiser.target)} KES
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Giving"
        showStatsButton={isPesa ? true : false}
        onStatsPress={() => navigation.navigate("PayStatsScreen")}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Phone Card */}
          <View style={styles.phoneCard}>
            <Text style={styles.cardTitle}>Phone Number</Text>
            {phoneNumber && (
              <Text style={styles.cardNumber}>{phoneNumber}</Text>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("NumberScreen")}
            >
              {phoneNumber ? (
                <Text style={styles.addButtonText}>Edit</Text>
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
              )}
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
              {isPesa && (
                <TouchableOpacity
                  onPress={() => navigation.navigate("NewFundraiserScreen")}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color={styles.iconColor}
                  />
                </TouchableOpacity>
              )}
            </View>
            {fundraisers.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEvents}>No upcoming events</Text>
              </View>
            ) : fundraisers.length === 1 ? (
              renderFundraiserCard(fundraisers[0], 0)
            ) : (
              <Swiper
                style={styles.swiper}
                showsPagination={true}
                paginationStyle={styles.pagination}
                dotStyle={styles.dot}
                activeDotStyle={styles.activeDot}
              >
                {fundraisers.map((fundraiser, index) =>
                  renderFundraiserCard(fundraiser, index)
                )}
              </Swiper>
            )}
          </View>

          {/* Give Section */}
          <View style={styles.giveSection}>
            <View style={styles.giveHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="cash-outline"
                  size={32}
                  color={styles.iconColor}
                />
                <Text style={styles.giveTitle}>Give</Text>
              </View>
              <TouchableOpacity
                style={styles.receiptsButton}
                onPress={() => navigation.navigate("ReceiptsScreen")}
              >
                <Text style={styles.receiptsButtonText}>Receipts</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.giveContainer}>
              <TouchableOpacity
                style={styles.giveButton}
                onPress={() =>
                  navigation.navigate("PayOptionsScreen", { title: "Offering" })
                }
              >
                <Image
                  source={require("../../../assets/gradient_twelve.jpeg")}
                  style={styles.buttonImage}
                />
                <Text style={styles.buttonText}>Offering</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.giveButton}
                onPress={() =>
                  navigation.navigate("PayOptionsScreen", { title: "Tithe" })
                }
              >
                <Image
                  source={require("../../../assets/gradient_seven.jpeg")}
                  style={styles.buttonImage}
                />
                <Text style={styles.buttonText}>Tithe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.giveButton}
                onPress={() =>
                  navigation.navigate("PayOptionsScreen", {
                    title: "Thanksgiving",
                  })
                }
              >
                <Image
                  source={require("../../../assets/gradient_nine.jpeg")}
                  style={styles.buttonImage}
                />
                <Text style={styles.buttonText}>Thanksgiving</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.giveButton}
                onPress={() =>
                  navigation.navigate("PayOptionsScreen", { title: "Donation" })
                }
              >
                <Image
                  source={require("../../../assets/gradient_five.jpeg")}
                  style={styles.buttonImage}
                />
                <Text style={styles.buttonText}>Donation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();

  return {
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
      paddingBottom: insets.bottom,
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
      height: 300,
    },
    phoneCard: {
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      padding: 15,
      borderRadius: 10,
      marginVertical: 10,
      elevation: 3,
      marginBottom: 20,
      flexDirection: "column",
      alignItems: "flex-start",
    },
    cardTitle: {
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
      marginLeft: 8,
    },
    cardNumber: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
      marginLeft: 15,
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
    receiptsButton: {
      backgroundColor: isDarkTheme ? "#6a5acd" : "#6a5acd",
      borderRadius: 25,
      paddingVertical: 8,
      paddingHorizontal: 20,
    },
    receiptsButtonText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#fff",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    giveHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 12,
      marginBottom: 15,
      justifyContent: "space-between",
    },
    noEventsContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    noEvents: {
      fontSize: 14,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#bbb" : "#666",
      textAlign: "center",
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
    scrollContent: {
      paddingBottom: 60,
    },
    swiper: {
      height: 220,
    },
    eventCard: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#3c3c3c" : "#d9d9d9",
      borderRadius: 10,
      overflow: "hidden",
      marginHorizontal: 5,
      justifyContent: "space-between",
    },
    eventImage: {
      width: "100%",
      height: 100,
    },
    daysLeftBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      backgroundColor: "#6a5acd",
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 15,
    },
    daysLeftText: {
      color: "#fff",
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    eventDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 15,
    },
    eventTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    percentageText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    separator: {
      height: 1,
      backgroundColor: isDarkTheme ? "#666" : "#bbb",
      marginHorizontal: 10,
    },
    progressText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#aaa" : "#555",
      textAlign: "center",
      paddingVertical: 15,
    },
    pagination: {
      bottom: 5,
    },
    dot: {
      backgroundColor: isDarkTheme ? "#666" : "#bbb",
      width: 8,
      height: 8,
      borderRadius: 4,
      margin: 3,
    },
    activeDot: {
      backgroundColor: "#6a5acd",
      width: 8,
      height: 8,
      borderRadius: 4,
      margin: 3,
    },
  };
};

export default GracePesaScreen;
