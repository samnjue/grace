import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StatusBar, TouchableOpacity, ScrollView, Animated, Share, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import bibleData from '../../data/bible.json';
import { Ionicons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '../../redux/slices/themeSlice';
import * as NavigationBar from 'expo-navigation-bar';

const ChapterScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef(null);
    const panelAnim = useRef(new Animated.Value(0)).current;

    const { book, chapter } = route.params;
    const chapterData = bibleData[book][chapter];
    const verses = chapterData.verses;
    const headers = chapterData.headers || {};

    const [selectedVerses, setSelectedVerses] = useState([]);
    const [highlightedVerses, setHighlightedVerses] = useState({});
    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

    const highlightColors = {
        red: '#f8d7da',
        yellow: '#fff3cd',
        blue: '#d1ecf1',
        green: '#d4edda',
    };

    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');

    const styles = getStyle(theme);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('appTheme');
                if (storedTheme) {
                    dispatch(setTheme(storedTheme));
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            }
        };

        loadTheme();
    }, [dispatch]);

    useEffect(() => {
        const saveTheme = async () => {
            try {
                await AsyncStorage.setItem('appTheme', theme);
            } catch (error) {
                console.error('Error saving theme:', error);
            }
        };

        saveTheme();
    }, [theme]);

    useEffect(() => {
        NavigationBar.setBackgroundColorAsync(isDarkTheme ? '#121212' : '#fff');
        NavigationBar.setButtonStyleAsync(isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);

    useEffect(() => {
        Animated.timing(panelAnim, {
            toValue: isPanelVisible ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isPanelVisible]);

    useEffect(() => {
        const loadHighlights = async () => {
            try {
                const savedHighlights = await AsyncStorage.getItem('highlights');
                if (savedHighlights) {
                    setHighlightedVerses(JSON.parse(savedHighlights));
                }
            } catch (error) {
                console.error('Error loading highlights:', error);
            }
        };
        loadHighlights();
    }, []);

    const handlePrevChapter = () => {
        const prevChapter = parseInt(chapter) - 1;
        if (prevChapter >= 1) {
            navigation.navigate('ChapterScreen', { book, chapter: prevChapter.toString() });
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const handleNextChapter = () => {
        const nextChapter = parseInt(chapter) + 1;
        if (bibleData[book][nextChapter]) {
            navigation.navigate('ChapterScreen', { book, chapter: nextChapter.toString() });
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const toggleVerseSelection = (verseKey) => {
        let newSelectedVerses;

        if (selectedVerses.includes(verseKey)) {
            newSelectedVerses = selectedVerses.filter((v) => v !== verseKey);
        } else {
            newSelectedVerses = [...selectedVerses, verseKey];
        }

        setSelectedVerses(newSelectedVerses);

        if (newSelectedVerses.length === 0) {
            setIsPanelVisible(false);
        } else {
            setIsPanelVisible(true);
        }
    };

    const saveHighlightsToStorage = async (highlights) => {
        try {
            await AsyncStorage.setItem('highlights', JSON.stringify(highlights));
        } catch (error) {
            console.error('Error saving highlights:', error);
        }
    };

    const applyHighlight = (color) => {
        const updatedHighlights = { ...highlightedVerses };
        selectedVerses.forEach((verse) => {
            const uniqueKey = `${book}_${chapter}_${verse}`;
            updatedHighlights[uniqueKey] = color;
        });
        setHighlightedVerses(updatedHighlights);
        saveHighlightsToStorage(updatedHighlights);
        setSelectedVerses([]);
        setIsPanelVisible(false);
    };


    const removeHighlight = () => {
        const updatedHighlights = { ...highlightedVerses };
        selectedVerses.forEach((verse) => {
            const uniqueKey = `${book}_${chapter}_${verse}`;
            delete updatedHighlights[uniqueKey];
        });
        setHighlightedVerses(updatedHighlights);
        saveHighlightsToStorage(updatedHighlights);
        setSelectedVerses([]);
        setIsPanelVisible(false);
    };

    const renderVerse = (verseText, verseKey) => {
        const parts = verseText.split(/`/);
        const isSelected = selectedVerses.includes(verseKey);
        const highlightColor = highlightedVerses[`${book}_${chapter}_${verseKey}`];

        return (
            <TouchableOpacity
                key={verseKey}
                onLongPress={() => toggleVerseSelection(verseKey)}
                onPress={() => {
                    if (selectedVerses.length > 0) toggleVerseSelection(verseKey);
                }}
                style={[
                    styles.verseContainer,
                    highlightColor && { backgroundColor: highlightColor, borderRadius: 10 },
                ]}
                activeOpacity={1}
            >
                <Text style={[styles.verse, isSelected && styles.selectedVerse]} maxFontSizeMultiplier={1.2}>
                    <Text style={styles.verseNumber} maxFontSizeMultiplier={1.2}>{verseKey} </Text>
                    {parts.map((part, index) =>
                        index % 2 === 1 ? (
                            <Text key={index} style={styles.redText} maxFontSizeMultiplier={1.2}>
                                {part}
                            </Text>
                        ) : (
                            <Text
                                key={index}
                                style={[
                                    isDarkTheme && highlightColor && { color: '#121212' },
                                ]}
                                maxFontSizeMultiplier={1.2}
                            >
                                {part}
                            </Text>
                        )
                    )}
                </Text>
            </TouchableOpacity>
        );
    };

    const formatSelectedVerses = (verses) => {
        if (verses.length === 0) return '';

        const sortedVerses = [...verses].sort((a, b) => parseInt(a) - parseInt(b));
        const ranges = [];
        let rangeStart = sortedVerses[0];
        let previous = sortedVerses[0];

        for (let i = 1; i < sortedVerses.length; i++) {
            const current = sortedVerses[i];
            if (parseInt(current) === parseInt(previous) + 1) {
                previous = current;
            } else {
                ranges.push(rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`);
                rangeStart = current;
                previous = current;
            }
        }
        ranges.push(rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`);
        return ranges.join(', ');
    };

    const handleCopy = () => {
        let formattedText = `${book} ${chapter}:`;

        const sortedVerses = [...selectedVerses].sort((a, b) => parseInt(a) - parseInt(b));
        let ranges = [];
        let rangeStart = sortedVerses[0];
        let previous = sortedVerses[0];

        for (let i = 1; i < sortedVerses.length; i++) {
            const current = sortedVerses[i];
            if (parseInt(current) === parseInt(previous) + 1) {
                previous = current;
            } else {
                ranges.push(rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`);
                rangeStart = current;
                previous = current;
            }
        }

        ranges.push(rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`);
        formattedText += ` ${ranges.join(', ')}`;

        formattedText += ' ';

        sortedVerses.forEach(verseKey => {
            let verseText = verses[verseKey];

            verseText = verseText.replace(/`/g, '').replace(/\n/g, '');

            formattedText += ` [${verseKey}] ${verseText}`;
        });

        Clipboard.setString(formattedText);

        setSelectedVerses([]);
        setIsPanelVisible(false);

        setIsSuccessModalVisible(true);
    };

    const handleShare = async () => {
        if (selectedVerses.length === 0) {
            alert("Please select at least one verse to share.");
            return;
        }

        let formattedText = `${book} ${chapter}: ${formatSelectedVerses(selectedVerses)} `;
        selectedVerses.forEach((verseKey) => {
            const verseText = verses[verseKey].replace(/`/g, '').replace(/\n/g, '');
            formattedText += `[${verseKey}] ${verseText} `;
        });

        try {
            const result = await Share.share({
                message: formattedText,
                title: "Share Bible Verses",
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log("Shared with activity type: ", result.activityType);
                } else {
                    //console.log("Shared successfully!");
                }
            } else if (result.action === Share.dismissedAction) {
                console.log("Share dialog dismissed.");
            }
        } catch (error) {
            alert("An error occurred while trying to share the verses.");
        }

        setSelectedVerses([]);
        setIsPanelVisible(false);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkTheme ? '#121212' : '#fff'}
            />
            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                contentContainerStyle={{ paddingBottom: isPanelVisible ? 250 : 50 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.chapterNumber} maxFontSizeMultiplier={1.2}>{chapter}</Text>
                {Object.keys(verses).map((verseKey) => (
                    <View key={verseKey}>
                        {headers[verseKey] && <Text style={styles.header} maxFontSizeMultiplier={1.2}>{headers[verseKey]}</Text>}
                        {renderVerse(verses[verseKey], verseKey)}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.pillContainer}>
                    <View style={styles.pillBackButton}>
                        <Ionicons name="arrow-back-outline" size={25} color="#333" />
                    </View>
                    <Text
                        style={styles.pillBookTitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        adjustsFontSizeToFit
                        maxFontSizeMultiplier={1.2}
                    >
                        {book}
                    </Text>
                </TouchableOpacity>
            </View>

            {isPanelVisible && (
                <Animated.View
                    style={[
                        styles.panel,
                        {
                            transform: [
                                {
                                    translateY: panelAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [300, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle} maxFontSizeMultiplier={1.2}>
                            {book} {chapter}:{formatSelectedVerses(selectedVerses)}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedVerses([]);
                                setIsPanelVisible(false);
                            }}
                            style={{ right: 10 }}
                        >
                            <Ionicons name="close" size={24} color="grey" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.panelContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="sparkles" size={24} style={{ left: 25, bottom: 5, color: isDarkTheme ? '#f6f6f6' : '#333' }} />
                            <Text style={styles.panelSectionTitle} maxFontSizeMultiplier={1.2}>Highlight</Text>
                        </View>
                        <View style={styles.colorOptions}>
                            {Object.entries(highlightColors).map(([colorName, color]) => (
                                <TouchableOpacity
                                    key={colorName}
                                    style={[styles.colorCircle, { backgroundColor: color }]}
                                    onPress={() => applyHighlight(color)}
                                />
                            ))}
                            {selectedVerses.some((verse) => highlightedVerses[`${book}_${chapter}_${verse}`]) && (
                                <TouchableOpacity onPress={removeHighlight}>
                                    <Ionicons name="close-circle" size={30} color="grey" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={handleCopy} style={styles.button}>
                                <Ionicons name="copy-outline" size={24} style={{ color: isDarkTheme ? '#fff' : '#333' }} />
                                <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>Copy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleShare} style={styles.button}>
                                <Ionicons name="share-social-outline" size={24} style={{ color: isDarkTheme ? '#fff' : '#333' }} />
                                <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}

            {!isPanelVisible && (
                <>
                    <TouchableOpacity
                        onPress={handlePrevChapter}
                        disabled={parseInt(chapter) === 1}
                        style={[
                            styles.navButton,
                            styles.prevButton,
                            parseInt(chapter) === 1 && styles.disabledButton,
                        ]}
                    >
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleNextChapter}
                        disabled={!bibleData[book][parseInt(chapter) + 1]}
                        style={[
                            styles.navButton,
                            styles.nextButton,
                            !bibleData[book][parseInt(chapter) + 1] && styles.disabledButton,
                        ]}
                    >
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                </>
            )}

            {/* Success Modal */}
            <Modal
                visible={isSuccessModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsSuccessModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Ionicons name="checkmark-circle" size={80} color="#32d15d" style={{ paddingTop: -10, bottom: 5 }} />
                        <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>Text copied to clipboard!</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setIsSuccessModalVisible(false);
                            }}
                        >
                            <Text style={styles.modalButtonText} maxFontSizeMultiplier={1.2}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const getStyle = (theme) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');
    return {
        container: {
            flex: 1,
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
        },
        selectedVerse: {
            textDecorationLine: 'underline',
        },
        panel: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '32%',
            backgroundColor: isDarkTheme ? '#000' : '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 0.1,
            borderColor: '#d6d2d2',
            elevation: 10,
            padding: 15,
        },
        headerContainer: {
            paddingHorizontal: 20,
            paddingLeft: 40,
            height: 45,
            bottom: 765,
            marginBottom: -15,
            alignItems: 'center',
            elevation: 5,
        },
        pillContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ccc',
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 25,
            right: 130,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 5,
            maxWidth: 140,
            overflow: 'hidden',
        },
        pillBackButton: {
            marginRight: 10,
        },
        pillBookTitle: {
            fontFamily: 'SourceSerif4_700Bold_Italic',
            color: '#333',
            flex: 1,
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
        },
        chapterNumber: {
            fontSize: 70,
            fontWeight: '600',
            fontFamily: 'SourceSerif4_700Bold',
            textAlign: 'center',
            color: isDarkTheme ? '#f5f5f5' : '#333',
            marginBottom: 0,
        },
        header: {
            fontSize: 18,
            fontFamily: 'SourceSerif4_900Black_Italic',
            marginBottom: 10,
            color: isDarkTheme ? '#fff' : '#666',
        },
        verseContainer: {
            paddingVertical: 5,
        },
        verse: {
            fontSize: 22,
            fontWeight: '400',
            fontFamily: 'SourceSerif4_400Regular',
            lineHeight: 24,
            marginBottom: 10,
            color: isDarkTheme ? '#f4f4f4' : '#333',
        },
        verseNumber: {
            fontSize: 16,
            textAlignVertical: 'top',
            lineHeight: 24,
            fontFamily: 'SourceSerif4_400Regular',
            fontWeight: '600',
            color: '#888',
        },
        redText: {
            color: '#EE4B2B',
            fontSize: 22,
            fontWeight: '600',
            fontFamily: 'SourceSerif4_400Regular',
            lineHeight: 24,
            marginBottom: 10,
        },
        panelHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        panelTitle: {
            fontSize: 16,
            fontFamily: 'SourceSerif4_700Bold_Italic',
            color: isDarkTheme ? '#f6f6f6' : '#333',
            flex: 1,
            left: 26
        },
        navButton: {
            position: 'absolute',
            bottom: 8,
            width: 60,
            height: 60,
            backgroundColor: '#6a5acd',
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
        },
        prevButton: {
            left: 20,
        },
        nextButton: {
            right: 20,
        },
        disabledButton: {
            backgroundColor: '#ccc',
        },
        panelContent: {
            marginTop: 10,
        },
        panelSectionTitle: {
            fontSize: 16,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#f6f6f6' : '#333',
            marginBottom: 10,
            paddingLeft: 30
        },
        colorOptions: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginVertical: 10,
        },
        colorCircle: {
            width: 36,
            height: 36,
            borderRadius: 25,
        },
        separator: {
            height: 1,
            backgroundColor: '#ccc',
            marginVertical: 10,
        },
        buttonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            marginTop: 10,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkTheme ? '#2c2c2c' : '#f0f0f0',
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 20,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
        },
        buttonText: {
            marginLeft: 10,
            fontSize: 16,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#333',
        },
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        modalContent: {
            backgroundColor: isDarkTheme ? '#000' : '#fff',
            borderRadius: 25,
            padding: 45,
            paddingTop: 20,
            alignItems: 'center',
            width: '80%',
        },
        modalText: {
            fontSize: 22,
            color: isDarkTheme ? '#f6f6f6' : '#333',
            marginVertical: 7,
            marginTop: -10,
            fontFamily: 'Inter_700Bold',
            textAlign: 'center',
            top: 18
        },
        modalButton: {
            marginTop: 20,
            backgroundColor: '#6a5acd',
            height: 50,
            width: 150,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            top: 25,
        },
        modalButtonText: {
            color: '#fff',
            fontSize: 16,
            fontFamily: 'Archivo_700Bold',
            textAlign: 'center',
        },
    }
};

export default ChapterScreen;
