import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, StatusBar } from "react-native";
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

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("AuthStack");
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  /*useEffect(() => {
        const logDebugInfo = async () => {
            const session = await AsyncStorage.getItem('userSession');
            console.log('AsyncStorage session:', session);
            console.log('Redux user state:', user);
        };
        logDebugInfo();
    }, [user]);*/

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
      console.error("Error checking for updates:", error);
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

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        console.error("Session refresh error:", error);
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
        console.log("Session refreshed successfully");
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
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
          console.log("No session found, redirecting to login.");
          return;
        }

        const session = JSON.parse(savedSession);
        const currentTime = Math.floor(Date.now() / 1000);

        if (session.expires_at < currentTime) {
          console.log("Session expired, attempting to refresh...");
          await refreshSession();
        } else {
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
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
                fallbackToCachedProfile();
              }
            } catch (error) {
              console.error("Error fetching profile:", error);
              fallbackToCachedProfile();
            }
          } else {
            fallbackToCachedProfile();
          }
        } else {
          setInitialRoute("AuthStack");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
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
        console.error("Error loading cached profile:", error);
        setInitialRoute("ChurchSelection");
      } finally {
        setIsLoading(false);
      }
    };

    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn(
          "Safety timeout triggered - forcing navigation to AuthStack"
        );
        setInitialRoute("AuthStack");
        setIsLoading(false);
      }
    }, 10000);

    checkUserSession();

    return () => clearTimeout(safetyTimeout);
  }, [dispatch, isLoading]);

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
        console.error("Error syncing state:", error);
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
        console.error("Error loading theme:", error);
      }
    };
    loadTheme();
  }, [dispatch]);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("appTheme", theme);
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    };
    saveTheme();
  }, [theme]);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(isDarkTheme ? "#121212" : "#fff");
    NavigationBar.setButtonStyleAsync(isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

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
        <StatusBar
          barStyle={isDarkTheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkTheme ? "#121212" : "#fff"}
        />
        <ActivityIndicator size="large" color="#6a5acd" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={appTheme}>
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#121212" : "#fff"}
      />
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
