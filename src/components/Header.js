import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";

const Header = ({
  title,
  version,
  onVersionPress,
  showVersionButton,
  showMenuButton,
  onMenuPress,
  showStatsButton,
  onStatsPress,
}) => {
  const theme = useSelector((state) => state.theme.theme);
  const styles = getStyle(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title} maxFontSizeMultiplier={1}>
        {title}
      </Text>
      {showVersionButton && (
        <TouchableOpacity
          style={styles.versionButton}
          onPress={onVersionPress}
          activeOpacity={0.7}
        >
          <Text style={styles.versionText} maxFontSizeMultiplier={1.2}>
            {version}
          </Text>
        </TouchableOpacity>
      )}
      {showMenuButton && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color="#111" />
        </TouchableOpacity>
      )}
      {showStatsButton && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onStatsPress}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={21} color="#111" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  return {
    container: {
      height: 60,
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
    },
    title: {
      flex: 1,
      color: isDarkTheme ? "#fff" : "#333",
      fontSize: 30,
      fontFamily: "Archivo_700Bold",
      textAlign: "left",
      marginLeft: 10,
    },
    versionButton: {
      backgroundColor: "#dddddd",
      borderRadius: 20,
      paddingVertical: 5,
      paddingHorizontal: 15,
      marginRight: 10,
    },
    versionText: {
      color: "#000",
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
    menuButton: {
      width: 36,
      height: 36,
      borderRadius: 20,
      backgroundColor: "#dddddd",
      justifyContent: "center",
      alignItems: "center",
    },
  };
};

export default Header;
