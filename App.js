import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import store from './src/redux/store';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Inter_200ExtraLight, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { PlayfairDisplay_400Regular, PlayfairDisplay_400Regular_Italic, PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display';
import { SourceSerif4_400Regular, SourceSerif4_400Regular_Italic, SourceSerif4_700Bold_Italic, SourceSerif4_900Black_Italic, SourceSerif4_700Bold } from '@expo-google-fonts/source-serif-4';
import { Archivo_700Bold, Archivo_800ExtraBold, Archivo_900Black } from '@expo-google-fonts/archivo';
import { Montserrat_700Bold, Montserrat_800ExtraBold, Montserrat_900Black } from '@expo-google-fonts/montserrat';
import { StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay': require('./assets/PlayfairDisplay-VariableFont_wght.ttf'),
    'Inter': require('./assets/Inter-VariableFont_opsz,wght.ttf'),
    'SourceSerif': require('./assets/SourceSerif4-VariableFont_opsz,wght.ttf'),
    'Serif7Italic': require('./node_modules/@expo-google-fonts/source-serif-4/SourceSerif4_700Bold_Italic.ttf'),
    Inter_200ExtraLight,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    SourceSerif4_400Regular,
    SourceSerif4_400Regular_Italic,
    SourceSerif4_700Bold_Italic,
    SourceSerif4_700Bold,
    SourceSerif4_900Black_Italic,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black
  });

  useEffect(() => {
    const prepare = async () => {
      await SplashScreen.preventAutoHideAsync();
    };

    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const linking = {
    prefixes: ['grace.ivory://'],
    config: {
      screens: {
        LogInScreeen: 'auth/callback',
      },
    },
  };

  NavigationBar.setBackgroundColorAsync("white");
  NavigationBar.setButtonStyleAsync("dark");

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Provider store={store}>
        <SafeAreaProvider>
          <AppNavigator linking={linking} />
        </SafeAreaProvider>
      </Provider>
    </>
  );
}
