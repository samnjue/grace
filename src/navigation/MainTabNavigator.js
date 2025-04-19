import React, { useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import BibleNavigator from "./BibleNavigator";
import SongNavigator from "./SongNavigator";
import PesaNavigator from "./PesaNavigator";
import ProfileNavigator from "./ProfileNavigator";
import { Ionicons } from "@expo/vector-icons";
import Octicons from "react-native-vector-icons/Octicons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import HomeNavigator from "./HomeNavigator";
import { useSelector } from "react-redux";

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }) => {
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashScale = useRef(new Animated.Value(0)).current;

  const triggerFlash = () => {
    flashOpacity.setValue(0.3);
    flashScale.setValue(0);
    Animated.parallel([
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(flashScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    triggerFlash();
    onPress();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.customButtonContainer}>
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashOpacity,
              transform: [
                {
                  scale: flashScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  const getTabBarStyle = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? "Home";
    if (routeName === "Bible") {
      return { display: "flex" };
    }
    if (routeName === "ChapterScreen") {
      return { display: "none" };
    }
    if (routeName === "SelectedSongScreen") {
      return { display: "none" };
    }
    if (routeName === "ShareScreen") {
      return { display: "none" };
    }
    if (routeName === "ContactScreen") {
      return { display: "none" };
    }
    if (routeName === "EditScreen") {
      return { display: "none" };
    }
    if (routeName === "VerseHistoryScreen") {
      return { display: "none" };
    }
    if (routeName === "DistrictNewsScreen") {
      return { display: "none" };
    }
    if (routeName === "PostNewsScreen") {
      return { display: "none" };
    }
    if (routeName === "SundayGuideScreen") {
      return { display: "none" };
    }
    if (routeName === "SermonScreen") {
      return { display: "none" };
    }
    if (routeName === "SundayGuideHistoryScreen") {
      return { display: "none" };
    }
    if (routeName === "HighlightScreen") {
      return { display: "none" };
    }
    if (routeName === "NumberScreen") {
      return { display: "none" };
    }
    if (routeName === "PayOptionsScreen") {
      return { display: "none" };
    }
    if (routeName === "PayCompletionScreen") {
      return { display: "none" };
    }
    if (routeName === "PayDetailsScreen") {
      return { display: "none" };
    }
    if (routeName === "PayStatsScreen") {
      return { display: "none" };
    }
    if (routeName === "NewGuideScreen") {
      return { display: "none" };
    }
    if (routeName === "MainGuideScreen") {
      return { display: "none" };
    }
    if (routeName === "TypeScreen") {
      return { display: "none" };
    }
    if (routeName === "ItemCreationScreen") {
      return { display: "none" };
    }
    if (routeName === "SelectHymnScreen") {
      return { display: "none" };
    }
    if (routeName === "SermonTextScreen") {
      return { display: "none" };
    }
    if (routeName === "MainEditScreen") {
      return { display: "none" };
    }
    if (routeName === "ReceiptsScreen") {
      return { display: "none" };
    }
    if (routeName === "NewFundraiserScreen") {
      return { display: "none" };
    }
    return {
      position: "absolute",
      backgroundColor: isDarkTheme ? "#121212" : "#ffffff",
      borderTopWidth: 0.5,
      elevation: 0,
      height: 70 + insets.bottom,
      keyboardHidesTabBar: true,
      paddingBottom: insets.bottom,
    };
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        animation: "none",
        headerShown: false,
        tabBarStyle: getTabBarStyle(route),
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Archivo_700Bold",
        },
        tabBarIconStyle: { marginTop: -4 },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "Home") {
            return (
              <Octicons
                name={focused ? "home" : "home"}
                size={size}
                color={color}
              />
            );
          }
          let iconName;
          if (route.name === "Bible") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Songs") {
            iconName = focused ? "musical-notes" : "musical-notes-outline";
          } else if (route.name === "Giving") {
            iconName = focused ? "wallet" : "wallet-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person-circle" : "person-circle-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarItemStyle: {
          borderRadius: 8,
          overflow: "hidden",
          paddingTop: 11,
        },
        tabBarPressColor: "transparent",
        tabBarActiveTintColor: "#6a5acd",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Bible"
        component={BibleNavigator}
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Songs"
        component={SongNavigator}
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Giving"
        component={PesaNavigator}
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  customButtonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  flashOverlay: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6a5acd",
    opacity: 0.3,
  },
});
