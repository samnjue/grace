import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SermonTextScreen = ({ navigation, route }) => {
  const { sermonContent } = route.params || {};
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  const [text, setText] = useState(sermonContent || "");

  const handleSave = () => {
    navigation.goBack();
    route.params?.onSave?.(text);
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
        <Text style={styles.headerText}>Sermon Text</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.input, { flex: 1, textAlignVertical: "top" }]}
        value={text}
        onChangeText={setText}
        placeholder="Enter sermon text here..."
        placeholderTextColor={isDarkTheme ? "#666" : "#999"}
        multiline
      />
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
      justifyContent: "space-between",
      marginBottom: 20,
    },
    headerText: {
      fontSize: 22,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    saveButtonText: {
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      color: "#6a5acd",
    },
    input: {
      backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
      borderRadius: 10,
      padding: 10,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#fff" : "#000",
    },
  };
};

export default SermonTextScreen;
