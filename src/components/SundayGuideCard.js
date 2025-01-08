import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, FlatList } from 'react-native';
import { fetchSundayGuide } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SundayGuideCard({ refreshKey }) {
    const [guideData, setGuideData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedChurch, setSelectedChurch] = useState(null);

    useEffect(() => {
        const getGuideData = async () => {
            if (!selectedChurch || !selectedChurch.church_id) {
                setError('Church ID is undefined.');
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
                    setError('No information posted.');
                }
            } catch (err) {
                setError('Check your connection.');
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
                    setError('No church selected.');
                }
            } catch (error) {
                setError('Error retrieving church information.');
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
            <Text style={styles.title}>Sunday Guide</Text>
            <FlatList
                data={guideData}
                renderItem={renderGuideItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={<Text style={styles.emptyText}>No information available.</Text>}
                contentContainerStyle={{ flexGrow: 1 }}
                scrollEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        backgroundColor: '#ededed',
        marginBottom: 50,
        padding: 16,
        shadowColor: '#000',
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
    },
    guideItem: {
        marginBottom: 12,
    },
    guideTitle: {
        fontSize: 20,
        fontFamily: 'Archivo_700Bold',
        color: '#333',
        marginBottom: 4,
    },
    guideContent: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    errorText: {
        color: 'black',
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
        backgroundColor: '#ededed',
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
    },
});