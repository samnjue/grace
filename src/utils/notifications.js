import { useEffect, useRef, useState } from "react";
import { Platform, Alert } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();
  const channelListener = useRef();

  useEffect(() => {
    // Register push token
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        //console.log("Registering push token:", token);
        setExpoPushToken(token);
        savePushTokenToSupabase(token);
      } else {
        //console.log("No push token received");
      }
    });

    // Handle foreground notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // console.log(
        //   "Notification Received:",
        //   JSON.stringify(notification, null, 2)
        // );
      });

    // Handle notification interactions
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // console.log(
        //   "User interacted with notification:",
        //   JSON.stringify(response, null, 2)
        // );
      });

    // Subscribe to VOTD inserts
    const channel = supabase
      .channel("votd-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "VOTD",
        },
        async (payload) => {
          //console.log("New VOTD inserted:", JSON.stringify(payload, null, 2));
          const newVotd = payload.new;

          // Validate required fields
          if (!newVotd.reference || !newVotd.verse_text) {
            //console.error("Missing required fields in VOTD:", newVotd);
            return;
          }

          try {
            // Fetch all push tokens
            const pushTokens = await getAllPushTokens();
            //console.log("Fetched push tokens:", pushTokens);

            if (pushTokens.length === 0) {
              //console.log("No push tokens available");
              return;
            }

            // Send notification
            const message = `${newVotd.reference}: ${newVotd.verse_text}`;
            //console.log("Sending notification with message:", message);
            await sendPushNotification(pushTokens, message);
          } catch (error) {
            //console.error("Error processing VOTD notification:", error);
          }
        }
      )
      .subscribe((status) => {
        //console.log("Supabase channel subscription status:", status);
      });

    channelListener.current = channel;

    // Cleanup
    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
      if (channelListener.current) {
        supabase.removeChannel(channelListener.current);
      }
    };
  }, []);

  return expoPushToken;
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    //console.log("Not a physical device, push notifications not supported");
    Alert.alert("Must use a physical device for push notifications");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //console.log("Notification permissions status:", existingStatus);
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    //console.log("Requested permissions, new status:", finalStatus);
  }

  if (finalStatus !== "granted") {
    //console.log("Notification permissions not granted");
    Alert.alert("Enable notifications in settings");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  //console.log("Expo push token:", token);
  return token;
}

async function savePushTokenToSupabase(token) {
  try {
    const session = await AsyncStorage.getItem("userSession");
    //console.log("Retrieved session from AsyncStorage:", session);
    if (!session) {
      console.log("No session found in AsyncStorage");
      return;
    }

    const { user } = JSON.parse(session);
    if (!user?.id) {
      //console.log("No user ID found in session");
      return;
    }
    //console.log("User ID:", user.id);

    const { error } = await supabase
      .from("users")
      .update({ push_token: token })
      .eq("id", user.id);

    if (error) {
      //console.error("Error saving push token:", error.message);
    } else {
      //console.log("Push token saved to Supabase successfully");
    }
  } catch (err) {
    //console.error("Error retrieving user session:", err);
  }
}

async function getAllPushTokens() {
  //console.log("Fetching all push tokens");
  const { data, error } = await supabase
    .from("users")
    .select("id, push_token")
    .not("push_token", "is", null);

  if (error) {
    //console.error("Error fetching push tokens:", error.message);
    return [];
  }

  //console.log("Fetched push tokens:", JSON.stringify(data, null, 2));
  return data.map((user) => ({ id: user.id, push_token: user.push_token }));
}

async function sendPushNotification(tokenData, message) {
  if (tokenData.length === 0) {
    //console.log("No valid push tokens available.");
    return;
  }

  // Batch tokens into groups of 100
  const BATCH_SIZE = 100;
  const invalidTokens = [];

  for (let i = 0; i < tokenData.length; i += BATCH_SIZE) {
    const batch = tokenData.slice(i, i + BATCH_SIZE);
    // console.log(
    //   `Preparing to send batch ${i / BATCH_SIZE + 1} with ${batch.length} tokens`
    // );

    const messages = batch.map(({ push_token }) => ({
      to: push_token,
      sound: "default",
      title: "Verse of the Day",
      body: message,
      data: { message },
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      //   console.log(
      //     `Batch ${i / BATCH_SIZE + 1} response:`,
      //     JSON.stringify(result, null, 2)
      //   );

      // Check for invalid tokens
      if (result.data) {
        result.data.forEach((ticket, index) => {
          if (
            ticket.status === "error" &&
            ticket.message.includes("DeviceNotRegistered")
          ) {
            //console.log(`Invalid token detected: ${batch[index].push_token}`);
            invalidTokens.push(batch[index]);
          }
        });
      }
    } catch (error) {
      //console.error(`Error sending batch ${i / BATCH_SIZE + 1}:`, error);
    }
  }

  // Remove invalid tokens from Supabase
  if (invalidTokens.length > 0) {
    // console.log(
    //   "Removing invalid tokens:",
    //   invalidTokens.map((t) => t.push_token)
    // );
    try {
      const { error } = await supabase
        .from("users")
        .update({ push_token: null })
        .in(
          "id",
          invalidTokens.map((t) => t.id)
        );

      if (error) {
        //console.error("Error removing invalid tokens:", error.message);
      } else {
        //console.log("Invalid tokens removed successfully");
      }
    } catch (error) {
      //console.error("Error during invalid token cleanup:", error);
    }
  }
}
