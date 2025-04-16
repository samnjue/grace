import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { supabase } from "../../utils/supabase";
import { useDispatch } from "react-redux";
import { selectDistrict } from "../../redux/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomError from "../../components/CustomError";
import { useSelector } from "react-redux";
import * as NavigationBar from "expo-navigation-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DistrictSelectionScreen({ navigation }) {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  // useEffect(() => {
  //     NavigationBar.setBackgroundColorAsync(isDarkTheme ? '#121212' : '#fff');
  //     NavigationBar.setButtonStyleAsync(isDarkTheme ? 'dark' : 'light');
  // }, [isDarkTheme]);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const selectedChurch = await AsyncStorage.getItem("selectedChurch");
        const parsedChurch = JSON.parse(selectedChurch);

        if (!parsedChurch || !parsedChurch.church_id) {
          throw new Error(
            "No church selected. Please go back and select a church."
          );
        }

        const { data, error } = await supabase
          .from("districts")
          .select("*")
          .eq("church_id", parsedChurch.church_id);

        if (error) {
          throw new Error(error.message);
        }

        setDistricts(data);
      } catch (error) {
        setError(
          error.message || "Failed to load districts. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district);
  };

  useEffect(() => {
    setSelectedDistrict(null);
  }, []);

  const handleProceed = async () => {
    setError("");

    try {
      const userSession = await AsyncStorage.getItem("userSession");
      const parsedSession = JSON.parse(userSession);
      const userId = parsedSession.user.id;

      const { error } = await supabase.from("users").upsert({
        id: userId,
        selected_district: selectedDistrict.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      const district = { district_id: selectedDistrict.id };
      await AsyncStorage.setItem("selectedDistrict", JSON.stringify(district));

      dispatch(selectDistrict(selectedDistrict.id));

      navigation.replace("MainApp");
    } catch (error) {
      console.error("Error selecting district:", error);
      setError(
        error.message || "An error occurred while selecting the district."
      );
    }
  };

  const renderDistrictItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.districtCard,
        selectedDistrict?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => handleSelectDistrict(item)}
    >
      <Text
        style={[
          styles.districtName,
          selectedDistrict?.id === item.id && styles.selectedText,
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
      {/* <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkTheme ? '#121212' : '#fff'}
            /> */}
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>
        Select Your District
      </Text>
      {error && <CustomError message={error} />}
      <FlatList
        data={districts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDistrictItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={[
          styles.selectButton,
          selectedDistrict
            ? styles.selectButtonActive
            : styles.selectButtonDisabled,
        ]}
        disabled={!selectedDistrict}
        onPress={handleProceed}
      >
        <Text style={styles.selectButtonText} maxFontSizeMultiplier={1.2}>
          Select District
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
      padding: insets.top,
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
    districtCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      marginVertical: 8,
      borderWidth: 0.1,
      borderColor: "#ccc",
      borderRadius: 8,
      backgroundColor: isDarkTheme ? "#333" : "#f5f5f5",
    },
    selectedCard: {
      borderColor: "#6a5acd",
    },
    districtName: {
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#333",
    },
    selectedText: {
      color: "#6a5acd",
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
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      justifyContent: "center",
      alignItems: "center",
    },
  };
};
