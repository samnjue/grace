import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, Animated } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchSundayGuide } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function SundayGuideCard({ refreshKey }) {
    const [guideData, setGuideData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedChurch, setSelectedChurch] = useState(null);
    const theme = useSelector((state) => state.theme.theme);
    const styles = getStyle(theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');
    const navigation = useNavigation();

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const getSelectedChurch = async () => {
            try {
                const storedChurch = await AsyncStorage.getItem('selectedChurch');
                if (storedChurch) {
                    const parsedChurch = JSON.parse(storedChurch);
                    setSelectedChurch(parsedChurch);
                    setError('');
                } else {
                    setError('No church selected');
                }
            } catch (error) {
                setError('Error retrieving church information');
            }
        };

        getSelectedChurch();
    }, [refreshKey]);

    useFocusEffect(
        useCallback(() => {
            const refreshGuide = async () => {
                if (!selectedChurch || !selectedChurch.church_id) return;

                try {
                    const data = await fetchSundayGuide(selectedChurch.church_id);
                    if (data.length > 0) {
                        setGuideData(data);
                        await AsyncStorage.setItem('sundayGuide', JSON.stringify(data));
                    }
                } catch (err) {
                    console.log('Refresh failed:', err);
                }
            };

            refreshGuide();
        }, [selectedChurch])
    );

    useEffect(() => {
        const getGuideData = async () => {
            if (!selectedChurch || !selectedChurch.church_id) {
                setError('Church ID is undefined');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');
                const data = await fetchSundayGuide(selectedChurch.church_id);
                if (data.length > 0) {
                    setGuideData(data);
                    await AsyncStorage.setItem('sundayGuide', JSON.stringify(data));
                } else {
                    setError('No information posted');
                }
            } catch (err) {
                setError('Check your connection');
                const cachedGuide = await AsyncStorage.getItem('sundayGuide');
                if (cachedGuide) {
                    setGuideData(JSON.parse(cachedGuide));
                }
            } finally {
                setLoading(false);
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(contentOpacity, {
                        toValue: 1,
                        duration: 400,
                        delay: 100,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        };

        if (selectedChurch) {
            getGuideData();
        }
    }, [selectedChurch, refreshKey]);

    const renderGuideItem = ({ item }) => (
        <View style={styles.guideItem}>
            <Text style={styles.guideTitle}>{item.title}</Text>
            <Text style={styles.guideContent}>{item.content}</Text>
        </View>
    );

    return (
        <View>
            {loading ? (
                <Animated.View style={[styles.shimmerWrapper, { opacity: fadeAnim }]}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        shimmerColors={isDarkTheme ? ['#202020', '#181818', '#202020'] : ['#e1e1e1', '#eeeeee', '#e1e1e1']}
                        style={styles.shimmerCard}
                        autoRun={true}
                    />
                </Animated.View>
            ) : error ? (
                <Animated.View style={[styles.errorCard]}>
                    <TouchableOpacity
                        style={styles.historyButton}
                        onPress={() => navigation.navigate('SundayGuideScreen')}
                    >
                        <Ionicons name="chevron-forward" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.errorTitle}>Sunday Guide</Text>
                    <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
            ) : (
                <Animated.View style={[styles.card]}>
                    <TouchableOpacity
                        style={styles.historyButton}
                        onPress={() => navigation.navigate('SundayGuideScreen')}
                    >
                        <Ionicons name="chevron-forward" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Sunday Guide</Text>
                    <FlatList
                        data={guideData.slice(0, 3)}
                        renderItem={renderGuideItem}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={<Text style={styles.emptyText}>No information available.</Text>}
                        contentContainerStyle={{ flexGrow: 1 }}
                        scrollEnabled={false}
                    />
                </Animated.View>
            )}
        </View>
    );
}

const getStyle = (theme) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');
    return {
        card: {
            borderRadius: 10,
            backgroundColor: isDarkTheme ? '#2c2c2c' : '#ededed',
            marginBottom: 40,
            padding: 16,
            shadowColor: isDarkTheme ? '#aaa' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
            width: 380,
            maxWidth: 380,
        },
        title: {
            fontSize: 19,
            fontWeight: '300',
            marginBottom: 8,
            color: isDarkTheme ? '#fff' : '#000',
        },
        guideItem: {
            marginBottom: 12,
        },
        guideTitle: {
            fontSize: 20,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#333',
            marginBottom: 4,
        },
        guideContent: {
            fontSize: 16,
            fontFamily: 'Inter_600SemiBold',
            color: isDarkTheme ? '#999' : '#555',
        },
        errorText: {
            color: isDarkTheme ? '#999' : '#555',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            marginVertical: 50,
        },
        emptyText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: isDarkTheme ? '#999' : '#555',
            textAlign: 'center',
            marginVertical: 8,
        },
        errorCard: {
            height: 200,
            width: 380,
            borderRadius: 10,
            marginBottom: 40,
            padding: 16,
            backgroundColor: isDarkTheme ? '#2c2c2c' : '#ededed',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
        },
        errorTitle: {
            fontSize: 19,
            fontWeight: '300',
            marginBottom: 8,
            color: isDarkTheme ? '#fff' : '#000',
        },
        shimmerWrapper: {
            borderRadius: 10,
            marginBottom: 16,
            overflow: 'hidden',
        },
        shimmerCard: {
            borderRadius: 10,
            minHeight: 200,
            backgroundColor: isDarkTheme ? '#1d1d1d' : '#eeeeee',
            height: 250,
            width: 380,
        },
        historyButton: {
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: '#6A5ACD',
            borderRadius: 20,
            width: 35,
            height: 35,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
    };
};