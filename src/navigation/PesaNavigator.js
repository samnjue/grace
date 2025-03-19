import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { TransitionSpecs } from "@react-navigation/stack";
import { CardStyleInterpolators } from "@react-navigation/stack";
import GracePesaScreen from "../screens/main/GracePesaScreen";
import NumberScreen from "../screens/main/NumberScreen";
import PayOptionsScreen from "../screens/main/PayOptionsScreen";
import PayCompletionScreen from "../screens/main/PayCompletionScreen";
import PayDetailsScreen from "../screens/main/PayDetailsScreen.js";
import PayStatsScreen from "../screens/main/PayStatsScreen";

const Stack = createStackNavigator();

export default function PesaNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GracePesa" component={GracePesaScreen} />
      <Stack.Screen
        name="NumberScreen"
        component={NumberScreen}
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
        name="PayOptionsScreen"
        component={PayOptionsScreen}
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
        name="PayCompletionScreen"
        component={PayCompletionScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="PayDetailsScreen"
        component={PayDetailsScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
        }}
      />
      <Stack.Screen
        name="PayStatsScreen"
        component={PayStatsScreen}
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
