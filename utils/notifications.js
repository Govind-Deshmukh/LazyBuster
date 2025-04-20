import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native";

// Flag to track if we're in Expo Go (to handle limitations)
let isExpoGo = false;

// Configure notifications behavior
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.warn("Error setting up notification handler:", error);
  isExpoGo = true;
}

// Request notification permissions
export const registerForPushNotificationsAsync = async () => {
  if (isExpoGo) {
    console.warn("Push notifications have limited functionality in Expo Go");
    return null;
  }

  try {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      // Only attempt to get push token if permissions are granted
      if (finalStatus === "granted") {
        try {
          token = (
            await Notifications.getExpoPushTokenAsync({
              projectId: Constants.expoConfig?.extra?.eas?.projectId,
            })
          ).data;
        } catch (error) {
          console.warn("Error getting push token:", error);
        }
      }
    } else {
      console.log("Must use physical device for push notifications");
    }

    return token;
  } catch (error) {
    console.warn("Error in registerForPushNotificationsAsync:", error);
    return null;
  }
};

// Schedule a task reminder notification with fallback for Expo Go
export const scheduleTaskReminder = async (task) => {
  if (!task.dueDate) return null;

  const dueDate = new Date(task.dueDate);
  const now = new Date();

  // Don't schedule if the due date is in the past
  if (dueDate <= now) return null;

  // Schedule reminder 30 minutes before due time
  const triggerDate = new Date(dueDate);
  triggerDate.setMinutes(triggerDate.getMinutes() - 30);

  // If that would be in the past, don't schedule
  if (triggerDate <= now) return null;

  try {
    if (isExpoGo) {
      // Just return a dummy ID in Expo Go
      return "expo-go-limited-" + Date.now().toString();
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `Your task "${task.title}" is due soon!`,
        data: { taskId: task.id },
      },
      trigger: triggerDate,
    });

    return identifier;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

// Cancel a scheduled notification
export const cancelNotification = async (identifier) => {
  if (!identifier) return;

  if (isExpoGo) {
    // No-op in Expo Go
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
};

// Schedule a daily reality check notification
export const scheduleDailyRealityCheck = async (hour = 9, minute = 0) => {
  if (isExpoGo) {
    console.log(
      "Reality check notifications have limited functionality in Expo Go"
    );
    return "expo-go-limited-" + Date.now().toString();
  }

  try {
    // Cancel any existing reality check notifications first
    await cancelRealityCheckNotifications();

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Reality Check",
        body: "Time to review your goals and tasks for today!",
        data: { type: "realityCheck" },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return identifier;
  } catch (error) {
    console.error("Error scheduling reality check:", error);
    return null;
  }
};

// Cancel all reality check notifications
export const cancelRealityCheckNotifications = async () => {
  if (isExpoGo) {
    // No-op in Expo Go
    return;
  }

  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === "realityCheck") {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error("Error canceling reality check notifications:", error);
  }
};

// Schedule hourly reality check notifications (for intense focus periods)
export const scheduleHourlyRealityChecks = async (
  startHour = 9,
  endHour = 17
) => {
  if (isExpoGo) {
    console.log(
      "Reality check notifications have limited functionality in Expo Go"
    );
    return ["expo-go-limited-" + Date.now().toString()];
  }

  try {
    // Cancel any existing reality check notifications first
    await cancelRealityCheckNotifications();

    const identifiers = [];

    for (let hour = startHour; hour <= endHour; hour++) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Reality Check",
          body: "Are you staying focused on your priorities?",
          data: { type: "realityCheck" },
        },
        trigger: {
          hour,
          minute: 0,
          repeats: true,
        },
      });

      identifiers.push(identifier);
    }

    return identifiers;
  } catch (error) {
    console.error("Error scheduling hourly reality checks:", error);
    return [];
  }
};

// Schedule a streak maintenance reminder
export const scheduleStreakReminder = async (hour = 20, minute = 0) => {
  if (isExpoGo) {
    console.log("Streak reminders have limited functionality in Expo Go");
    return "expo-go-limited-" + Date.now().toString();
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Maintain Your Streak!",
        body: "You haven't completed any tasks today. Keep your streak going!",
        data: { type: "streakReminder" },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return identifier;
  } catch (error) {
    console.error("Error scheduling streak reminder:", error);
    return null;
  }
};

// Show a motivational notification immediately
export const showMotivationalNotification = async (
  message = "You can do this! Stay focused on your goals!"
) => {
  try {
    if (isExpoGo) {
      // Use Alert as a fallback in Expo Go
      Alert.alert("Motivation Boost", message);
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Motivation Boost",
        body: message,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("Error showing motivational notification:", error);
    // Fallback to Alert
    Alert.alert("Motivation Boost", message);
  }
};

// Show a timer completed notification
export const showTimerCompletedNotification = async (timerType) => {
  let title, body;

  if (timerType === "pomodoro") {
    title = "Focus Session Complete!";
    body = "Great job! Take a break now.";
  } else if (timerType === "shortBreak") {
    title = "Break Time Over";
    body = "Ready to focus again?";
  } else if (timerType === "longBreak") {
    title = "Long Break Complete";
    body = "Time to get back to work!";
  }

  try {
    if (isExpoGo) {
      // Use Alert as a fallback in Expo Go
      Alert.alert(title, body);
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("Error showing timer notification:", error);
    // Fallback to Alert
    Alert.alert(title, body);
  }
};

// Schedule based on app settings
export const configureNotificationsBasedOnSettings = async (settings) => {
  if (isExpoGo) {
    console.log(
      "Notification configuration has limited functionality in Expo Go"
    );
    return;
  }

  if (!settings.notificationsEnabled) {
    // Cancel all notifications if disabled
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error canceling all notifications:", error);
    }
    return;
  }

  // Schedule reality checks based on frequency setting
  if (settings.realityCheckFrequency === "daily") {
    await scheduleDailyRealityCheck();
  } else if (settings.realityCheckFrequency === "hourly") {
    await scheduleHourlyRealityChecks();
  } else {
    // If 'off', cancel any existing reality check notifications
    await cancelRealityCheckNotifications();
  }

  // Schedule streak reminder if enabled
  if (settings.streakReminderEnabled) {
    await scheduleStreakReminder();
  }
};
