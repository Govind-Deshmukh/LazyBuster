import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import * as storage from "../utils/storage";
import { useTaskContext } from "./TaskContext";
import { Audio } from "expo-av";

// Create the context
export const TimerContext = createContext();

// Custom hook for using the timer context
export const useTimerContext = () => useContext(TimerContext);

// Timer presets (in minutes)
export const TIMER_PRESETS = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
};

export const TimerProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timerType, setTimerType] = useState("pomodoro");
  const [timeRemaining, setTimeRemaining] = useState(
    TIMER_PRESETS.pomodoro * 60
  );
  const [timerSettings, setTimerSettings] = useState(TIMER_PRESETS);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [todayFocusTime, setTodayFocusTime] = useState(0);
  const [focusHistory, setFocusHistory] = useState([]);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const soundRef = useRef(null);

  const { updateTaskTime } = useTaskContext
    ? useTaskContext()
    : { updateTaskTime: null };

  // Preload sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        // We'll preload the notification sound
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/notification.mp3")
        );
        soundRef.current = sound;
      } catch (error) {
        console.warn("Failed to load sounds:", error);
      }
    };

    loadSounds();

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Load settings and stats on mount
  useEffect(() => {
    const loadTimerData = async () => {
      try {
        // Load timer settings
        const savedSettings = await storage.getTimerSettings();
        if (savedSettings) {
          setTimerSettings(savedSettings);
          if (timerType === "pomodoro") {
            setTimeRemaining(savedSettings.pomodoro * 60);
          }
        } else {
          // Use default timer settings if none are saved
          setTimerSettings(TIMER_PRESETS);
        }

        // Load completed sessions
        const sessions = await storage.getCompletedSessions();
        if (sessions !== null) {
          setCompletedSessions(sessions);
        }

        // Load focus time stats
        const totalTime = await storage.getTotalFocusTime();
        if (totalTime !== null) {
          setTotalFocusTime(totalTime);
        }

        const todayTime = await storage.getTodayFocusTime();
        if (todayTime !== null) {
          // Check if the saved date is today
          const savedDate = await storage.getTodayFocusTimeDate();
          const today = new Date().toDateString();

          if (savedDate === today) {
            setTodayFocusTime(todayTime);
          } else {
            // Reset today's focus time if it's a new day
            setTodayFocusTime(0);
            storage.saveTodayFocusTime(0);
            storage.saveTodayFocusTimeDate(today);
          }
        }

        // Load focus history (create a default if not found)
        const history = await storage.getItem("focusHistory");
        if (history) {
          setFocusHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error("Failed to load timer data:", error);
        // Use defaults if there's an error
        setTimerSettings(TIMER_PRESETS);
      }
    };

    loadTimerData();
  }, []);

  // Update timer state
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer completed
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Play notification sound
  const playNotificationSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  // Handle timer completion - using useCallback to prevent rerenders
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Play sound to notify completion
    playNotificationSound();

    if (timerType === "pomodoro") {
      // Update completed sessions
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      await storage.saveCompletedSessions(newCompletedSessions);

      // Update focus time
      const sessionMinutes = timerSettings.pomodoro;
      const newTotalFocusTime = totalFocusTime + sessionMinutes;
      const newTodayFocusTime = todayFocusTime + sessionMinutes;

      setTotalFocusTime(newTotalFocusTime);
      setTodayFocusTime(newTodayFocusTime);

      await storage.saveTotalFocusTime(newTotalFocusTime);
      await storage.saveTodayFocusTime(newTodayFocusTime);
      await storage.saveTodayFocusTimeDate(new Date().toDateString());

      // Update focus history
      const today = new Date();
      const newHistoryEntry = {
        date: today.toISOString(),
        duration: sessionMinutes,
        taskId: currentTaskId,
      };

      const updatedHistory = [...focusHistory, newHistoryEntry];
      setFocusHistory(updatedHistory);
      await storage.setItem("focusHistory", JSON.stringify(updatedHistory));

      // Update task time if a task is selected
      if (currentTaskId && updateTaskTime) {
        updateTaskTime(currentTaskId, sessionMinutes);
      }

      // Determine next timer type (short break or long break)
      if (newCompletedSessions % 4 === 0) {
        setTimerType("longBreak");
        setTimeRemaining(timerSettings.longBreak * 60);
      } else {
        setTimerType("shortBreak");
        setTimeRemaining(timerSettings.shortBreak * 60);
      }
    } else {
      // Break timer completed, switch back to pomodoro
      setTimerType("pomodoro");
      setTimeRemaining(timerSettings.pomodoro * 60);
    }
  }, [
    timerType,
    timerSettings,
    completedSessions,
    totalFocusTime,
    todayFocusTime,
    currentTaskId,
    updateTaskTime,
    focusHistory,
  ]);

  // Start the timer
  const startTimer = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);

      // If it was a pomodoro session, calculate partial time for stats
      if (timerType === "pomodoro" && startTimeRef.current) {
        const elapsedSeconds = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);

        if (elapsedMinutes > 0) {
          // Update focus time stats for the partial session
          const newTotalFocusTime = totalFocusTime + elapsedMinutes;
          const newTodayFocusTime = todayFocusTime + elapsedMinutes;

          setTotalFocusTime(newTotalFocusTime);
          setTodayFocusTime(newTodayFocusTime);

          storage.saveTotalFocusTime(newTotalFocusTime);
          storage.saveTodayFocusTime(newTodayFocusTime);

          // Update task time if a task is selected
          if (currentTaskId && updateTaskTime) {
            updateTaskTime(currentTaskId, elapsedMinutes);
          }
        }
      }
    }
  }, [
    isRunning,
    timerType,
    totalFocusTime,
    todayFocusTime,
    currentTaskId,
    updateTaskTime,
  ]);

  // Reset the timer
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset to the current timer type duration
    setTimeRemaining(timerSettings[timerType] * 60);
  }, [timerSettings, timerType]);

  // Skip to the next timer
  const skipTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timerType === "pomodoro") {
      // Skip to break
      if (completedSessions % 4 === 3) {
        setTimerType("longBreak");
        setTimeRemaining(timerSettings.longBreak * 60);
      } else {
        setTimerType("shortBreak");
        setTimeRemaining(timerSettings.shortBreak * 60);
      }
    } else {
      // Skip to pomodoro
      setTimerType("pomodoro");
      setTimeRemaining(timerSettings.pomodoro * 60);
    }
  }, [timerType, completedSessions, timerSettings]);

  // Switch timer type manually
  const switchTimerType = useCallback(
    (type) => {
      if (isRunning) {
        pauseTimer();
      }

      setTimerType(type);
      setTimeRemaining(timerSettings[type] * 60);
    },
    [isRunning, pauseTimer, timerSettings]
  );

  // Update timer settings
  const updateTimerSettings = useCallback(
    (newSettings) => {
      setTimerSettings(newSettings);
      storage.saveTimerSettings(newSettings);

      // Update current timer if not running
      if (!isRunning) {
        setTimeRemaining(newSettings[timerType] * 60);
      }
    },
    [isRunning, timerType]
  );

  // Set the current task for the timer
  const setCurrentTask = useCallback((taskId) => {
    setCurrentTaskId(taskId);
  }, []);

  // Format time for display (mm:ss)
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Get focus time statistics
  const getFocusStats = useCallback(() => {
    return {
      totalTime: totalFocusTime,
      todayTime: todayFocusTime,
      completedSessions,
      averagePerDay: calculateAverageFocusTimePerDay(),
    };
  }, [totalFocusTime, todayFocusTime, completedSessions]);

  // Calculate average focus time per day (over the last 7 days)
  const calculateAverageFocusTimePerDay = useCallback(() => {
    if (focusHistory.length === 0) return 0;

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Filter sessions from last 7 days
    const recentSessions = focusHistory.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= sevenDaysAgo && sessionDate <= today;
    });

    if (recentSessions.length === 0) return todayFocusTime;

    // Calculate total minutes
    const totalMinutes = recentSessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );

    // Find unique days
    const uniqueDays = new Set(
      recentSessions.map((session) => new Date(session.date).toDateString())
    );

    return Math.round(totalMinutes / Math.max(uniqueDays.size, 1));
  }, [focusHistory, todayFocusTime]);

  const value = {
    isRunning,
    timerType,
    timeRemaining,
    timerSettings,
    completedSessions,
    currentTaskId,
    focusHistory,
    formatTime,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    switchTimerType,
    updateTimerSettings,
    setCurrentTask,
    getFocusStats,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};
