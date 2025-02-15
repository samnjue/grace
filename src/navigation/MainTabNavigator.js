import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import BibleNavigator from './BibleNavigator';
import SongNavigator from './SongNavigator';
import ProfileNavigator from './ProfileNavigator';
import { Ionicons } from '@expo/vector-icons';
import Octicons from 'react-native-vector-icons/Octicons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import HomeNavigator from './HomeNavigator';
import { useSelector } from 'react-redux';

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }) => (
    <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.customButtonContainer}>{children}</View>
    </TouchableWithoutFeedback>
);

export default function MainTabNavigator() {
    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');

    const getTabBarStyle = (route) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home';
        if (routeName === 'Bible') {
            return { display: 'flex' };
        }
        if (routeName === 'ChapterScreen') {
            return { display: 'none' };
        }
        if (routeName === 'SelectedSongScreen') {
            return { display: 'none' };
        }
        if (routeName === 'ShareScreen') {
            return { display: 'none' };
        }
        if (routeName === 'ContactScreen') {
            return { display: 'none' };
        }
        if (routeName === 'EditScreen') {
            return { display: 'none' };
        }
        if (routeName === 'VerseHistoryScreen') {
            return { display: 'none' };
        }
        if (routeName === 'DistrictNewsScreen') {
            return { display: 'none' };
        }
        if (routeName === 'PostNewsScreen') {
            return { display: 'none' };
        }
        if (routeName === 'SundayGuideScreen') {
            return { display: 'none' };
        }
        if (routeName === 'SermonScreen') {
            return { display: 'none' };
        }
        if (routeName === 'SundayGuideHistoryScreen') {
            return { display: 'none' };
        }
        return {
            position: 'absolute',
            backgroundColor: isDarkTheme ? '#121212' : '#ffffff',
            borderTopWidth: 0.5,
            elevation: 0,
            height: 60,
            keyboardHidesTabBar: true,
        };
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                animation: 'none',
                headerShown: false,
                tabBarStyle: getTabBarStyle(route),
                tabBarHideOnKeyboard: true,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: 'Archivo_700Bold'
                },
                tabBarIconStyle: { marginTop: -4 },
                tabBarIcon: ({ focused, color, size }) => {
                    if (route.name === 'Home') {
                        return <Octicons
                            name={focused ? 'home' : 'home'}
                            size={size}
                            color={color}
                        />;
                    }
                    let iconName;
                    if (route.name === 'Bible') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'Songs') {
                        iconName = focused ? 'musical-notes' : 'musical-notes-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person-circle' : 'person-circle-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarItemStyle: {
                    borderRadius: 8,
                    overflow: 'hidden',
                    paddingTop: 11
                },
                tabBarPressColor: 'transparent',
                tabBarActiveTintColor: '#6a5acd',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Home" component={HomeNavigator} options={{
                tabBarButton: (props) => <CustomTabBarButton {...props} />,
            }} />
            <Tab.Screen name="Bible" component={BibleNavigator} options={{
                tabBarButton: (props) => <CustomTabBarButton {...props} />,
            }} />
            <Tab.Screen name="Songs" component={SongNavigator} options={{
                tabBarButton: (props) => <CustomTabBarButton {...props} />,
            }} />
            <Tab.Screen name="Profile" component={ProfileNavigator} options={{
                tabBarButton: (props) => <CustomTabBarButton {...props} />,
            }} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    customButtonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});