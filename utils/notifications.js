import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native";
import * as Permissions from "expo-permissions";
import { Audio } from "expo-av";

// Track if notifications are available (not in Expo Go or simulator)
let notificationsAvailable = true;
let permissionsGranted = false;

// Try to set up notification handling
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
  notificationsAvailable = false;
}

// Initialize notification permissions
const initializeNotifications = async () => {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    permissionsGranted = finalStatus === "granted";
    return permissionsGranted;
  } catch (error) {
    console.warn("Error initializing notifications:", error);
    return false;
  }
};

// Call initialization
initializeNotifications();

// Request notification permissions
export const registerForPushNotificationsAsync = async () => {
  if (!notificationsAvailable) {
    console.log("Notifications have limited functionality in this environment");
    return null;
  }

  try {
    let token = null;

    if (Device.isDevice) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          console.log("Notification permissions denied");
          return null;
        }
        permissionsGranted = true;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (projectId) {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          token = tokenData.data;
        } else {
          console.log("No project ID found for push notifications");
        }
      } catch (error) {
        console.warn("Error getting push token:", error);
      }
    } else {
      console.log("Push notifications require a physical device");
    }

    return token;
  } catch (error) {
    console.warn("Error registering for push notifications:", error);
    return null;
  }
};

// Schedule a task reminder notification with fallback
export const scheduleTaskReminder = async (task) => {
  try {
    if (!task || !task.dueDate) return null;

    // Don't schedule if notifications aren't available
    if (!notificationsAvailable || !permissionsGranted) {
      console.log("Notifications not available, skipping reminder");
      return null;
    }

    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // Don't schedule if the due date is in the past
    if (dueDate <= now) return null;

    // Schedule reminder 30 minutes before due time
    const triggerDate = new Date(dueDate);
    triggerDate.setMinutes(triggerDate.getMinutes() - 30);

    // If reminder time would be in the past, don't schedule
    if (triggerDate <= now) return null;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `Your task "${task.title}" is due soon!`,
        data: { taskId: task.id },
        sound: true,
      },
      trigger: triggerDate,
    });

    return identifier;
  } catch (error) {
    console.error("Error scheduling task reminder:", error);
    // Fallback to alert if available in this context
    try {
      if (task && task.title) {
        Alert.alert("Task Reminder", `Your task "${task.title}" is due soon!`);
      }
    } catch (alertError) {
      // Silent failure for non-UI contexts
    }
    return null;
  }
};

// Cancel a scheduled notification
export const cancelNotification = async (identifier) => {
  if (!identifier) return;

  if (!notificationsAvailable) {
    console.log("Notifications not available, can't cancel");
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
  if (!notificationsAvailable || !permissionsGranted) {
    console.log("Reality check notifications have limited functionality");
    return null;
  }

  try {
    // Cancel any existing reality check notifications first
    await cancelRealityCheckNotifications();

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Reality Check",
        body: "Time to review your goals and tasks for today!",
        data: { type: "realityCheck" },
        sound: true,
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
  if (!notificationsAvailable) {
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

// Schedule hourly reality checks for focused work periods
export const scheduleHourlyRealityChecks = async (
  startHour = 9,
  endHour = 17
) => {
  if (!notificationsAvailable || !permissionsGranted) {
    console.log("Reality check notifications have limited functionality");
    return [];
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
          sound: true,
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
