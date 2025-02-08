import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function SundayGuideScreen() {
    const [guideData, setGuideData] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(0);
    const scrollViewRef = useRef(null);
    const [cardScales, setCardScales] = useState([]);
    const [cardHeights, setCardHeights] = useState({});
    const [cardPositions, setCardPositions] = useState({});
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');
    const styles = getStyle(theme);

    useEffect(() => {
        loadGuideData();
    }, []);

    const getFormattedDate = () => {
        const date = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('en-US', options);
    };

    const loadGuideData = async () => {
        try {
            const storedData = await AsyncStorage.getItem('sundayGuide');
            const storedPosition = await AsyncStorage.getItem('currentPosition');

            if (storedPosition) {
                setCurrentPosition(parseInt(storedPosition, 10));
            }

            if (storedData) {
                const data = JSON.parse(storedData);
                setGuideData(data);
                setCardScales(data.map(() => new Animated.Value(1)));
            }
        } catch (error) {
            //console.error('Error loading guide data:', error);
        }
    };

    const handleRadioPress = async (index) => {
        if (!cardScales[currentPosition] || !cardScales[index]) return;

        Animated.timing(cardScales[currentPosition], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        Animated.timing(cardScales[index], {
            toValue: 1.09,
            duration: 200,
            useNativeDriver: true,
        }).start();

        setCurrentPosition(index);
        await AsyncStorage.setItem('currentPosition', index.toString());

        if (cardPositions[index]) {
            scrollViewRef.current?.scrollTo({
                y: cardPositions[index],
                animated: true,
            });
        }
    };

    const renderTimeline = () => (
        <View style={styles.timelineContainer}>
            {/* Continuous line that spans entire height */}
            <View style={styles.continuousLine} />

            {guideData.map((_, index) => {
                const isActivated = index <= currentPosition;
                const topPosition = cardPositions[index]
                    ? cardPositions[index] + (cardHeights[index] / 2) - 10
                    : 40 + (index * 60);

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleRadioPress(index)}
                        style={[
                            styles.radioButton,
                            isActivated && styles.radioButtonActivated,
                            { position: 'absolute', top: topPosition }
                        ]}
                    >
                        {isActivated && (
                            <Ionicons name="checkmark" size={14} color={isDarkTheme ? '#fff' : "#fff"} style={styles.radioCheckmark} />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const measureCard = (index, event) => {
        const { height, y } = event.nativeEvent.layout;
        setCardHeights(prev => ({
            ...prev,
            [index]: height
        }));
        setCardPositions(prev => ({
            ...prev,
            [index]: y
        }));
    };

    const renderCards = () => (
        <View style={styles.cardsContainer}>
            {guideData.map((item, index) => (
                <Animated.View
                    key={index}
                    onLayout={(event) => measureCard(index, event)}
                    style={[
                        styles.cardContainer,
                        {
                            transform: [{ scale: cardScales[index] }]
                        }
                    ]}
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.content}>{item.content}</Text>
                    </View>
                </Animated.View>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#fff' : "#000"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getFormattedDate()}</Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.contentContainer}>
                    {renderTimeline()}
                    {renderCards()}
                </View>
            </ScrollView>
        </View>
    );
}

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
        },
        backButton: {
            marginRight: 8,
        },
        headerTitle: {
            fontSize: 20,
            fontFamily: 'SourceSerif4_700Bold',
            color: isDarkTheme ? '#fff' : '#000',
        },
        scrollContainer: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
        },
        contentContainer: {
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingBottom: 20,
            minHeight: '100%',
        },
        timelineContainer: {
            position: 'relative',
            width: 30,
            height: '100%',
        },
        cardsContainer: {
            flex: 1,
            paddingTop: 40,
            paddingLeft: 20,
        },
        timelineBar: {
            width: 4,
            height: 60,
        },
        topTimelineBar: {
            position: 'absolute',
            top: 0,
            height: 40,
        },
        activatedBar: {
            backgroundColor: '#6a5acd',
        },
        deactivatedBar: {
            backgroundColor: '#d3d3d3',
        },
        radioButton: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 3,
            borderColor: isDarkTheme ? '#555' : '#d3d3d3',
            backgroundColor: isDarkTheme ? '#999' : '#fff',
            zIndex: 5,
        },
        radioButtonActivated: {
            borderColor: '#6a5acd',
            backgroundColor: '#6a5acd',
            zIndex: 5,
        },
        cardContainer: {
            marginBottom: 40,
        },
        card: {
            backgroundColor: isDarkTheme ? '#2c2c2c' : '#ededed',
            borderRadius: 10,
            padding: 20,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        title: {
            fontSize: 20,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#333',
            marginBottom: 8,
        },
        content: {
            fontSize: 16,
            fontFamily: 'SourceSerif4_700Bold',
            color: isDarkTheme ? '#dedede' : '#555',
            lineHeight: 20,
        },
    }
};