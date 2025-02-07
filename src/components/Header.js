import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

const Header = ({ title, version, onVersionPress, showVersionButton }) => {
    const theme = useSelector((state) => state.theme.theme);
    const styles = getStyle(theme);

    return (
        <View style={styles.container}>
            <Text style={styles.title} maxFontSizeMultiplier={1}>{title}</Text>
            {showVersionButton && (
                <TouchableOpacity style={styles.versionButton} onPress={onVersionPress} activeOpacity={1}>
                    <Text style={styles.versionText} maxFontSizeMultiplier={1.2}>{version}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const getStyle = (theme) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');
    return {
        container: {
            height: 60,
            backgroundColor: isDarkTheme ? '#121212' : '#ffffff',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
        },
        title: {
            flex: 1,
            color: isDarkTheme ? '#fff' : '#333',
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
            fontFamily: 'Inter_700Bold'
        },
    }
}

export default Header;


