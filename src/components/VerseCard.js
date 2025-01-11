import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, ActivityIndicator } from 'react-native';
import { fetchVerseOfTheDay } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerseCard({ refreshKey }) {
    const [verse, setVerse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const getVerse = async () => {
            try {
                setLoading(true);
                const data = await fetchVerseOfTheDay();
                if (data) {
                    setVerse(data);
                    await AsyncStorage.setItem('verseOfTheDay', JSON.stringify(data));
                    setError('');
                } else {
                    setError('No verse found.');
                }
            } catch (err) {
                setError('Check your connection.');
                const cachedVerse = await AsyncStorage.getItem('verseOfTheDay');
                if (cachedVerse) {
                    setVerse(JSON.parse(cachedVerse));
                }
            } finally {
                setLoading(false);
            }
        };

        getVerse();
    }, [refreshKey]);

    if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#6A5ACD" />;

    if (error) return (
        <View style={styles.errorCard}>
            <Text style={styles.errorTitle} maxFontSizeMultiplier={1.2}>Verse of the day</Text>
            <Text style={styles.errorText} maxFontSizeMultiplier={1.2}>{error}</Text>
        </View>
    );

    return (
        <ImageBackground
            source={{ uri: verse?.backgroundImage }}
            style={styles.card}
            imageStyle={styles.image}
        >
            <View>
                <Text style={styles.title} maxFontSizeMultiplier={1.2}>Verse of the Day</Text>
                <Text style={styles.reference} maxFontSizeMultiplier={1.2}>{verse?.reference}</Text>
                <Text style={styles.content} maxFontSizeMultiplier={1.2}>{verse?.verse_text}</Text>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 16,
        padding: 16,
        flexGrow: 1,
        minHeight: 200
    },
    image: {
        borderRadius: 10,
        opacity: 0.8,
    },
    title: {
        fontSize: 16,
        fontWeight: '300',
        color: '#ffffff',
        marginBottom: 0,
        marginTop: 0,
    },
    reference: {
        fontSize: 17,
        fontFamily: 'Inter_700Bold',
        color: '#FFFFFF',
        marginBottom: 10,
        marginTop: 10,
    },
    content: {
        fontSize: 24,
        color: 'white',
        fontWeight: '600',
        textAlign: 'left',
        lineHeight: 29,
        marginTop: 5,
        fontFamily: 'SourceSerif4_400Regular',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 50,
    },
    loader: {
        marginVertical: 16,
    },
    errorCard: {
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
    verse_text: {
        fontSize: 24,
        color: 'white',
        fontWeight: '600',
        textAlign: 'left',
        lineHeight: 29,
        marginTop: 5,
        fontFamily: 'SourceSerif'
    }
});