import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import tenziData from "../../data/tenzi.json";

const SelectHymnScreen = ({ navigation, route }) => {
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  const [hymns, setHymns] = useState([]);
  const [filteredHymns, setFilteredHymns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHymn, setSelectedHymn] = useState(null);

  // Parse tenzi.json and load hymns
  useEffect(() => {
    const parsedHymns = Object.keys(tenziData).map((key) => {
      const tenzi_number = key.split(". ")[0];
      const songTitle = key;
      const songData = JSON.stringify(tenziData[key]);
      return { tenzi_number, songTitle, songData };
    });
    setHymns(parsedHymns);
    setFilteredHymns(parsedHymns);
  }, []);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredHymns(hymns);
    } else {
      const filtered = hymns.filter(
        (hymn) =>
          hymn.tenzi_number.toLowerCase().includes(query.toLowerCase()) ||
          hymn.songTitle.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredHymns(filtered);
    }
  };

  // Handle hymn selection
  const handleSelectHymn = (hymn) => {
    setSelectedHymn(hymn);
  };

  // Save the selected hymn and navigate to ItemCreationScreen
  const handleSave = () => {
    if (!selectedHymn) {
      alert("Please select a hymn before saving.");
      return;
    }
    // Navigate to a new ItemCreationScreen with hymn data
    navigation.navigate("ItemCreationScreen", {
      tempTableName: route.params.tempTableName,
      churchId: route.params.churchId,
      service: route.params.service,
      day: route.params.day,
      itemType: "Hymn Item",
      selectedHymn: selectedHymn,
    });
  };

  const renderHymn = ({ item }) => {
    const isSelected =
      selectedHymn && selectedHymn.tenzi_number === item.tenzi_number;
    return (
      <View style={styles.hymnItem}>
        <Text style={styles.hymnText}>{item.songTitle}</Text>
        <TouchableOpacity
          onPress={() => handleSelectHymn(item)}
          style={styles.selectButton}
        >
          <Ionicons
            name={isSelected ? "checkmark" : "add"}
            size={24}
            color={isSelected ? "#28a745" : isDarkTheme ? "#6a5acd" : "#6a5acd"}
          />
        </TouchableOpacity>
      </View>
    );
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
        <Text style={styles.headerText}>Select Hymn</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search..."
        placeholderTextColor={isDarkTheme ? "#666" : "#999"}
      />

      <FlatList
        data={filteredHymns}
        renderItem={renderHymn}
        keyExtractor={(item) => item.tenzi_number}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hymns found.</Text>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

// getStyle remains unchanged
const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
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
    searchBar: {
      backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
      borderRadius: 10,
      padding: 10,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#fff" : "#000",
      marginBottom: 15,
    },
    hymnItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
      borderRadius: 10,
      marginBottom: 10,
    },
    hymnText: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#fff" : "#000",
      flex: 1,
    },
    selectButton: {
      padding: 5,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#ccc" : "#666",
      textAlign: "center",
      marginTop: 20,
    },
    listContainer: {
      paddingBottom: 20,
    },
  });
};

export default SelectHymnScreen;
