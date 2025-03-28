import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import { supabase } from "../../utils/supabase";

const MainGuideScreen = ({ navigation, route }) => {
  const [tempTableName, setTempTableName] = useState("");
  const [service, setService] = useState("");
  const [day, setDay] = useState("");
  const [churchId, setChurchId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  useEffect(() => {
    const { tempTableName, service, day, churchId } = route.params || {};
    if (tempTableName && service && day && churchId !== null) {
      setTempTableName(tempTableName);
      setService(service);
      setDay(day);
      setChurchId(churchId);
    } else {
      setError("Missing required guide data");
    }
  }, [route.params]);

  const handleBackPress = () => {
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      setIsDeleteModalVisible(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error: dropError } = await supabase.rpc(
        "drop_temp_sunday_guide_table",
        {
          user_id: user.id,
        }
      );
      if (dropError) throw new Error(`Drop Error: ${dropError.message}`);
      console.log("Table Dropped:", tempTableName);

      navigation.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      });
    } catch (error) {
      console.error("Confirm Delete Error:", error.message, error.stack);
      setError(`Failed to discard programme: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishPress = () => {
    // Add logic here (e.g., save guide, then navigate)
    navigation.goBack(); // For now, just go back
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} disabled={isLoading}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Guide Details</Text>
      </View>

      <Text style={styles.label}>Service</Text>
      <Text style={styles.value}>{service || "Not set"}</Text>

      <Text style={styles.label}>Day</Text>
      <Text style={styles.value}>{day || "Not set"}</Text>

      <Text style={styles.label}>Church ID</Text>
      <Text style={styles.value}>
        {churchId !== null ? churchId : "Not set"}
      </Text>

      <Text style={styles.label}>Table Name</Text>
      <Text style={styles.value}>{tempTableName || "Not set"}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleFinishPress}
        style={[styles.finishButton, isLoading && styles.finishButtonDisabled]}
        disabled={isLoading}
      >
        <Text style={styles.finishText}>
          {isLoading ? "Processing..." : "Finish"}
        </Text>
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Discard programme?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.exitButton}
                onPress={confirmDelete}
              >
                <Text style={styles.exitButtonText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyle = (theme) => {
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
    label: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    value: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#f5f5f5" : "#333",
      marginBottom: 15,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: isDarkTheme ? "#ccc" : "#666",
      borderRadius: 5,
    },
    finishButton: {
      backgroundColor: "#6a5acd",
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      marginTop: 20,
    },
    finishButtonDisabled: {
      backgroundColor: "#aaa",
    },
    finishText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
    },
    errorText: {
      color: "red",
      fontSize: 14,
      marginBottom: 15,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
    },
    modalContent: {
      width: "80%",
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
    },
    modalText: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#fff" : "#555",
      textAlign: "center",
      marginBottom: 10,
      marginTop: 10,
    },
    modalButtonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 25,
      width: "100%",
    },
    exitButton: {
      flex: 1,
      backgroundColor: "#D2042D",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      marginLeft: 10,
    },
    exitButtonText: {
      fontFamily: "Inter_700Bold",
      color: "#fff",
      fontSize: 16,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      marginRight: 10,
    },
    cancelButtonText: {
      fontFamily: "Inter_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
      fontSize: 16,
    },
  };
};

export default MainGuideScreen;
