import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CustomError({ message }) {
    return (
        <View style={styles.container}>
            <Text style={styles.errorText} maxFontSizeMultiplier={1.2}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f8d7da',
        padding: 10,
        borderRadius: 8,
        marginVertical: 10,
    },
    errorText: {
        color: '#721c24',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Inter'
    },
});