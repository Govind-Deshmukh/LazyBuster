import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const KEYS = {
  TASKS: "lazybuster_tasks",
  STREAK: "lazybuster_streak",
  LAST_COMPLETED_DATE: "lazybuster_last_completed",
  TIMER_SETTINGS: "lazybuster_timer_settings",
  COMPLETED_SESSIONS: "lazybuster_completed_sessions",
  TOTAL_FOCUS_TIME: "lazybuster_total_focus_time",
  TODAY_FOCUS_TIME: "lazybuster_today_focus_time",
  TODAY_FOCUS_TIME_DATE: "lazybuster_today_focus_time_date",
  JOURNAL_ENTRIES: "lazybuster_journal_entries",
  SETTINGS: "lazybuster_app_settings",
  REALITY_CHECK_DISMISSED: "lazybuster_reality_check_dismissed",
};

// Error handling wrapper
const handleAsyncStorageOperation = async (operation, defaultValue = null) => {
  try {
    return await operation();
  } catch (error) {
    console.error("AsyncStorage operation failed:", error);
    return defaultValue;
  }
};

// Task-related storage functions
export const saveTasks = async (tasks) => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = JSON.stringify(tasks);
    await AsyncStorage.setItem(KEYS.TASKS, jsonValue);
    return true;
  }, false);
};

export const getTasks = async () => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = await AsyncStorage.getItem(KEYS.TASKS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  }, []);
};

// Streak-related storage functions
export const saveStreak = async (streakData) => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = JSON.stringify(streakData);
    await AsyncStorage.setItem(KEYS.STREAK, jsonValue);
    return true;
  }, false);
};

export const getStreak = async () => {
  return handleAsyncStorageOperation(
    async () => {
      const jsonValue = await AsyncStorage.getItem(KEYS.STREAK);
      return jsonValue != null ? JSON.parse(jsonValue) : { count: 0 };
    },
    { count: 0 }
  );
};

export const saveLastCompletedDate = async (dateString) => {
  return handleAsyncStorageOperation(async () => {
    await AsyncStorage.setItem(KEYS.LAST_COMPLETED_DATE, dateString);
    return true;
  }, false);
};

export const getLastCompletedDate = async () => {
  return handleAsyncStorageOperation(async () => {
    return await AsyncStorage.getItem(KEYS.LAST_COMPLETED_DATE);
  }, null);
};

// Timer-related storage functions
export const saveTimerSettings = async (settings) => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(KEYS.TIMER_SETTINGS, jsonValue);
    return true;
  }, false);
};

export const getTimerSettings = async () => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = await AsyncStorage.getItem(KEYS.TIMER_SETTINGS);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  }, null);
};

export const saveCompletedSessions = async (count) => {
  return handleAsyncStorageOperation(async () => {
    await AsyncStorage.setItem(KEYS.COMPLETED_SESSIONS, count.toString());
    return true;
  }, false);
};

export const getCompletedSessions = async () => {
  return handleAsyncStorageOperation(async () => {
    const value = await AsyncStorage.getItem(KEYS.COMPLETED_SESSIONS);
    return value != null ? parseInt(value, 10) : 0;
  }, 0);
};

export const saveTotalFocusTime = async (minutes) => {
  return handleAsyncStorageOperation(async () => {
    await AsyncStorage.setItem(KEYS.TOTAL_FOCUS_TIME, minutes.toString());
    return true;
  }, false);
};

export const getTotalFocusTime = async () => {
  return handleAsyncStorageOperation(async () => {
    const value = await AsyncStorage.getItem(KEYS.TOTAL_FOCUS_TIME);
    return value != null ? parseInt(value, 10) : 0;
  }, 0);
};

export const saveTodayFocusTime = async (minutes) => {
  return handleAsyncStorageOperation(async () => {
    await AsyncStorage.setItem(KEYS.TODAY_FOCUS_TIME, minutes.toString());
    return true;
  }, false);
};

export const getTodayFocusTime = async () => {
  return handleAsyncStorageOperation(async () => {
    const value = await AsyncStorage.getItem(KEYS.TODAY_FOCUS_TIME);
    return value != null ? parseInt(value, 10) : 0;
  }, 0);
};

export const saveTodayFocusTimeDate = async (dateString) => {
  return handleAsyncStorageOperation(async () => {
    await AsyncStorage.setItem(KEYS.TODAY_FOCUS_TIME_DATE, dateString);
    return true;
  }, false);
};

export const getTodayFocusTimeDate = async () => {
  return handleAsyncStorageOperation(async () => {
    return await AsyncStorage.getItem(KEYS.TODAY_FOCUS_TIME_DATE);
  }, null);
};

// Journal-related storage functions
export const saveJournalEntries = async (entries) => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = JSON.stringify(entries);
    await AsyncStorage.setItem(KEYS.JOURNAL_ENTRIES, jsonValue);
    return true;
  }, false);
};

export const getJournalEntries = async () => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = await AsyncStorage.getItem(KEYS.JOURNAL_ENTRIES);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  }, []);
};

export const addJournalEntry = async (entry) => {
  return handleAsyncStorageOperation(async () => {
    const entries = await getJournalEntries();
    const updatedEntries = [...entries, entry];
    await saveJournalEntries(updatedEntries);
    return true;
  }, false);
};

// App settings storage
export const saveAppSettings = async (settings) => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(KEYS.SETTINGS, jsonValue);
    return true;
  }, false);
};

export const getAppSettings = async () => {
  return handleAsyncStorageOperation(async () => {
    const jsonValue = await AsyncStorage.getItem(KEYS.SETTINGS);
    return jsonValue != null ? JSON.parse(jsonValue) : getDefaultSettings();
  }, getDefaultSettings());
};

const getDefaultSettings = () => {
  return {
    darkMode: false,
    notificationsEnabled: true,
    realityCheckFrequency: "daily", // 'daily', 'hourly', 'off'
    autoStartBreaks: false,
    soundEnabled: true,
  };
};

// Reality check dismissal tracking
export const saveRealityCheckDismissed = async (date) => {
  return handleAsyncStorageOperation(async () => {
    await AsyncStorage.setItem(
      KEYS.REALITY_CHECK_DISMISSED,
      date.toISOString()
    );
    return true;
  }, false);
};

export const getRealityCheckDismissed = async () => {
  return handleAsyncStorageOperation(async () => {
    const value = await AsyncStorage.getItem(KEYS.REALITY_CHECK_DISMISSED);
    return value != null ? new Date(value) : null;
  }, null);
};

// Clear all app data (for reset functionality)
export const clearAllData = async () => {
  return handleAsyncStorageOperation(async () => {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
    return true;
  }, false);
};
