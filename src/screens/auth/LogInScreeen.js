import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import { logIn, selectChurch, selectDistrict } from '../../redux/slices/userSlice';
import CustomError from '../../components/CustomError';
import { useSelector } from 'react-redux';
import * as NavigationBar from 'expo-navigation-bar';

export default function LogInScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');
    const styles = getStyle(theme);

    useEffect(() => {
        NavigationBar.setBackgroundColorAsync(isDarkTheme ? '#121212' : '#fff');
        NavigationBar.setButtonStyleAsync(isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);


    const dispatch = useDispatch();

    const handleLogIn = async () => {
        setError('');
        setIsLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

            if (authError) {
                throw new Error(authError.message);
            }

            if (data?.session) {
                await AsyncStorage.setItem('supabaseSession', JSON.stringify(data.session));
            }

            if (data?.session) {
                await AsyncStorage.setItem('userSession', JSON.stringify(data.session));

                dispatch(logIn({ email: data.session.user.email, session: data.session }));

                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('selected_church, selected_district')
                    .eq('id', data.session.user.id)
                    .single({ refresh: true });

                if (profileError) {
                    throw new Error(profileError.message);
                }

                if (profile?.selected_church) {
                    const church = { church_id: profile.selected_church };
                    await AsyncStorage.setItem('selectedChurch', JSON.stringify(church));
                    dispatch(selectChurch(profile.selected_church));
                }

                if (profile?.selected_district) {
                    const district = { district_id: profile.selected_district };
                    await AsyncStorage.setItem('selectedDistrict', JSON.stringify(district));
                    dispatch(selectDistrict(profile.selected_district));
                }

                if (profile?.selected_church && profile?.selected_district) {
                    navigation.replace('MainApp');
                } else {
                    navigation.replace('ChurchSelection');
                }
            }
        } catch (error) {
            console.error('Error during login:', error);
            setError(error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        const loadRememberedCredentials = async () => {
            const savedCredentials = await AsyncStorage.getItem('rememberedCredentials');
            if (savedCredentials) {
                const { email, password } = JSON.parse(savedCredentials);
                setEmail(email);
                setPassword(password);
            }
        };

        loadRememberedCredentials();
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
            <View style={styles.container}>
                {/* Back Button */}
                <View style={styles.fixedBackHeader}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                        <Ionicons name="chevron-back-outline" size={31} color={isDarkTheme ? "#9e44ff" : "#5f2999"} />
                        <Text style={styles.returnText}>Return</Text>
                    </TouchableOpacity>
                </View>

                {/* Logo and Header */}
                <Image source={require('../../../assets/adaptive-icon.png')} style={styles.logo} />
                <Text style={styles.header}>Log in to continue</Text>

                {/* Error Message */}
                {error && (
                    <View style={{ bottom: 110 }}>
                        <CustomError message={error} />
                    </View>
                )}

                {/* Email Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={isDarkTheme ? "#aaa" : "#666"}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxFontSizeMultiplier={1.2}
                />

                {/* Password Input with Eye Icon */}
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Password"
                        placeholderTextColor={isDarkTheme ? "#aaa" : "#666"}
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
                            size={26}
                            color={isDarkTheme ? "#aaa" : "#666"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Log In Button */}
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleLogIn}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Log In</Text>
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
        backHeader: {
            position: 'absolute',
            top: 10,
            left: -50,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
        },
        input: {
            backgroundColor: isDarkTheme ? '#333' : '#f5f5f5',
            width: 350,
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderRadius: 8,
            marginBottom: 15,
            fontSize: 16,
            bottom: 100,
            color: isDarkTheme ? '#f5f5f5' : '#000'
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
            color: isDarkTheme ? '#f5f5f5' : '#000'
        },
        eyeIcon: {
            padding: 8,
        },
        logo: {
            width: 300,
            height: 300,
            marginBottom: -20,
            bottom: 55,
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
        fixedBackHeader: {
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
        },
        returnText: {
            fontSize: 18,
            color: isDarkTheme ? "#9e44ff" : "#5f2999",
            marginLeft: -2,
            fontFamily: 'Inter',
        },
    }
};
