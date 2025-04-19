import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSelector } from "react-redux";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

const NewFundraiserScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [accNo, setAccNo] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isTitleFocused, setTitleFocused] = useState(false);
  const [isTargetFocused, setTargetFocused] = useState(false);
  const [isAccNoFocused, setAccNoFocused] = useState(false);

  const isButtonEnabled =
    title.trim() !== "" &&
    target.trim() !== "" &&
    accNo.trim() !== "" &&
    deadline !== null;

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const styles = getStyle(theme);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowDatePicker(Platform.OS === "ios");
    setDeadline(currentDate);
  };

  const handleSavePress = async () => {
    if (!isButtonEnabled) return;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      const userId = user.id;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("selected_church")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const { error } = await supabase.from("fundraisers").insert({
        title,
        target: parseInt(target),
        acc_no: accNo,
        deadline: deadline.toISOString().split("T")[0],
        created_by: userId,
        church: userData.selected_church,
      });

      if (error) throw error;

      navigation.reset({
        index: 0,
        routes: [{ name: "GracePesa" }],
      });
    } catch (error) {
      console.error("Error saving fundraiser:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>New Fundraiser</Text>
      </View>

      {/* Input Fields */}
      <Text
        style={[
          styles.label,
          isTitleFocused ? styles.labelFocused : styles.labelBlurred,
        ]}
      >
        Title
      </Text>
      <TextInput
        style={[
          styles.input,
          isTitleFocused ? styles.inputFocused : styles.inputBlurred,
        ]}
        placeholder="Enter title"
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        selectionColor={isDarkTheme ? "#ccc" : "#666666"}
        fontFamily="Inter_600SemiBold"
        onFocus={() => setTitleFocused(true)}
        onBlur={() => setTitleFocused(false)}
        value={title}
        onChangeText={setTitle}
      />

      <Text
        style={[
          styles.label,
          isTargetFocused ? styles.labelFocused : styles.labelBlurred,
        ]}
      >
        Target (KES)
      </Text>
      <TextInput
        style={[
          styles.input,
          isTargetFocused ? styles.inputFocused : styles.inputBlurred,
        ]}
        keyboardType="numeric"
        placeholder="Enter target amount"
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        selectionColor={isDarkTheme ? "#ccc" : "#666666"}
        fontFamily="Inter_600SemiBold"
        onFocus={() => setTargetFocused(true)}
        onBlur={() => setTargetFocused(false)}
        value={target}
        onChangeText={setTarget}
      />

      <Text
        style={[
          styles.label,
          isAccNoFocused ? styles.labelFocused : styles.labelBlurred,
        ]}
      >
        Acc. No
      </Text>
      <TextInput
        style={[
          styles.input,
          isAccNoFocused ? styles.inputFocused : styles.inputBlurred,
        ]}
        placeholder="Enter account number"
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        selectionColor={isDarkTheme ? "#ccc" : "#666666"}
        fontFamily="Inter_600SemiBold"
        onFocus={() => setAccNoFocused(true)}
        onBlur={() => setAccNoFocused(false)}
        value={accNo}
        onChangeText={setAccNo}
      />

      <Text style={styles.label}>Deadline</Text>
      <View style={styles.dateInputContainer}>
        <TextInput
          style={styles.dateInput}
          value={deadline.toISOString().split("T")[0]}
          editable={false}
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        />
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.calendarIcon}
        >
          <Ionicons
            name="calendar-outline"
            size={24}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={deadline}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSavePress}
        style={[
          styles.saveButton,
          !isButtonEnabled && styles.saveButtonDisabled,
        ]}
        disabled={!isButtonEnabled}
      >
        <Text style={styles.saveText}>Save</Text>
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
    label: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      color: isDarkTheme ? "#fff" : "#000",
      marginBottom: 5,
    },
    labelFocused: {
      fontSize: 22,
      color: "#6a5acd",
    },
    labelBlurred: {
      fontSize: 20,
      color: isDarkTheme ? "#fff" : "#000",
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
    dateInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    dateInput: {
      flex: 1,
      height: 50,
      borderWidth: 2,
      borderColor: "#ccc",
      borderRadius: 10,
      paddingHorizontal: 10,
      fontSize: 16,
      color: isDarkTheme ? "#f5f5f5" : "#000",
    },
    calendarIcon: {
      marginLeft: 10,
    },
    inputFocused: {
      borderColor: "#6a5acd",
    },
    inputBlurred: {
      borderColor: "#ccc",
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
    saveText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Archivo_700Bold",
    },
  };
};

export default NewFundraiserScreen;
