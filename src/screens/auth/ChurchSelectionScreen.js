import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  BackHandler,
  StatusBar,
} from "react-native";
import { supabase } from "../../utils/supabase";
import { useDispatch } from "react-redux";
import { logIn } from "../../redux/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomError from "../../components/CustomError";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import * as NavigationBar from "expo-navigation-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChurchSelectionScreen({ navigation }) {
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  //   useEffect(() => {
  //     NavigationBar.setBackgroundColorAsync(isDarkTheme ? "#121212" : "#fff");
  //     NavigationBar.setButtonStyleAsync(isDarkTheme ? "dark" : "light");
  //   }, [isDarkTheme]);

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const { data, error } = await supabase.from("churches").select("*");
        if (error) {
          throw new Error(error.message);
        }
        setChurches(data);
      } catch (error) {
        setError("Failed to load churches. Relaunch the app and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChurches();
  }, []);

  const handleSelectChurch = (church) => {
    setSelectedChurch(church);
  };

  const handleProceed = async () => {
    try {
      const userSession = await AsyncStorage.getItem("userSession");
      const parsedSession = JSON.parse(userSession);
      const userId = parsedSession.user.id;

      const { error } = await supabase.from("users").upsert({
        id: userId,
        selected_church: selectedChurch.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      dispatch(logIn({ ...parsedSession, selected_church: selectedChurch.id }));

      const churchWithCorrectKey = {
        ...selectedChurch,
        church_id: selectedChurch.id,
      };
      delete churchWithCorrectKey.id;
      await AsyncStorage.setItem(
        "selectedChurch",
        JSON.stringify(churchWithCorrectKey)
      );

      navigation.replace("DistrictSelection");
    } catch (error) {
      setError(
        error.message || "An error occurred while selecting the church."
      );
    }
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

  const renderChurchItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.churchCard,
        selectedChurch?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => handleSelectChurch(item)}
    >
      {/* <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#121212" : "#fff"}
      /> */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image_url }}
          style={[
            styles.churchImage,
            selectedChurch?.id !== item.id && styles.unselectedImage,
          ]}
        />
        {selectedChurch?.id !== item.id && <View style={styles.overlay} />}
      </View>
      <Text
        style={[
          styles.churchName,
          selectedChurch?.id === item.id && styles.selectedText,
        ]}
        maxFontSizeMultiplier={1.2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6a0dad" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>
        Select Your Church
      </Text>
      {error && <CustomError message={error} />}
      <FlatList
        data={churches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChurchItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={[
          styles.selectButton,
          selectedChurch
            ? styles.selectButtonActive
            : styles.selectButtonDisabled,
        ]}
        disabled={!selectedChurch}
        onPress={handleProceed}
      >
        <Text style={styles.selectButtonText} maxFontSizeMultiplier={1.2}>
          Select Church
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();
  return {
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      paddingTop: insets.top,
    },
    title: {
      fontSize: 24,
      marginVertical: 16,
      marginTop: 40,
      bottom: 20,
      textAlign: "center",
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#f5f5f5" : "#333",
    },
    churchCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      marginVertical: 8,
      borderWidth: 0.1,
      borderColor: "#ccc",
      borderRadius: 8,
      backgroundColor: isDarkTheme ? "#333" : "#f5f5f5",
      overflow: "hidden",
      height: 100,
    },
    selectedCard: {
      borderColor: "#6a5acd",
    },
    churchImage: {
      width: 105,
      right: 11,
      height: "110",
      resizeMode: "cover",
    },
    churchName: {
      flex: 1,
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#f5f5f5" : "#333",
      paddingHorizontal: 16,
    },
    selectButton: {
      position: "absolute",
      bottom: 20 + insets.bottom,
      alignSelf: "center",
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 8,
    },
    selectButtonActive: {
      backgroundColor: "#6a5acd",
    },
    selectButtonDisabled: {
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ccc",
    },
    selectButtonText: {
      color: "white",
      fontSize: 18,
      fontFamily: "Archivo_700Bold",
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
    },
    selectedText: {
      color: "#6a5acd",
    },
  };
};
