import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Linking, Switch, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import CustomError from '../../components/CustomError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import * as NavigationBar from 'expo-navigation-bar';

export default function SignUpScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [signUpSuccess, setSignUpSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');
    const styles = getStyle(theme);

    useEffect(() => {
        NavigationBar.setBackgroundColorAsync(isDarkTheme ? '#121212' : '#fff');
        NavigationBar.setButtonStyleAsync(isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);

    const handleSignUp = async () => {
        setError('');
        setSignUpSuccess(false);
        setIsLoading(true);

        try {
            const { error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) {
                if (authError.message.includes("already registered")) {
                    throw new Error('An account with this email already exists. Please log in or use a different email.');
                }
                throw new Error(authError.message || 'An unexpected error occurred during sign up.');
            }

            if (rememberMe) {
                await AsyncStorage.setItem('rememberedCredentials', JSON.stringify({ email, password }));
            }

            setSignUpSuccess(true);
        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleDeepLink = async (event) => {
            const { url } = event;
            if (url) {
                const path = Linking.parse(url).path;
                if (path === 'auth/callback') {
                    navigation.navigate('LogInScreeen');
                }
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        return () => {
            subscription.remove();
        };
    }, []);

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
            <View style={styles.fixedBackHeader}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                    <Ionicons name="chevron-back-outline" size={31} color="#9E44FF" />
                    <Text style={styles.returnText}>Return</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                <Image
                    source={require('../../../assets/adaptive-icon.png')}
                    style={styles.logo}
                />
                <Text style={styles.header}>Sign up for Grace</Text>

                {error ? (
                    <View style={{ bottom: 110 }}>
                        <CustomError message={error} />
                    </View>
                ) : null}

                {signUpSuccess && (
                    <View style={styles.successMessageContainer}>
                        <Text style={styles.successMessage}>
                            Check your Email and verify your account then proceed to Log In.
                        </Text>
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxFontSizeMultiplier={1.2}
                />
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        maxFontSizeMultiplier={1.2}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color="#aaa"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.rememberMeContainer}>
                    <Text style={styles.rememberMeText}>Remember credentials?</Text>
                    <Switch
                        value={rememberMe}
                        onValueChange={setRememberMe}
                        trackColor={{ false: '#ccc', true: '#d2cdf0' }}
                        thumbColor={rememberMe ? '#6a5acd' : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                </TouchableOpacity>
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
            width: '100%',
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
        },
        logo: {
            width: 300,
            height: 300,
            marginBottom: -20,
            bottom: 55,
        },
        input: {
            backgroundColor: isDarkTheme ? '#333' : '#f5f5f5',
            color: isDarkTheme ? '#f5f5f5' : '',
            width: 350,
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderRadius: 8,
            marginBottom: 15,
            fontSize: 16,
            bottom: 100,
        },
        passwordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkTheme ? '#333' : '#f5f5f5',
            width: 350,
            borderRadius: 8,
            marginBottom: 15,
            paddingHorizontal: 18,
            bottom: 100,
        },
        passwordInput: {
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 0,
            fontSize: 16,
            color: isDarkTheme ? '#f5f5f5' : ''
        },
        eyeIcon: {
            padding: 8,
        },
        header: {
            fontSize: 24,
            fontFamily: 'Archivo_700Bold',
            textAlign: 'center',
            bottom: 113,
            color: isDarkTheme ? '#fff' : '#333',
        },
        button: {
            backgroundColor: '#6a5acd',
            paddingVertical: 12,
            paddingHorizontal: 40,
            borderRadius: 8,
            bottom: 90,
        },
        buttonDisabled: {
            backgroundColor: '#ccc',
        },
        buttonText: {
            color: '#fff',
            fontSize: 16,
            fontFamily: 'Archivo_700Bold',
        },
        successMessageContainer: {
            marginBottom: 20,
            padding: 10,
            bottom: 100,
            backgroundColor: '#dff0d8',
            borderRadius: 8,
        },
        successMessage: {
            color: '#3c763d',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        fixedBackHeader: {
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
        },
        returnText: {
            fontSize: 16,
            color: '#9E44FF',
            marginLeft: 5,
            fontFamily: 'Inter',
        },
        rememberMeContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            bottom: 100,
        },
        checkbox: {
            marginRight: 10,
        },
        rememberMeText: {
            fontSize: 16,
            color: isDarkTheme ? '#fff' : '#333',
            fontFamily: 'Inter',
        },
    }
};
