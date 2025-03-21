import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import BibleScreen from "../screens/main/BibleScreen";
import ChapterScreen from "../screens/main/ChapterScreen";
import HighlightScreen from "../screens/main/HighlightsScreen";
import { TransitionSpecs } from "@react-navigation/stack";
import { CardStyleInterpolators } from "@react-navigation/stack";

const Stack = createStackNavigator();

export default function BibleNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BibleScreen" component={BibleScreen} />
      <Stack.Screen
        name="ChapterScreen"
        component={ChapterScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forFadeFromBottomAndroid,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="HighlightScreen"
        component={HighlightScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
    </Stack.Navigator>
  );
}
