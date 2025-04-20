import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import * as storage from "../utils/storage";
import { useTaskContext } from "./TaskContext";

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

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const { updateTaskTime } = useTaskContext();

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

  // Handle timer completion
  const handleTimerComplete = async () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    intervalRef.current = null;

    // Play sound or vibrate to notify completion

    if (timerType === "pomodoro") {
      // Update completed sessions
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      storage.saveCompletedSessions(newCompletedSessions);

      // Update focus time
      const sessionMinutes = timerSettings.pomodoro;
      const newTotalFocusTime = totalFocusTime + sessionMinutes;
      const newTodayFocusTime = todayFocusTime + sessionMinutes;

      setTotalFocusTime(newTotalFocusTime);
      setTodayFocusTime(newTodayFocusTime);

      storage.saveTotalFocusTime(newTotalFocusTime);
      storage.saveTodayFocusTime(newTodayFocusTime);
      storage.saveTodayFocusTimeDate(new Date().toDateString());

      // Update task time if a task is selected
      if (currentTaskId) {
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
  };

  // Start the timer
  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  // Pause the timer
  const pauseTimer = () => {
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
          if (currentTaskId) {
            updateTaskTime(currentTaskId, elapsedMinutes);
          }
        }
      }
    }
  };

  // Reset the timer
  const resetTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset to the current timer type duration
    setTimeRemaining(timerSettings[timerType] * 60);
  };

  // Skip to the next timer
  const skipTimer = () => {
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
  };

  // Switch timer type manually
  const switchTimerType = (type) => {
    if (isRunning) {
      pauseTimer();
    }

    setTimerType(type);
    setTimeRemaining(timerSettings[type] * 60);
  };

  // Update timer settings
  const updateTimerSettings = (newSettings) => {
    setTimerSettings(newSettings);
    storage.saveTimerSettings(newSettings);

    // Update current timer if not running
    if (!isRunning) {
      setTimeRemaining(newSettings[timerType] * 60);
    }
  };

  // Set the current task for the timer
  const setCurrentTask = (taskId) => {
    setCurrentTaskId(taskId);
  };

  // Format time for display (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Get focus time statistics
  const getFocusStats = () => {
    return {
      totalTime: totalFocusTime,
      todayTime: todayFocusTime,
      completedSessions,
      averagePerDay: calculateAverageFocusTimePerDay(),
    };
  };

  // Calculate average focus time per day (over the last 7 days)
  const calculateAverageFocusTimePerDay = () => {
    // For a proper implementation, we would need to store daily focus times
    // This is a simplified version based on today's focus time
    return todayFocusTime;
  };

  const value = {
    isRunning,
    timerType,
    timeRemaining,
    timerSettings,
    completedSessions,
    currentTaskId,
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
