import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import { supabase } from "../../utils/supabase";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

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
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSermonTextSave = useCallback((sermonContent) => {
    setFormData((prev) => ({ ...prev, sermon_content: sermonContent }));
  }, []);

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
  }, [selectedHymn, itemType]);

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

  const handleAddSermonText = () => {
    navigation.navigate("SermonTextScreen", {
      sermonContent: formData.sermon_content,
      onSave: handleSermonTextSave,
    });
  };

  const handleSermonImage = async () => {
    try {
      setIsImageUploading(true);
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setError("Please allow access to your photos to upload an image.");
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
      const contentType =
        image.mimeType || (fileExt === "png" ? "image/png" : "image/jpeg");

      const fileInfo = await FileSystem.getInfoAsync(image.uri);
      if (!fileInfo.exists) {
        throw new Error("Image file does not exist at the specified URI.");
      }

      const fileData = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binary = atob(fileData);
      const arrayBuffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        arrayBuffer[i] = binary.charCodeAt(i);
      }

      const { data, error: uploadError } = await supabase.storage
        .from("sermon_images")
        .upload(fileName, arrayBuffer, {
          contentType,
        });

      if (uploadError) {
        throw new Error(`Image Upload Error: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage
        .from("sermon_images")
        .getPublicUrl(fileName);

      if (!publicData.publicUrl) {
        throw new Error("Failed to retrieve public URL for the image.");
      }

      setFormData((prev) => ({
        ...prev,
        sermon_image: publicData.publicUrl,
      }));
    } catch (error) {
      setError(`Failed to upload image: ${error.message}`);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleSermonAudio = async () => {
    try {
      setIsAudioUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const audio = result.assets[0];
      const fileExt = audio.name.split(".").pop();
      const fileName = `sermon_audio_${Date.now()}.${fileExt}`;
      const contentType = audio.mimeType || "audio/mpeg";

      const fileInfo = await FileSystem.getInfoAsync(audio.uri);
      if (!fileInfo.exists) {
        throw new Error("Audio file does not exist at the specified URI.");
      }

      const fileData = await FileSystem.readAsStringAsync(audio.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binary = atob(fileData);
      const arrayBuffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        arrayBuffer[i] = binary.charCodeAt(i);
      }

      const { data, error: uploadError } = await supabase.storage
        .from("sermon_audio")
        .upload(fileName, arrayBuffer, {
          contentType,
        });

      if (uploadError) {
        throw new Error(`Audio Upload Error: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage
        .from("sermon_audio")
        .getPublicUrl(fileName);

      if (!publicData.publicUrl) {
        throw new Error("Failed to retrieve public URL for the audio.");
      }

      setFormData((prev) => ({
        ...prev,
        sermon_audio: publicData.publicUrl,
      }));
    } catch (error) {
      setError(`Failed to upload audio: ${error.message}`);
    } finally {
      setIsAudioUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!churchId || !service || !day || !tempTableName) {
        throw new Error(
          "Missing required metadata (churchId, service, day, or tempTableName)"
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
            sermon: formData.title,
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
      } else {
        const { data, error: insertError } = await supabase
          .from(tempTableName)
          .insert([dataToSave])
          .select();

        if (insertError)
          throw new Error(`Insert Error: ${insertError.message}`);
      }

      navigation.goBack();
    } catch (error) {
      setError(`Failed to save item: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
            {formData.sermon_content ? (
              <View style={styles.statusContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4CAF50"
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>Sermon Text Saved</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.selectHymnButton}
              onPress={handleSermonImage}
              disabled={isImageUploading}
            >
              <Text style={styles.selectHymnButtonText}>Sermon Image</Text>
            </TouchableOpacity>
            {isImageUploading ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#6a5acd" />
                <Text style={styles.statusText}>Uploading Image...</Text>
              </View>
            ) : formData.sermon_image ? (
              <View style={styles.statusContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4CAF50"
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>Sermon Image Saved</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.selectHymnButton}
              onPress={handleSermonAudio}
              disabled={isAudioUploading}
            >
              <Text style={styles.selectHymnButtonText}>Sermon Audio</Text>
            </TouchableOpacity>
            {isAudioUploading ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#6a5acd" />
                <Text style={styles.statusText}>Uploading Audio...</Text>
              </View>
            ) : formData.sermon_audio ? (
              <View style={styles.statusContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#4CAF50"
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>Sermon Audio Saved</Text>
              </View>
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
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    statusIcon: {
      marginRight: 5,
    },
    statusText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: isDarkTheme ? "#ccc" : "#666",
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
