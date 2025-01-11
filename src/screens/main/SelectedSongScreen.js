import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '../../redux/slices/themeSlice';
import * as NavigationBar from 'expo-navigation-bar';

const SelectedSongScreen = ({ navigation, route }) => {
    const { songTitle, songData } = route.params;

    const renderSongData = () => {
        const sections = [];
        Object.keys(songData).forEach((key) => {
            const isChorus = key.startsWith("*");
            const index = isChorus ? parseInt(key.slice(1), 10) : parseInt(key, 10);
            if (!sections[index]) {
                sections[index] = [];
            }
            sections[index].push({ key, text: songData[key], isChorus });
        });
        return sections.filter(Boolean);
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

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkTheme ? '#121212' : '#fff'}
            />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={27} style={{ color: isDarkTheme ? '#fff' : '#000' }} />
                </TouchableOpacity>
                <Text
                    style={styles.title}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {songTitle}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {renderSongData().map((section, index) => (
                    <View key={index} style={styles.section}>
                        {section.map(({ key, text, isChorus }, i) => (
                            <View key={key} style={styles.line}>
                                {!isChorus && (
                                    <View style={styles.verseContainer}>
                                        <Text style={styles.verseNumber}>{key}</Text>
                                        <Text style={styles.verse}>{text}</Text>
                                    </View>
                                )}
                                {isChorus && (
                                    <Text style={styles.chorus}>{text}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>
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
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
            paddingBottom: 4
        },
        backButton: {
            marginRight: 10,
        },
        title: {
            fontSize: 18,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#000',
            flex: 1,
            left: 10,
        },
        content: {
            padding: 16,
        },
        section: {
            marginBottom: 24,
        },
        line: {
            marginBottom: 16,
        },
        verseContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        verseNumber: {
            fontSize: 18,
            fontWeight: '690',
            fontFamily: 'SourceSerif4_700Bold',
            color: '#aaa',
            marginLeft: 16,
            right: 9,
        },
        verse: {
            fontSize: 22,
            fontFamily: 'Montserrat_700Bold',
            lineHeight: 31,
            color: isDarkTheme ? '#f5f5f5' : '#1d2829',
            flex: 1,
            marginLeft: 16,
            right: 18,
            paddingBottom: 0,
        },
        chorus: {
            fontSize: 23,
            fontFamily: 'Archivo_700Bold',
            lineHeight: 35,
            color: '#6a5acd',
            marginLeft: 60,
            right: 15,
            marginBottom: -15,
        },
    }
};
export default SelectedSongScreen;