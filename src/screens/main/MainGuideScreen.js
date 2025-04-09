import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
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
  const [items, setItems] = useState([]); // To store items from the temp table

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  // Extract params from navigation
  useEffect(() => {
    const { tempTableName, service, day, churchId } = route.params || {};
    if (tempTableName && service && day && churchId !== null) {
      setTempTableName(tempTableName);
      setService(service);
      setDay(day);
      setChurchId(churchId);
      fetchItems(tempTableName); // Fetch items from the temp table
    } else {
      setError("Missing required guide data");
    }
  }, [route.params]);

  // Fetch items from the temporary table
  const fetchItems = async (tableName) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw new Error(`Fetch Error: ${error.message}`);
      setItems(data || []);
      console.log("Fetched Items:", data);
    } catch (error) {
      console.error("Fetch Items Error:", error.message, error.stack);
      setError(`Failed to load items: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button press with modal
  const handleBackPress = () => {
    setIsDeleteModalVisible(true);
  };

  // Confirm deletion, drop table, and reset navigation
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

  // Navigate to ItemScreen to add a new item
  const handleAddItem = () => {
    navigation.navigate("ItemScreen", {
      tempTableName,
      churchId,
      service,
      day,
    });
  };

  // Placeholder for Edit button
  const handleEditItem = (item) => {
    console.log("Edit Item:", item);
    // Navigate to ItemScreen with item data for editing (to be implemented)
    navigation.navigate("ItemScreen", {
      tempTableName,
      churchId,
      service,
      day,
      item, // Pass the item to edit
    });
  };

  // Placeholder for Delete button
  const handleDeleteItem = async (itemId) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from(tempTableName)
        .delete()
        .eq("id", itemId);

      if (error) throw new Error(`Delete Error: ${error.message}`);
      setItems(items.filter((item) => item.id !== itemId));
      console.log("Item Deleted:", itemId);
    } catch (error) {
      console.error("Delete Item Error:", error.message, error.stack);
      setError(`Failed to delete item: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder for Post button (to save to permanent table)
  const handlePostPress = () => {
    console.log("Post Guide:", {
      tempTableName,
      service,
      day,
      churchId,
      items,
    });
    // Add logic to save to a permanent table and drop the temp table (to be implemented)
    navigation.goBack(); // For now, just go back
  };

  // Render each item in the list
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        {item.title || "Item"}: {item.content || "N/A"}
      </Text>
      <View style={styles.itemActions}>
        <TouchableOpacity
          onPress={() => handleEditItem(item)}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteItem(item.id)}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <View style={styles.headerContent}>
          <Text style={styles.headerText}>Sunday Guide</Text>
          <Text style={styles.headerDay}>{day || "Not set"}</Text>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items added yet.</Text>
        }
        contentContainerStyle={styles.listContainer}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePostPress}
          style={[styles.postButton, isLoading && styles.postButtonDisabled]}
          disabled={isLoading}
        >
          <Text style={styles.postText}>
            {isLoading ? "Processing..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

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
    headerContent: {
      marginLeft: 10,
    },
    headerText: {
      fontSize: 22,
      fontFamily: "Archivo_700Bold",
      color: isDarkTheme ? "#fff" : "#000",
    },
    headerDay: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#ccc" : "#666",
      marginTop: 2,
    },
    listContainer: {
      paddingBottom: 20,
    },
    itemContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
      borderRadius: 10,
      marginBottom: 10,
    },
    itemText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
      flex: 1,
    },
    itemActions: {
      flexDirection: "row",
    },
    actionButton: {
      marginLeft: 10,
    },
    actionText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#6a5acd" : "#6a5acd",
    },
    emptyText: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#ccc" : "#666",
      textAlign: "center",
      marginTop: 20,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#6a5acd",
      paddingVertical: 12,
      borderRadius: 25,
      width: "45%",
    },
    addButtonText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
      marginLeft: 8,
    },
    postButton: {
      backgroundColor: "green",
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      width: "45%",
    },
    postButtonDisabled: {
      backgroundColor: "#aaa",
    },
    postText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
    },
    errorText: {
      color: "red",
      fontSize: 14,
      marginBottom: 15,
      textAlign: "center",
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
