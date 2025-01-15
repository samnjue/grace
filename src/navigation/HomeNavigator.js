import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/main/HomeScreen';
import VerseHistoryScreen from '../screens/main/VerseHistoryScreen';
import DistrictNewsScreen from '../screens/main/DistrictNewsScreen';
import PostNewsScreen from '../screens/main/PostNewsScreen';
import { TransitionSpecs } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function HomeNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="VerseHistoryScreen" component={VerseHistoryScreen} options={{
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
            <Stack.Screen name="DistrictNewsScreen" component={DistrictNewsScreen} options={{
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
            <Stack.Screen name="PostNewsScreen" component={PostNewsScreen} options={{
                gestureEnabled: true,
                gestureDirection: 'vertical',
                cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
        </Stack.Navigator>
    );
}