import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTheme } from '../../redux/slices/themeSlice';

export default function MainAuthScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');
    const styles = getStyle(theme);
    const dispatch = useDispatch();

    useEffect(() => {
        NavigationBar.setBackgroundColorAsync(isDarkTheme ? '#121212' : '#fff');
        NavigationBar.setButtonStyleAsync(isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);

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

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right,
                backgroundColor: '#fff',
            }}
        >
            <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkTheme ? '#121212' : '#fff'}
            />
            <View style={styles.container}>
                <Image source={require('../../../assets/adaptive-icon.png')} style={styles.logo} />
                <Text style={styles.header}>Your Church Companion,</Text>
                <Text style={styles.subHeader}>Grace</Text>
                <View style={{ paddingBottom: 30 }}>
                    <TouchableOpacity
                        style={styles.signUpButton}
                        onPress={() => navigation.navigate('SignUp')}
                    >
                        <Text style={styles.buttonText}>SIGN UP</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.logInButton}
                    onPress={() => navigation.navigate('LogIn')}
                >
                    <Text style={styles.buttonText}>LOG IN</Text>
                </TouchableOpacity>
                <Image source={require('../../../assets/ivorypng (2).png')} style={{ width: 120, height: 120, top: 110 }} />
            </View>
        </View>
    );
}

const getStyle = (theme) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');
    return {
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
            width: '100%'
        },
        logo: {
            width: 250,
            height: 250,
            marginBottom: -30,
            bottom: 35
        },
        header: {
            fontSize: 24,
            fontFamily: 'Archivo_700Bold',
            textAlign: 'center',
            bottom: 38,
            color: isDarkTheme ? '#fff' : '#333'
        },
        subHeader: {
            fontSize: 24,
            fontFamily: 'Archivo_700Bold',
            marginBottom: 40,
            bottom: 38,
            color: isDarkTheme ? '#fff' : '#333'
        },
        signUpButton: {
            backgroundColor: '#6a5acd',
            width: 319,
            height: 57,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 50,
            marginBottom: 5,
        },
        logInButton: {
            backgroundColor: isDarkTheme ? '#312b36' : '#2b3635',
            width: 319,
            height: 57,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 50,
        },
        buttonText: {
            color: '#fff',
            fontSize: 16,
            fontFamily: 'Archivo_700Bold',
        },
    }
};
