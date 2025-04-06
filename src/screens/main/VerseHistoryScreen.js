import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import Ionicons from "@expo/vector-icons/Ionicons";
import { fetchVerseHistory } from "../../services/supabaseService";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerseHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const theme = useSelector((state) => state.theme.theme);
  const navigation = useNavigation();
  const styles = getStyle(theme);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await fetchVerseHistory();
        setHistory(data || []);
        setError("");
      } catch (err) {
        setError("Check your connection");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const renderVerseCard = ({ item }) => (
    <ImageBackground
      source={{ uri: item.backgroundImage }}
      style={styles.card}
      imageStyle={styles.image}
    >
      <View style={styles.content}>
        <Text style={styles.day}>{item.day}</Text>
        <Text style={styles.reference}>{item.reference}</Text>
        <Text style={styles.verseText}>{item.verse_text}</Text>
      </View>
    </ImageBackground>
  );

  if (loading) {
    return (
      <ActivityIndicator style={styles.loader} size="large" color="#6A5ACD" />
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.toLowerCase().includes("dark") ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>History</Text>
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.toLowerCase().includes("dark") ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>History</Text>
      </View>

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVerseCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();
  return {
    container: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      //paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
    },
    backButton: {
      marginRight: 16,
    },
    headerText: {
      fontSize: 20,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    list: {
      padding: 16,
    },
    card: {
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 16,
      flexGrow: 1,
      minHeight: 200,
    },
    image: {
      borderRadius: 10,
      opacity: 0.8,
    },
    content: {
      padding: 16,
    },
    reference: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#FFFFFF",
      marginBottom: 13,
    },
    verseText: {
      fontSize: 24,
      fontFamily: "SourceSerif4_400Regular",
      color: "#FFFFFF",
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      fontSize: 17,
      fontWeight: "bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    day: {
      fontSize: 16,
      fontWeight: "300",
      color: "#ffffff",
      marginBottom: 0,
      marginTop: 0,
      paddingBottom: 14,
    },
  };
};
