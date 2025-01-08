import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import { logIn } from '../redux/slices/userSlice';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        const checkUserSession = async () => {
            const session = await AsyncStorage.getItem('userSession');
            if (session) {
                const parsedSession = JSON.parse(session);
                dispatch(logIn(parsedSession));
            }
        };
        checkUserSession();
    }, [dispatch]);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user?.session ? (
                    <Stack.Screen name="MainApp" component={MainTabNavigator} />
                ) : (
                    <Stack.Screen name="AuthStack" component={AuthStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
