import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { fetchDistrictNews } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function DistrictNewsCard({ refreshKey }) {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const selectedDistrict = useSelector((state) => state.user.selectedDistrict);
    const theme = useSelector((state) => state.theme.theme);
    const styles = getStyle(theme);

    const navigation = useNavigation();

    useEffect(() => {
        const getNews = async () => {
            if (!selectedDistrict) {
                setError('No district selected');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const data = await fetchDistrictNews(selectedDistrict);
                if (data.length > 0) {
                    setNews(data);

                    await AsyncStorage.setItem(
                        `districtNews_${selectedDistrict}`,
                        JSON.stringify(data)
                    );
                    setError('');
                } else {
                    setError('No information posted');
                }
            } catch (err) {
                setError('Check your connection');

                const cachedNews = await AsyncStorage.getItem(
                    `districtNews_${selectedDistrict}`
                );
                if (cachedNews) {
                    setNews(JSON.parse(cachedNews));
                }
            } finally {
                setLoading(false);
            }
        };

        getNews();
    }, [selectedDistrict, refreshKey]);

    const renderNewsItem = ({ item }) => (
        <View style={styles.newsItem}>
            <Text style={styles.newsTitle} maxFontSizeMultiplier={1.2}>{item.title}</Text>
            <Text style={styles.newsContent} maxFontSizeMultiplier={1.2}>{item.content}</Text>
        </View>
    );

    if (loading) {
        return <ActivityIndicator style={styles.loader} size="large" color="#6A5ACD" />;
    }

    if (error) {
        return (
            <View style={styles.errorCard}>
                <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => navigation.navigate('DistrictNewsScreen')}
                >
                    <Ionicons name="chevron-forward" size={22} color="white" />
                </TouchableOpacity>
                <Text style={styles.errorTitle} maxFontSizeMultiplier={1.2}>District News</Text>
                <Text style={styles.errorText} maxFontSizeMultiplier={1.2}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.historyButton}
                onPress={() => navigation.navigate('DistrictNewsScreen')}
            >
                <Ionicons name="chevron-forward" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.title} maxFontSizeMultiplier={1.2}>District News</Text>
            <FlatList
                data={news}
                renderItem={renderNewsItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                    <Text style={styles.emptyText} maxFontSizeMultiplier={1.2}>
                        No information posted. Check back later
                    </Text>
                }
                contentContainerStyle={{ flexGrow: 1 }}
                scrollEnabled={false}
            />
        </View>
    );
}

const getStyle = (theme) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');
    return {
        card: {
            borderRadius: 10,
            backgroundColor: isDarkTheme ? '#2c2c2c' : '#ededed',
            marginBottom: 16,
            padding: 16,
            shadowColor: isDarkTheme ? '#aaa' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
            width: 380,
            maxWidth: 380,
            position: 'relative',
        },
        title: {
            fontSize: 19,
            fontWeight: '300',
            marginBottom: 8,
            color: isDarkTheme ? '#fff' : '#000',
        },
        newsItem: {
            marginBottom: 12,
        },
        newsTitle: {
            fontSize: 20,
            fontFamily: "Archivo_700Bold",
            color: isDarkTheme ? '#fff' : '#333',
            marginBottom: 4,
        },
        newsContent: {
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
        loader: {
            marginVertical: 16,
        },
        emptyText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#555',
            textAlign: 'center',
            marginVertical: 8,
        },
        errorCard: {
            height: 200,
            width: 380,
            borderRadius: 10,
            marginBottom: 16,
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
