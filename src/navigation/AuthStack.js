import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import ChurchSelectionScreen from '../screens/auth/ChurchSelectionScreen';
import DistrictSelectionScreen from '../screens/auth/DistrictSelectionScreen';
import MainAuthScreen from '../screens/auth/MainAuth';
import SignUpScreen from '../screens/auth/SignUpScreen';
import LogInScreen from '../screens/auth/LogInScreeen';
import MainTabNavigator from './MainTabNavigator';
import { TransitionSpecs } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainAuth" component={MainAuthScreen} />
            <Stack.Screen name="LogIn" component={LogInScreen} options={{
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
            <Stack.Screen name="ChurchSelection" component={ChurchSelectionScreen} options={{
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
            <Stack.Screen name="DistrictSelection" component={DistrictSelectionScreen} options={{
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
            <Stack.Screen name="MainApp" component={MainTabNavigator} options={{
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
        </Stack.Navigator>
    );
};
