import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Header = ({ title, version, onVersionPress, showVersionButton }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title} maxFontSizeMultiplier={1}>{title}</Text>
            {showVersionButton && (
                <TouchableOpacity style={styles.versionButton} onPress={onVersionPress} activeOpacity={0}>
                    <Text style={styles.versionText} maxFontSizeMultiplier={1.2}>{version}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 60,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        //marginBottom: -10,
    },
    title: {
        flex: 1,
        color: '#333',
        fontSize: 30,
        fontFamily: 'Archivo_700Bold',
        textAlign: 'left',
        marginLeft: 10,
    },
    versionButton: {
        backgroundColor: '#dddddd',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 15,
    },
    versionText: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default Header;


