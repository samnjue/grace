import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/main/HomeScreen";
import VerseHistoryScreen from "../screens/main/VerseHistoryScreen";
import DistrictNewsScreen from "../screens/main/DistrictNewsScreen";
import PostNewsScreen from "../screens/main/PostNewsScreen";
import SundayGuideScreen from "../screens/main/SundayGuideScreen";
import SelectedSongScreen from "../screens/main/SelectedSongScreen.js";
import ChapterScreen from "../screens/main/ChapterScreen.js";
import SermonScreen from "../screens/main/SermonScreen.js";
import SundayGuideHistoryScreen from "../screens/main/SundayGuideHistoryScreen";
import NewGuideScreen from "../screens/main/NewGuideScreen";
import MainGuideScreen from "../screens/main/MainGuideScreen";
import TypeScreen from "../screens/main/TypeScreen";
import ItemCreationScreen from "../screens/main/ItemCreationScreen";
import SelectHymnScreen from "../screens/main/SelectHymnScreen";
import SermonTextScreen from "../screens/main/SermonTextScreen";
import { TransitionSpecs } from "@react-navigation/stack";
import { CardStyleInterpolators } from "@react-navigation/stack";

const Stack = createStackNavigator();

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen
        name="VerseHistoryScreen"
        component={VerseHistoryScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromRightAndroid,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="DistrictNewsScreen"
        component={DistrictNewsScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromRightAndroid,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="PostNewsScreen"
        component={PostNewsScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: "vertical",
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="SundayGuideScreen"
        component={SundayGuideScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="SelectedSongScreen"
        component={SelectedSongScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="ChapterScreen"
        component={ChapterScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="SermonScreen"
        component={SermonScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="SundayGuideHistoryScreen"
        component={SundayGuideHistoryScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="NewGuideScreen"
        component={NewGuideScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="MainGuideScreen"
        component={MainGuideScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="TypeScreen"
        component={TypeScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="ItemCreationScreen"
        component={ItemCreationScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="SelectHymnScreen"
        component={SelectHymnScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="SermonTextScreen"
        component={SermonTextScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
    </Stack.Navigator>
  );
}
