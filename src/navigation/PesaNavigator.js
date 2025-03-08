import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { TransitionSpecs } from "@react-navigation/stack";
import { CardStyleInterpolators } from "@react-navigation/stack";
import GracePesaScreen from "../screens/main/GracePesaScreen";

const Stack = createStackNavigator();

export default function PesaNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GracePesa" component={GracePesaScreen} />
      {/* <Stack.Screen name="SelectedSongScreen" component={SelectedSongScreen} options={{
                cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                transitionSpec: {
                    open: TransitionSpecs.TransitionIOSSpec,
                    close: TransitionSpecs.TransitionIOSSpec,
                },
            }} /> */}
    </Stack.Navigator>
  );
}
