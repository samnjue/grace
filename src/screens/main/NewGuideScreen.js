import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../utils/supabase";

const NewGuideScreen = ({ navigation }) => {
  const [service, setService] = useState("");
  const [day, setDay] = useState("");
  const [churchId, setChurchId] = useState(null);
  const [error, setError] = useState("");
  const [isServiceFocused, setServiceFocused] = useState(false);
  const [isDayFocused, setDayFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validServices = ["Main", "Youth", "Kids"];
  const isButtonEnabled =
    validServices.includes(service.trim()) &&
    day.trim().match(/^[A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4}$/) &&
    churchId !== null &&
    !isLoading;

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme, isServiceFocused, isDayFocused);

  useEffect(() => {
    const getSelectedChurch = async () => {
      try {
        const storedChurch = await AsyncStorage.getItem("selectedChurch");
        if (storedChurch) {
          const parsedChurch = JSON.parse(storedChurch);
          if (Number.isInteger(parsedChurch.church_id)) {
            setChurchId(parsedChurch.church_id);
            setError("");
          } else {
            setError("Invalid church ID format");
          }
        } else {
          setError("No church selected");
        }
      } catch (error) {
        setError("Error retrieving church information");
      }
    };

    getSelectedChurch();
  }, []);

  const createTemporaryTable = async () => {
    try {
      setIsLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session found");

      const { data: tempTableName, error: rpcError } = await supabase.rpc(
        "create_temp_sunday_guide_table",
        { user_id: user.id }
      );

      if (rpcError) {
        if (rpcError.message.includes("already exists")) {
          setError("You have an existing Sunday Guide, complete it first");
          return;
        }
        throw new Error(`RPC Error: ${rpcError.message}`);
      }
      if (!tempTableName) throw new Error("No table name returned from RPC");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: tableCheck, error: checkError } = await supabase
        .from(tempTableName)
        .select("id")
        .limit(1);
      if (checkError)
        throw new Error(`Table Check Error: ${checkError.message}`);

      navigation.navigate("MainGuideScreen", {
        tempTableName,
        service,
        day,
        churchId,
      });
    } catch (error) {
      console.error("Full Error:", error.message, error.stack);
      setError(`Failed to create temporary table: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePress = () => {
    if (isButtonEnabled) {
      createTemporaryTable();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>New Programme</Text>
      </View>

      <Text style={styles.serviceLabel}>Service</Text>
      <TextInput
        style={[
          styles.input,
          isServiceFocused ? styles.inputFocused : styles.inputBlurred,
        ]}
        placeholder="Main, Youth, or Kids"
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        selectionColor={isDarkTheme ? "#ccc" : "#666666"}
        fontFamily="Inter_600SemiBold"
        onFocus={() => setServiceFocused(true)}
        onBlur={() => setServiceFocused(false)}
        value={service}
        onChangeText={setService}
        editable={!isLoading}
      />

      <Text style={styles.dayLabel}>Day</Text>
      <TextInput
        style={[
          styles.input,
          isDayFocused ? styles.inputFocused : styles.inputBlurred,
        ]}
        placeholder="e.g. Sunday, March 23, 2025"
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        selectionColor={isDarkTheme ? "#ccc" : "#666666"}
        fontFamily="Inter_600SemiBold"
        onFocus={() => setDayFocused(true)}
        onBlur={() => setDayFocused(false)}
        value={day}
        onChangeText={setDay}
        editable={!isLoading}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleCreatePress}
        style={[
          styles.createButton,
          !isButtonEnabled && styles.createButtonDisabled,
        ]}
        disabled={!isButtonEnabled}
      >
        <Text style={styles.createText}>
          {isLoading ? "Creating..." : "Create"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyle = (theme, isServiceFocused, isDayFocused) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");

  return {
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    headerText: {
      fontSize: 22,
      fontFamily: "Archivo_700Bold",
      marginLeft: 10,
      color: isDarkTheme ? "#fff" : "#000",
    },
    serviceLabel: {
      fontSize: isServiceFocused ? 22 : 20,
      fontFamily: "Inter_600SemiBold",
      color: isServiceFocused ? "#6a5acd" : isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    dayLabel: {
      fontSize: isDayFocused ? 22 : 20,
      fontFamily: "Inter_600SemiBold",
      color: isDayFocused ? "#6a5acd" : isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    input: {
      height: 50,
      borderWidth: 2,
      borderRadius: 10,
      paddingHorizontal: 10,
      fontSize: 16,
      marginBottom: 15,
      color: isDarkTheme ? "#f5f5f5" : "#000",
    },
    inputFocused: {
      borderColor: "#6a5acd",
    },
    inputBlurred: {
      borderColor: "#ccc",
    },
    createButton: {
      backgroundColor: "#6a5acd",
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      marginTop: 20,
    },
    createButtonDisabled: {
      backgroundColor: "#aaa",
    },
    createText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
    },
    errorText: {
      color: "red",
      fontSize: 14,
      marginBottom: 15,
    },
  };
};

export default NewGuideScreen;
