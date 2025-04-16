import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TypeScreen = ({ navigation, route }) => {
  const { tempTableName, churchId, service, day, item, isEditMode } =
    route.params || {};
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  const handleSelectType = (type) => {
    navigation.navigate("ItemCreationScreen", {
      tempTableName,
      churchId,
      service,
      day,
      itemType: type,
      item: item || null,
      isEditMode,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Select Item Type</Text>
      </View>

      <TouchableOpacity
        style={styles.typeButton}
        onPress={() => handleSelectType("Basic Item")}
      >
        <Text style={styles.typeButtonText}>Basic Item</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeButton}
        onPress={() => handleSelectType("Bible Item")}
      >
        <Text style={styles.typeButtonText}>Bible Item</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeButton}
        onPress={() => handleSelectType("Hymn Item")}
      >
        <Text style={styles.typeButtonText}>Hymn Item</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeButton}
        onPress={() => handleSelectType("Sermon Item")}
      >
        <Text style={styles.typeButtonText}>Sermon Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();

  return {
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
      paddingTop: insets.top,
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
    typeButton: {
      backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 15,
    },
    typeButtonText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
    },
  };
};

export default TypeScreen;
