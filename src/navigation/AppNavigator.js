import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import { logIn } from '../redux/slices/userSlice';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import ChurchSelectionScreen from '../screens/auth/ChurchSelectionScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTheme } from '../redux/slices/themeSlice';
import * as NavigationBar from 'expo-navigation-bar';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState('AuthStack');
    const user = useSelector((state) => state.user);
    //console.log('Complete user state:', user);
    const dispatch = useDispatch();

    useEffect(() => {
        const checkUserSession = async () => {
            try {
                const session = await AsyncStorage.getItem('userSession');
                if (session) {
                    const parsedSession = JSON.parse(session);
                    dispatch(logIn(parsedSession));

                    const { data: profile, error } = await supabase
                        .from('users')
                        .select('selected_church, selected_district')
                        .eq('id', parsedSession.user.id)
                        .single();

                    if (error) {
                        //console.error('Error fetching profile:', error.message);
                    } else if (profile?.selected_church && profile?.selected_district) {
                        setInitialRoute('MainApp');
                    } else {
                        setInitialRoute('ChurchSelection');
                    }
                } else {
                    setInitialRoute('AuthStack');
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkUserSession();
    }, [dispatch]);

    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');

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
        NavigationBar.setBackgroundColorAsync(isDarkTheme ? '#121212' : '#fff');
        NavigationBar.setButtonStyleAsync(isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);

    const appTheme = isDarkTheme
        ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#121212' } }
        : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#fff' } };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkTheme ? '#121212' : '#fff' }}>
                <ActivityIndicator size="large" color="#6a5acd" />
            </View>
        );
    }

    //console.log('User session state:', user?.session);

    return (
        <NavigationContainer theme={appTheme}>
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
                <Stack.Screen name="AuthStack" component={AuthStack} />
                <Stack.Screen name="MainApp" component={MainTabNavigator} />
                <Stack.Screen name="ChurchSelection" component={ChurchSelectionScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
