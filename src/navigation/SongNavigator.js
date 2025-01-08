import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SongsScreen from "../screens/main/SongScreen";
import SelectedSongScreen from "../screens/main/SelectedSongScreen";
import { TransitionSpecs } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function SongNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} >
            <Stack.Screen name="SongScreen" component={SongsScreen} />
            <Stack.Screen name="SelectedSongScreen" component={SelectedSongScreen} options={{
                cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} />
        </Stack.Navigator>
    );
}