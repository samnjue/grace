import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HighlightScreen = ({ navigation }) => {
  const theme = useSelector((state) => state.theme.theme);
  const [highlightedVerses, setHighlightedVerses] = useState({});
  const [bibleData, setBibleData] = useState(null);
  const insets = useSafeAreaInsets();
  const isDarkTheme = theme.toLowerCase().includes("dark");

  useEffect(() => {
    const loadBibleData = async () => {
      try {
        const response = require("../../data/bible.json");
        setBibleData(response);
      } catch (error) {
        console.error("Error loading Bible data:", error);
      }
    };

    const loadHighlights = async () => {
      try {
        const savedHighlights = await AsyncStorage.getItem("highlights");
        if (savedHighlights) {
          setHighlightedVerses(JSON.parse(savedHighlights));
        }
      } catch (error) {
        console.error("Error loading highlights:", error);
      }
    };

    loadBibleData();
    loadHighlights();
  }, []);

  const groupHighlights = (highlights) => {
    const sortedKeys = Object.keys(highlights).sort(
      (a, b) => highlights[b].timestamp - highlights[a].timestamp
    );

    const grouped = [];
    let currentGroup = [];

    sortedKeys.forEach((key, index) => {
      const [book, chapter, verse] = key.split("_");
      const prevKey = sortedKeys[index - 1];
      const [prevBook, prevChapter, prevVerse] = prevKey
        ? prevKey.split("_")
        : [];

      if (
        currentGroup.length === 0 ||
        (book === prevBook &&
          chapter === prevChapter &&
          parseInt(verse) === parseInt(prevVerse) + 1)
      ) {
        currentGroup.push(key);
      } else {
        grouped.push(currentGroup);
        currentGroup = [key];
      }
    });

    if (currentGroup.length > 0) {
      grouped.push(currentGroup);
    }

    return grouped;
  };

  const renderVerseText = (verseText, highlightColor) => {
    const parts = verseText.split(/`/);

    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <Text key={index} style={styles.redText} maxFontSizeMultiplier={1.2}>
          {part}
        </Text>
      ) : (
        <Text
          key={index}
          style={[isDarkTheme && highlightColor && { color: "#121212" }]}
          maxFontSizeMultiplier={1.2}
        >
          {part}
        </Text>
      )
    );
  };

  const groupedHighlights = groupHighlights(highlightedVerses);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkTheme ? "#121212" : "#fff",
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            style={{ color: isDarkTheme ? "#fff" : "#000" }}
          />
        </TouchableOpacity>
        <Text
          style={[styles.headerText, { color: isDarkTheme ? "#fff" : "#000" }]}
        >
          Highlights
        </Text>
      </View>

      {/* Highlighted Verses List */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {groupedHighlights.length === 0 ? (
          <Text
            style={[styles.emptyText, { color: isDarkTheme ? "#bbb" : "#333" }]}
          >
            Your highlighted verses go here
          </Text>
        ) : (
          groupedHighlights.map((group, index) => {
            const firstVerseKey = group[0];
            const lastVerseKey = group[group.length - 1];

            const [book, chapter, startVerse] = firstVerseKey.split("_");
            const [, , endVerse] = lastVerseKey.split("_");

            const verseRange =
              startVerse === endVerse
                ? `${startVerse}`
                : `${startVerse}-${endVerse}`;

            const verseElements = group.map((key) => {
              const [book, chapter, verse] = key.split("_");
              const verseText =
                bibleData?.[book]?.[chapter]?.verses?.[verse] ||
                "Verse not found";

              const highlightData = highlightedVerses[key];
              const highlightColor = highlightData
                ? highlightData.color
                : "#FFD700";

              return (
                <Text key={key}>
                  <Text style={styles.verseNumber}>{verse} </Text>
                  {renderVerseText(verseText, highlightColor)}{" "}
                </Text>
              );
            });

            const highlightData = highlightedVerses[firstVerseKey];
            const highlightColor = highlightData
              ? highlightData.color
              : "#FFD700";

            return (
              <View
                key={index}
                style={[styles.card, { backgroundColor: highlightColor }]}
              >
                <Text style={styles.cardTitle}>
                  {book} {chapter}:{verseRange}
                </Text>
                <Text style={styles.cardText}>{verseElements}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  headerText: {
    marginLeft: 10,
    fontSize: 21,
    fontFamily: "Archivo_700Bold",
  },
  content: {
    padding: 16,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "SourceSerif4_700Bold_Italic",
    marginBottom: 5,
  },
  cardText: {
    fontSize: 22,
    fontFamily: "SourceSerif4_400Regular",
  },
  verseNumber: {
    fontSize: 16,
    textAlignVertical: "top",
    lineHeight: 24,
    fontFamily: "SourceSerif4_400Regular",
    fontWeight: "600",
    color: "#888",
  },
  redText: {
    color: "red",
    fontFamily: "SourceSerif4_400Regular",
  },
});

export default HighlightScreen;
