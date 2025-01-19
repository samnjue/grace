import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { fetchSundayGuide } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function SundayGuideCard({ refreshKey }) {
    const [guideData, setGuideData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedChurch, setSelectedChurch] = useState(null);
    const navigation = useNavigation();

    const theme = useSelector((state) => state.theme.theme);
    const styles = getStyle(theme);

    useEffect(() => {
        const getGuideData = async () => {
            if (!selectedChurch || !selectedChurch.church_id) {
                setError('Church ID is undefined');
                return;
            }

            try {
                setLoading(true);
                const data = await fetchSundayGuide(selectedChurch.church_id);
                if (data.length > 0) {
                    setGuideData(data);
                    await AsyncStorage.setItem('sundayGuide', JSON.stringify(data));
                    setError('');
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
            }
        };

        if (selectedChurch) {
            getGuideData();
        }
    }, [selectedChurch, refreshKey]);

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

    const renderGuideItem = ({ item }) => (
        <View style={styles.guideItem}>
            <Text style={styles.guideTitle}>{item.title}</Text>
            <Text style={styles.guideContent}>{item.content}</Text>
        </View>
    );

    if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#6A5ACD" />;

    if (error) return (
        <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Sunday Guide</Text>
            <Text style={styles.errorText}>{error}</Text>
        </View>
    );

    return (
        <View style={styles.card}>
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
        </View>
    );
}

const getStyle = (theme) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');
    return {
        card: {
            borderRadius: 10,
            backgroundColor: isDarkTheme ? '#2c2c2c' : '#ededed',
            marginBottom: 50,
            padding: 16,
            shadowColor: isDarkTheme ? '#aaa' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
            width: 380
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
        loader: {
            marginVertical: 16,
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
    }
};