import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { createStackNavigator } from "@react-navigation/stack";
import { logIn, selectChurch, selectDistrict } from "../redux/slices/userSlice";
import { setChurchAndDistrict } from "../redux/actions";
import AuthStack from "./AuthStack";
import MainTabNavigator from "./MainTabNavigator";
import ChurchSelectionScreen from "../screens/auth/ChurchSelectionScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTheme } from "../redux/slices/themeSlice";
import * as NavigationBar from "expo-navigation-bar";
import NetInfo from "@react-native-community/netinfo";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";
import { supabase } from "../utils/supabase";
import { usePushNotifications } from "../utils/notifications";
import * as ExpoInAppUpdates from "expo-in-app-updates";
import Ionicons from "react-native-vector-icons/Ionicons";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("AuthStack");
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Animation for pulsating WiFi icon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCheckingConnection) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1); // Reset animation when not checking
    }
  }, [isCheckingConnection]);

  const expoPushToken = usePushNotifications();

  const checkForUpdates = async () => {
    if (__DEV__ || Platform.OS === "web") return;

    try {
      if (Platform.OS === "android") {
        await ExpoInAppUpdates.checkAndStartUpdate(false);
      } else {
        const { updateAvailable } = await ExpoInAppUpdates.checkForUpdate();
        if (!updateAvailable) return;

        Alert.alert(
          "Update available",
          "A new version of the app is available with many improvements and bug fixes. Would you like to update now?",
          [
            {
              text: "Update",
              isPreferred: true,
              async onPress() {
                await ExpoInAppUpdates.startUpdate();
              },
            },
            { text: "Cancel" },
          ]
        );
      }
    } catch (error) {
      // console.error("Error checking for updates:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(
      () => {
        refreshSession();
        checkForUpdates();
      },
      1000 * 60 * 5
    );

    refreshSession();
    checkForUpdates();

    return () => clearInterval(interval);
  }, []);

  const refreshSession = async () => {
    try {
      const savedSession = await AsyncStorage.getItem("supabaseSession");
      if (!savedSession) return;

      const session = JSON.parse(savedSession);
      const { expires_at, refresh_token } = session;

      const currentTime = Math.floor(Date.now() / 1000);
      if (expires_at - currentTime > 300) {
        return;
      }

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        setIsCheckingConnection(true); // Show connectivity UI for session refresh
        return;
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        // console.error("Session refresh error:", error);
        setIsCheckingConnection(true); // Show connectivity UI on refresh failure
        return;
      }

      if (data?.session) {
        await AsyncStorage.setItem(
          "supabaseSession",
          JSON.stringify(data.session)
        );
        await AsyncStorage.setItem("userSession", JSON.stringify(data.session));

        dispatch(
          logIn({ email: data.session.user.email, session: data.session })
        );
        // console.log("Session refreshed successfully");
      }
    } catch (err) {
      // console.error("Error refreshing session:", err);
      setIsCheckingConnection(true); // Show connectivity UI on error
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshSession, 1000 * 60 * 5);
    refreshSession();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = await AsyncStorage.getItem("supabaseSession");
        if (!savedSession) {
          // console.log("No session found, redirecting to login.");
          return;
        }

        const session = JSON.parse(savedSession);
        const currentTime = Math.floor(Date.now() / 1000);

        if (session.expires_at < currentTime) {
          // console.log("Session expired, attempting to refresh...");
          await refreshSession();
        } else {
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        }
      } catch (error) {
        // console.error("Error restoring session:", error);
      }
    };

    restoreSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");

      if (session) {
        const parsedSession = JSON.parse(session);
        dispatch(logIn(parsedSession));

        const netInfo = await NetInfo.fetch();

        if (netInfo.isConnected) {
          try {
            const { data: profile, error } = await supabase
              .from("users")
              .select("selected_church, selected_district")
              .eq("id", parsedSession.user.id)
              .single();

            if (profile && !error) {
              dispatch(
                setChurchAndDistrict({
                  selected_church: profile.selected_church,
                  selected_district: profile.selected_district,
                })
              );

              dispatch(selectChurch(profile.selected_church));
              dispatch(selectDistrict(profile.selected_district));

              await AsyncStorage.setItem(
                "userProfile",
                JSON.stringify(profile)
              );

              setInitialRoute(
                profile.selected_church && profile.selected_district
                  ? "MainApp"
                  : "ChurchSelection"
              );
              setIsLoading(false);
            } else {
              await fallbackToCachedProfile();
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
            await fallbackToCachedProfile();
          }
        } else {
          await fallbackToCachedProfile(); // Use cached data when offline
        }
      } else {
        setInitialRoute("AuthStack");
        setIsLoading(false);
      }
    } catch (error) {
      // console.error("Error checking session:", error);
      setIsLoading(false);
    }
  };

  const fallbackToCachedProfile = async () => {
    try {
      const cachedProfile = await AsyncStorage.getItem("userProfile");
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);

        dispatch(
          setChurchAndDistrict({
            selected_church: profile.selected_church,
            selected_district: profile.selected_district,
          })
        );

        dispatch(selectChurch(profile.selected_church));
        dispatch(selectDistrict(profile.selected_district));

        setInitialRoute(
          profile.selected_church && profile.selected_district
            ? "MainApp"
            : "ChurchSelection"
        );
      } else {
        setInitialRoute("ChurchSelection");
      }
    } catch (error) {
      // console.error("Error loading cached profile:", error);
      setInitialRoute("ChurchSelection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectivityCheck = async () => {
    setIsCheckingConnection(true);
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await refreshSession(); // Retry session refresh
        setIsCheckingConnection(false);
        await checkUserSession(); // Re-check session after refresh
      } else {
        setIsCheckingConnection(false); // Keep showing retry screen
      }
    } catch (error) {
      // console.error("Error checking connectivity:", error);
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, [dispatch]);

  useEffect(() => {
    const syncReduxWithStorage = async () => {
      try {
        const session = await AsyncStorage.getItem("userSession");
        if (session) {
          const parsedSession = JSON.parse(session);
          dispatch(logIn(parsedSession));

          const profile = await AsyncStorage.getItem("userProfile");
          if (profile) {
            const parsedProfile = JSON.parse(profile);
            dispatch(
              setChurchAndDistrict({
                selected_church: parsedProfile.selected_church,
                selected_district: parsedProfile.selected_district,
              })
            );
          }
        }
      } catch (error) {
        // console.error("Error syncing state:", error);
      }
    };
    syncReduxWithStorage();
  }, [dispatch]);

  const theme = useSelector((state) => state.theme.theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("appTheme");
        if (storedTheme) {
          dispatch(setTheme(storedTheme));
        }
      } catch (error) {
        // console.error("Error loading theme:", error);
      }
    };
    loadTheme();
  }, [dispatch]);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("appTheme", theme);
      } catch (error) {
        // console.error("Error saving theme:", error);
      }
    };
    saveTheme();
  }, [theme]);

  const appTheme = isDarkTheme
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: "#121212" } }
    : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: "#fff" },
      };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDarkTheme ? "#121212" : "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#6a5acd" />
      </View>
    );
  }

  if (isCheckingConnection) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDarkTheme ? "#121212" : "#fff",
        }}
      >
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons
            name="wifi"
            size={50}
            color={isDarkTheme ? "#fff" : "#000"}
          />
        </Animated.View>
        <Text
          style={{
            marginTop: 20,
            fontSize: 18,
            color: isDarkTheme ? "#fff" : "#000",
            fontFamily: "Archivo_700Bold",
          }}
        >
          Checking connection...
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: "#6a5acd",
            borderRadius: 5,
          }}
          onPress={handleConnectivityCheck}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer theme={appTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="AuthStack" component={AuthStack} />
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        <Stack.Screen
          name="ChurchSelection"
          component={ChurchSelectionScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
