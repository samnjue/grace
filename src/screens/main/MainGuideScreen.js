import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import { supabase } from "../../utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MainGuideScreen = ({ navigation, route }) => {
  const [tempTableName, setTempTableName] = useState("");
  const [service, setService] = useState("");
  const [day, setDay] = useState("");
  const [churchId, setChurchId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [isDiscarded, setIsDiscarded] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const { tempTableName, service, day, churchId, items, isEditMode } =
      route.params || {};
    if (isEditMode) {
      setIsEditMode(true);
      setDay(day);
      setChurchId(churchId);
      setService(service);
      setItems(items || []);
      setOriginalItems(items || []);
      setShouldFetch(false);
      fetchDatabaseItems(churchId, service, day);
    } else if (tempTableName && service && day && churchId !== null) {
      setTempTableName(tempTableName);
      setService(service);
      setDay(day);
      setChurchId(churchId);
      setShouldFetch(true);
    } else {
      setError("Missing required guide data");
    }

    const unsubscribeFocus = navigation.addListener("focus", () => {
      if ((tempTableName || isEditMode) && !isDiscarded) {
        setShouldFetch(true);
      }
    });

    const unsubscribeBeforeRemove = navigation.addListener(
      "beforeRemove",
      (e) => {
        if (tempTableName && !isDiscarded && !isPosting && !isEditMode) {
          e.preventDefault();
          setIsDeleteModalVisible(true);
        }
      }
    );

    return () => {
      unsubscribeFocus();
      unsubscribeBeforeRemove();
    };
  }, [navigation, route.params, isPosting, isDiscarded, tempTableName]);

  useEffect(() => {
    if (shouldFetch && tempTableName && !isDiscarded && !isEditMode) {
      fetchItems(tempTableName);
      setShouldFetch(false);
    } else if (shouldFetch && isEditMode && churchId && service && day) {
      fetchDatabaseItems(churchId, service, day);
      setShouldFetch(false);
    }
  }, [
    shouldFetch,
    tempTableName,
    isDiscarded,
    isEditMode,
    churchId,
    service,
    day,
  ]);

  const fetchDatabaseItems = async (churchId, service, day) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("sundayGuide")
        .select("*")
        .eq("church_id", churchId)
        .eq("service", service)
        .eq("day", day)
        .order("created_at", { ascending: true });

      if (error) throw new Error(`Fetch Error: ${error.message}`);
      setItems(data || []);
      setOriginalItems(data || []);
    } catch (error) {
      setError(`Failed to load database items: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async (tableName) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw new Error(`Fetch Error: ${error.message}`);
      setItems(data || []);
    } catch (error) {
      if (error.message.includes("does not exist")) {
        setIsDiscarded(true);
        setTempTableName("");
        setItems([]);
        setError("");
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeScreen" }],
        });
      } else {
        setError(`Failed to load items: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    if (tempTableName && !isDiscarded && !isEditMode) {
      setIsDeleteModalVisible(true);
    } else {
      navigation.goBack();
    }
  };

  const confirmDelete = async () => {
    try {
      setIsPosting(true);
      setIsDeleteModalVisible(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error: dropError } = await supabase.rpc(
        "drop_temp_sunday_guide_table",
        { user_id: user.id }
      );
      if (dropError) throw new Error(`Drop Error: ${dropError.message}`);

      setIsDiscarded(true);
      setTempTableName("");
      setItems([]);
      setError("");
      setShouldFetch(false);

      navigation.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      });
    } catch (error) {
      setError(`Failed to discard programme: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddItem = () => {
    navigation.navigate("TypeScreen", {
      tempTableName: isEditMode ? "sundayGuide" : tempTableName,
      churchId,
      service,
      day,
      isEditMode,
    });
  };

  const handleEditItem = (item) => {
    let inferredType;
    if (
      item.title &&
      item.content &&
      !item.book &&
      !item.tenzi_number &&
      !item.sermon
    ) {
      inferredType = "Basic Item";
    } else if (item.book && item.chapter) {
      inferredType = "Bible Item";
    } else if (item.tenzi_number && item.title) {
      inferredType = "Hymn Item";
    } else if (item.title && item.sermon) {
      inferredType = "Sermon Item";
    } else {
      inferredType = "Unknown";
    }

    navigation.navigate("ItemCreationScreen", {
      tempTableName: isEditMode ? "sundayGuide" : tempTableName,
      churchId,
      service,
      day,
      itemType: inferredType,
      item,
      isEditMode,
    });
  };

  const handleDeleteItem = async (itemId) => {
    try {
      setIsLoading(true);
      const tableName = isEditMode ? "sundayGuide" : tempTableName;
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", itemId);

      if (error) throw new Error(`Delete Error: ${error.message}`);
      setItems(items.filter((item) => item.id !== itemId));
      setShouldFetch(true);
    } catch (error) {
      setError(`Failed to delete item: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostPress = async () => {
    try {
      setIsPosting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const validItems = items.filter((item) =>
        ["basic", "bible", "hymn", "sermon"].includes(item.item_type)
      );

      if (validItems.length === 0) {
        setError("No valid items to post.");
        return;
      }

      if (!isEditMode) {
        const itemsToInsert = validItems.map((item) => {
          const baseItem = {
            church_id: churchId,
            service,
            day,
            title: item.title || null,
            content: item.content || null,
            item_type: item.item_type,
            book: item.book || null,
            chapter: item.chapter || null,
            verse: item.verse || null,
            tenzi_number: item.tenzi_number || null,
            sermon: item.sermon || null,
            created_at: item.created_at,
          };

          if (item.item_type === "hymn") {
            return {
              ...baseItem,
              songTitle: item.songTitle || null,
              songData: item.songData || null,
            };
          } else if (item.item_type === "sermon") {
            return {
              ...baseItem,
              sermon_content: item.sermon_content || null,
              sermon_metadata: item.sermon_metadata || null,
              sermon_image: item.sermon_image || null,
              sermon_audio: item.sermon_audio || null,
            };
          }

          return baseItem;
        });

        const { error: insertError } = await supabase
          .from("sundayGuide")
          .insert(itemsToInsert);

        if (insertError)
          throw new Error(`Insert Error: ${insertError.message}`);

        const { error: dropError } = await supabase.rpc(
          "drop_temp_sunday_guide_table",
          { user_id: user.id }
        );
        if (dropError) throw new Error(`Drop Error: ${dropError.message}`);

        setIsDiscarded(true);
        setTempTableName("");
      } else {
        const deletedItems = originalItems.filter(
          (origItem) => !validItems.some((item) => item.id === origItem.id)
        );

        const newItems = validItems.filter(
          (item) => !originalItems.some((origItem) => origItem.id === item.id)
        );

        const updatedItems = validItems
          .filter((item) =>
            originalItems.some((origItem) => origItem.id === item.id)
          )
          .filter((item) => {
            const origItem = originalItems.find((orig) => orig.id === item.id);
            return JSON.stringify(item) !== JSON.stringify(origItem);
          });

        if (deletedItems.length > 0) {
          const { error: deleteError } = await supabase
            .from("sundayGuide")
            .delete()
            .in(
              "id",
              deletedItems.map((item) => item.id)
            );

          if (deleteError)
            throw new Error(`Delete Error: ${deleteError.message}`);
        }

        if (newItems.length > 0) {
          const itemsToInsert = newItems.map((item) => {
            const baseItem = {
              church_id: churchId,
              service,
              day,
              title: item.title || null,
              content: item.content || null,
              item_type: item.item_type,
              book: item.book || null,
              chapter: item.chapter || null,
              verse: item.verse || null,
              tenzi_number: item.tenzi_number || null,
              sermon: item.sermon || null,
              created_at: item.created_at || new Date().toISOString(),
            };

            if (item.item_type === "hymn") {
              return {
                ...baseItem,
                songTitle: item.songTitle || null,
                songData: item.songData || null,
              };
            } else if (item.item_type === "sermon") {
              return {
                ...baseItem,
                sermon_content: item.sermon_content || null,
                sermon_metadata: item.sermon_metadata || null,
                sermon_image: item.sermon_image || null,
                sermon_audio: item.sermon_audio || null,
              };
            }

            return baseItem;
          });

          const { error: insertError } = await supabase
            .from("sundayGuide")
            .insert(itemsToInsert);

          if (insertError)
            throw new Error(`Insert Error: ${insertError.message}`);
        }

        if (updatedItems.length > 0) {
          for (const item of updatedItems) {
            const baseItem = {
              title: item.title || null,
              content: item.content || null,
              item_type: item.item_type,
              book: item.book || null,
              chapter: item.chapter || null,
              verse: item.verse || null,
              tenzi_number: item.tenzi_number || null,
              sermon: item.sermon || null,
            };

            if (item.item_type === "hymn") {
              baseItem.songTitle = item.songTitle || null;
              baseItem.songData = item.songData || null;
            } else if (item.item_type === "sermon") {
              baseItem.sermon_content = item.sermon_content || null;
              baseItem.sermon_metadata = item.sermon_metadata || null;
              baseItem.sermon_image = item.sermon_image || null;
              baseItem.sermon_audio = item.sermon_audio || null;
            }

            const { error: updateError } = await supabase
              .from("sundayGuide")
              .update(baseItem)
              .eq("id", item.id);

            if (updateError)
              throw new Error(`Update Error: ${updateError.message}`);
          }
        }
      }

      setItems([]);
      setOriginalItems([]);
      setError("");
      setShouldFetch(false);

      navigation.reset({
        index: 0,
        routes: [{ name: "HomeScreen" }],
      });
    } catch (error) {
      setError(`Failed to post guide: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.title || "Untitled"}</Text>
          <Text style={styles.itemText}>{item.content || "No content"}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => handleEditItem(item)}
            style={styles.actionButton}
          >
            <Ionicons
              name="options"
              size={25}
              color={isDarkTheme ? "#6a5acd" : "#6a5acd"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item.id)}
            style={styles.actionButton}
          >
            <Ionicons
              name="trash"
              size={23}
              color={isDarkTheme ? "#D2042D" : "#D2042D"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const validItems = items.filter((item) =>
    ["basic", "bible", "hymn", "sermon"].includes(item.item_type)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} disabled={isPosting}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerText}>
            {isEditMode ? "Edit Sunday Guide" : "Sunday Guide"}
          </Text>
          <Text style={styles.headerDay}>{day || "Not set"}</Text>
        </View>
      </View>

      <FlatList
        data={validItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items added yet.</Text>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePostPress}
          style={[styles.postButton, isPosting && styles.postButtonDisabled]}
          disabled={isPosting}
        >
          <Text style={styles.postText}>
            {isPosting ? "Processing..." : isEditMode ? "Update" : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    itemContent: {
      flex: 1,
      marginRight: 10,
    },
    itemTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    itemText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#ccc" : "#666",
    },
    itemActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButton: {
      padding: 5,
      marginLeft: 7,
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
      backgroundColor: "#777",
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
      backgroundColor: "#6a5acd",
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
      backgroundColor: isDarkTheme ? "#000" : "#fff",
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
      paddingBottom: insets.bottom,
    },
    exitButton: {
      flex: 1,
      backgroundColor: "#D2042D",
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: "center",
      marginLeft: 10,
      marginRight: 10,
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
