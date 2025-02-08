import { useEffect, useRef, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState('');
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                setExpoPushToken(token);
                savePushTokenToSupabase(token);
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification Received:', notification);
            Notifications.presentNotificationAsync({
                title: notification.request.content.title,
                body: notification.request.content.body,
            });
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('User interacted with notification:', response);
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    return expoPushToken;
}

async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        Alert.alert('Must use a physical device for push notifications');
        return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        Alert.alert('Enable notifications in settings');
        return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
}

async function savePushTokenToSupabase(token) {
    try {
        const session = await AsyncStorage.getItem('userSession');
        if (!session) return;

        const { user } = JSON.parse(session);
        if (!user?.id) return;

        const { error } = await supabase
            .from('users')
            .update({ push_token: token })
            .eq('id', user.id);

        if (error) {
            //console.error('Error saving push token:', error.message);
        } else {
            //console.log('Push token saved to Supabase successfully');
        }
    } catch (err) {
        //console.error('Error retrieving user session:', err);
    }
}

export async function getTokensForDistrict(district_id) {
    const { data, error } = await supabase
        .from('users')
        .select('push_token')
        .eq('selected_district', district_id)
        .not('push_token', 'is', null);

    if (error) {
        console.error('Error fetching push tokens:', error.message);
        return [];
    }

    return data.map(user => user.push_token);
}

export async function sendPushNotification(expoPushTokens, message) {
    if (expoPushTokens.length === 0) {
        console.log('No valid push tokens available.');
        return;
    }

    const messages = expoPushTokens.map(token => ({
        to: token,
        sound: 'default',
        title: 'District News',
        body: message,
        data: { message },
    }));

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const data = await response.json();
        console.log('Push Notification Response:', data);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

