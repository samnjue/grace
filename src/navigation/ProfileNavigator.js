import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { TransitionSpecs } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import ProfileScreen from "../screens/main/ProfileScreen";
import ShareAppScreen from "../screens/main/ShareAppScreen";
import ContactScreen from "../screens/main/ContactScreen";
import EditScreen from "../screens/main/EditScreen";


const Stack = createStackNavigator();

export default function SongNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} >
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="ShareScreen" component={ShareAppScreen} options={{
                gestureEnabled: true,
                gestureDirection: 'vertical',
                cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                }
            }} />
            <Stack.Screen name="ContactScreen" component={ContactScreen} options={{
                gestureEnabled: true,
                gestureDirection: 'vertical',
                cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                }
            }} />
            <Stack.Screen name="EditScreen" component={EditScreen} options={{
                gestureEnabled: true,
                gestureDirection: 'vertical',
                cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                }
            }} />
        </Stack.Navigator>
    );
};