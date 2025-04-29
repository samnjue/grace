import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tenziData from "../../data/tenzi.json";
import hymnsData from "../../data/hymns.json";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../redux/slices/themeSlice";
import * as NavigationBar from "expo-navigation-bar";

export default function SongScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const songTypes = useMemo(
    () => ({
      Tenzi: tenziData,
      //Hymns: hymnsData,
    }),
    []
  );

  const typeKeys = Object.keys(songTypes);
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const currentType = typeKeys[currentTypeIndex];
  const songData = songTypes[currentType];

  const songs = useMemo(() => Object.keys(songData), [songData]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSongs, setFilteredSongs] = useState(songs);

  const toggleType = () => {
    const nextIndex = (currentTypeIndex + 1) % typeKeys.length;
    setCurrentTypeIndex(nextIndex);
  };

  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  const styles = getStyle(theme);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("appTheme");
        if (storedTheme) {
          dispatch(setTheme(storedTheme));
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    loadTheme();
  }, [dispatch]);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("appTheme", theme);
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    };

    saveTheme();
  }, [theme]);

  //   useEffect(() => {
  //     NavigationBar.setBackgroundColorAsync(isDarkTheme ? "#121212" : "#fff");
  //     NavigationBar.setButtonStyleAsync(isDarkTheme ? "dark" : "light");
  //   }, [isDarkTheme]);

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter((song) =>
        song.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const handleSongPress = (song) => {
    navigation.navigate("SelectedSongScreen", {
      songTitle: song,
      songData: songData[song],
      type: currentType,
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    Keyboard.dismiss();
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        //paddingTop: insets.top,
        //paddingBottom: insets.bottom,
        //paddingLeft: insets.left,
        //paddingRight: insets.right,
        backgroundColor: "#fff",
      }}
    >
      {/* <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkTheme ? '#121212' : '#fff'}
            /> */}
      <Header
        title="Songs"
        version={currentType}
        onVersionPress={toggleType}
        showVersionButton={true}
      />
      <View style={styles.container}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={25} style={styles.icon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            placeholderTextColor={isDarkTheme ? "#bbb" : "#8c8c8c"}
            fontFamily="Inter_600SemiBold"
            fontSize={16}
            color={isDarkTheme ? "#fff" : "#121212"}
            selectionColor={isDarkTheme ? "#ccc" : "#121212"}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            maxFontSizeMultiplier={1.2}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons
                name="close-circle"
                size={35}
                color={isDarkTheme ? "#fff" : "#666"}
              />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingBottom: 60 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSongPress(item)}>
              <Text style={styles.songName} maxFontSizeMultiplier={1.2}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={() => (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText} maxFontSizeMultiplier={1.2}>
                No results found
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  const insets = useSafeAreaInsets();
  return {
    container: {
      flex: 1,
      padding: 16,
      paddingTop: 5,
      paddingBottom: 0,
      backgroundColor: isDarkTheme ? "#121212" : "#fff",
      //paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    searchBar: {
      flex: 1,
      height: 40,
      fontSize: 17,
      paddingLeft: 0,
      textAlignVertical: "center",
      color: isDarkTheme ? "#f5f5f5" : "#000",
    },
    icon: {
      marginRight: 10,
      marginLeft: 5,
      color: isDarkTheme ? "#fff" : "#000",
    },
    search: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 0,
      borderRadius: 24,
      backgroundColor: isDarkTheme ? "#333" : "#ececec",
      width: "100%",
      padding: 5,
    },
    songName: {
      fontSize: 18,
      fontFamily: "Inter",
      padding: 20,
      paddingLeft: 10,
      color: isDarkTheme ? "#f5f5f5" : "#333",
    },
    clearButton: {
      padding: 8,
      position: "absolute",
      right: 0,
    },
    noResultsContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    noResultsText: {
      fontSize: 18,
      fontFamily: "Inter",
      color: isDarkTheme ? "#bbb" : "#666",
      textAlign: "center",
    },
  };
};
