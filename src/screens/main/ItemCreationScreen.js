import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import { supabase } from "../../utils/supabase";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const ItemCreationScreen = ({ navigation, route }) => {
  const {
    tempTableName,
    churchId,
    service,
    day,
    itemType,
    item,
    selectedHymn,
  } = route.params || {};
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  // State for form fields
  const [formData, setFormData] = useState({
    title: item?.title || "",
    content: item?.content || "",
    book: item?.book || "",
    chapter: item?.chapter || "",
    tenzi_number: item?.tenzi_number || selectedHymn?.tenzi_number || "",
    sermon: item?.sermon || "",
    sermon_metadata: item?.sermon_metadata || "",
    sermon_content: item?.sermon_content || "",
    sermon_image: item?.sermon_image || "",
    sermon_audio: item?.sermon_audio || "",
    songData: item?.songData || selectedHymn?.songData || "",
    songTitle: item?.songTitle || selectedHymn?.songTitle || "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Initialize content with hymn details if selectedHymn is provided
  useEffect(() => {
    if (selectedHymn && itemType === "Hymn Item") {
      const { tenzi_number, songTitle, songData } = selectedHymn;
      setFormData((prev) => ({
        ...prev,
        tenzi_number,
        songTitle,
        songData,
        content: songTitle,
      }));
    }
  }, [selectedHymn]);

  // Navigate to SelectHymnScreen
  const handleSelectHymn = () => {
    navigation.navigate("SelectHymnScreen", {
      tempTableName,
      churchId,
      service,
      day,
      itemType,
      item,
    });
  };

  // Navigate to SermonTextScreen
  const handleAddSermonText = () => {
    navigation.navigate("SermonTextScreen", {
      sermonContent: formData.sermon_content,
      onSave: (text) => {
        setFormData((prev) => ({ ...prev, sermon_content: text }));
      },
    });
  };

  // Handle Image Upload for Sermon Image
  const handleSermonImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "Please allow access to your photos to upload an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const image = result.assets[0];
      const fileExt = image.uri.split(".").pop();
      const fileName = `sermon_image_${Date.now()}.${fileExt}`;
      const file = await fetch(image.uri);
      const fileBlob = await file.blob();

      const { data, error: uploadError } = await supabase.storage
        .from("sermon_images")
        .upload(fileName, fileBlob, {
          contentType: image.mimeType || "image/jpeg",
        });

      if (uploadError) {
        throw new Error(`Image Upload Error: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage
        .from("sermon_images")
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        sermon_image: publicData.publicUrl,
      }));
      Alert.alert("Success", "Sermon image uploaded successfully!");
    } catch (error) {
      console.error("Sermon Image Error:", error.message);
      Alert.alert("Error", `Failed to upload image: ${error.message}`);
    }
  };

  // Handle Audio Upload for Sermon Audio
  const handleSermonAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const audio = result.assets[0];
      const fileExt = audio.name.split(".").pop();
      const fileName = `sermon_audio_${Date.now()}.${fileExt}`;
      const file = await fetch(audio.uri);
      const fileBlob = await file.blob();

      const { data, error: uploadError } = await supabase.storage
        .from("sermon_audio")
        .upload(fileName, fileBlob, {
          contentType: audio.mimeType || "audio/mpeg",
        });

      if (uploadError) {
        throw new Error(`Audio Upload Error: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage
        .from("sermon_audio")
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        sermon_audio: publicData.publicUrl,
      }));
      Alert.alert("Success", "Sermon audio uploaded successfully!");
    } catch (error) {
      console.error("Sermon Audio Error:", error.message);
      Alert.alert("Error", `Failed to upload audio: ${error.message}`);
    }
  };

  // Save the item to the temporary table
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!churchId || !service || !day) {
        throw new Error(
          "Missing required metadata (churchId, service, or day)"
        );
      }

      let dataToSave = {
        church_id: Number(churchId),
        service,
        day,
        item_type: itemType
          ? itemType.toLowerCase().replace(" item", "")
          : null,
      };

      if (!dataToSave.item_type) {
        throw new Error("Item type is required");
      }

      switch (itemType) {
        case "Basic Item":
          if (!formData.title || !formData.content) {
            throw new Error("Title and Content are required for Basic Item");
          }
          dataToSave = {
            ...dataToSave,
            title: formData.title,
            content: formData.content,
          };
          break;
        case "Bible Item":
          if (
            !formData.title ||
            !formData.content ||
            !formData.book ||
            !formData.chapter
          ) {
            throw new Error(
              "Title, Content, Book, and Chapter are required for Bible Item"
            );
          }
          dataToSave = {
            ...dataToSave,
            title: formData.title,
            content: formData.content,
            book: formData.book,
            chapter: formData.chapter,
          };
          break;
        case "Hymn Item":
          if (
            !formData.tenzi_number ||
            !formData.title ||
            !formData.songTitle
          ) {
            throw new Error(
              "Tenzi Number, Title, and Song Title are required for Hymn Item"
            );
          }
          console.log("Saving Hymn Item with data:", {
            tenzi_number: formData.tenzi_number,
            title: formData.title,
            content: formData.content,
            songTitle: formData.songTitle,
            songData: formData.songData,
          });
          dataToSave = {
            ...dataToSave,
            tenzi_number: formData.tenzi_number,
            title: formData.title,
            content: formData.content,
            songTitle: formData.songTitle,
            songData: formData.songData,
          };
          break;
        case "Sermon Item":
          if (!formData.title || !formData.content) {
            throw new Error("Title and Content are required for Sermon Item");
          }
          dataToSave = {
            ...dataToSave,
            title: formData.title,
            sermon: formData.title, // Title also populates sermon field
            content: formData.content,
            sermon_metadata: formData.sermon_metadata,
            sermon_content: formData.sermon_content,
            sermon_image: formData.sermon_image,
            sermon_audio: formData.sermon_audio,
          };
          break;
        default:
          throw new Error("Invalid item type");
      }

      if (item) {
        const { error: updateError } = await supabase
          .from(tempTableName)
          .update(dataToSave)
          .eq("id", item.id);

        if (updateError)
          throw new Error(`Update Error: ${updateError.message}`);
        console.log("Item Updated:", item.id);
      } else {
        console.log(
          "Inserting into table:",
          tempTableName,
          "with data:",
          dataToSave
        );
        const { data, error: insertError } = await supabase
          .from(tempTableName)
          .insert([dataToSave])
          .select();

        if (insertError)
          throw new Error(`Insert Error: ${insertError.message}`);
        console.log("Item Added:", data);
      }

      navigation.goBack();
    } catch (error) {
      console.error("Save Item Error:", error.message, error.stack);
      setError(`Failed to save item: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the form based on itemType
  const renderForm = () => {
    switch (itemType) {
      case "Basic Item":
        return (
          <>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => handleInputChange("title", text)}
              placeholder="Enter title"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
            />
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={styles.input}
              value={formData.content}
              onChangeText={(text) => handleInputChange("content", text)}
              placeholder="Enter content"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
              multiline
            />
          </>
        );
      case "Bible Item":
        return (
          <>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => handleInputChange("title", text)}
              placeholder="e.g. Opening Verse"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
            />
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={styles.input}
              value={formData.content}
              onChangeText={(text) => handleInputChange("content", text)}
              placeholder="e.g. Proverbs 16:1-3"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
              multiline
            />
            <Text style={styles.label}>Book</Text>
            <TextInput
              style={styles.input}
              value={formData.book}
              onChangeText={(text) => handleInputChange("book", text)}
              placeholder="e.g. Proverbs"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
            />
            <Text style={styles.label}>Chapter</Text>
            <TextInput
              style={styles.input}
              value={formData.chapter}
              onChangeText={(text) => handleInputChange("chapter", text)}
              placeholder="e.g. 16"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
              keyboardType="numeric"
            />
          </>
        );
      case "Hymn Item":
        if (!formData.tenzi_number) {
          return (
            <>
              <Text style={styles.label}>Select a Hymn</Text>
              <TouchableOpacity
                style={styles.selectHymnButton}
                onPress={handleSelectHymn}
              >
                <Text style={styles.selectHymnButtonText}>Select Hymn</Text>
              </TouchableOpacity>
            </>
          );
        }
        return (
          <>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => handleInputChange("title", text)}
              placeholder="Enter title (e.g., Opening Hymn)"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
            />
            <Text style={styles.label}>Selected Hymn</Text>
            <Text style={styles.selectedHymnText}>{formData.content}</Text>
          </>
        );
      case "Sermon Item":
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => handleInputChange("title", text)}
              placeholder="Enter sermon title (e.g., Faith and Grace)"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
            />
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={styles.input}
              value={formData.content}
              onChangeText={(text) => handleInputChange("content", text)}
              placeholder="Enter content"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
              multiline
            />
            <Text style={styles.label}>Metadata</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={formData.sermon_metadata}
              onChangeText={(text) =>
                handleInputChange("sermon_metadata", text)
              }
              placeholder="Enter sermon metadata (3-4 lines)"
              placeholderTextColor={isDarkTheme ? "#666" : "#999"}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={styles.selectHymnButton}
              onPress={handleAddSermonText}
            >
              <Text style={styles.selectHymnButtonText}>Add Sermon Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectHymnButton}
              onPress={handleSermonImage}
            >
              <Text style={styles.selectHymnButtonText}>Sermon Image</Text>
            </TouchableOpacity>
            {formData.sermon_image ? (
              <Text style={styles.selectedHymnText}>
                Image Uploaded: {formData.sermon_image}
              </Text>
            ) : null}
            <TouchableOpacity
              style={styles.selectHymnButton}
              onPress={handleSermonAudio}
            >
              <Text style={styles.selectHymnButtonText}>Sermon Audio</Text>
            </TouchableOpacity>
            {formData.sermon_audio ? (
              <Text style={styles.selectedHymnText}>
                Audio Uploaded: {formData.sermon_audio}
              </Text>
            ) : null}
          </ScrollView>
        );
      default:
        return <Text style={styles.errorText}>Invalid item type</Text>;
    }
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
        <Text style={styles.headerText}>
          {item ? `Edit ${itemType}` : `${itemType} Creation`}
        </Text>
      </View>

      {renderForm()}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleSave}
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        disabled={isLoading}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? "Saving..." : "Save"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// getStyle remains unchanged
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
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    input: {
      backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
      borderRadius: 10,
      padding: 10,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#fff" : "#000",
      marginBottom: 15,
    },
    selectHymnButton: {
      backgroundColor: "#777",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 15,
    },
    selectHymnButtonText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
    },
    selectedHymnText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#ccc" : "#666",
      marginBottom: 15,
    },
    saveButton: {
      backgroundColor: "#6a5acd",
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      marginTop: 20,
    },
    saveButtonDisabled: {
      backgroundColor: "#aaa",
    },
    saveButtonText: {
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
  };
};

export default ItemCreationScreen;
