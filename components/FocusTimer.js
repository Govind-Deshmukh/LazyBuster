import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTimerContext } from "../context/TimerContext";
import { useTaskContext } from "../context/TaskContext";
import Colors from "@/constants/color";

const { width } = Dimensions.get("window");
const circleSize = width * 0.7;

const FocusTimer = () => {
  // Access timer context with safe fallbacks
  const timerContext = useTimerContext() || {};
  const {
    isRunning = false,
    timerType = "pomodoro",
    timeRemaining = 1500, // 25 minutes default
    timerSettings = { pomodoro: 25, shortBreak: 5, longBreak: 15 },
    formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    },
    startTimer = () => {},
    pauseTimer = () => {},
    resetTimer = () => {},
    skipTimer = () => {},
    switchTimerType = () => {},
    currentTaskId = null,
  } = timerContext;

  // Access task context with safe fallbacks
  const taskContext = useTaskContext() || {};
  const { tasks = [] } = taskContext;

  const [progressAnimation] = useState(new Animated.Value(1));
  const [sound, setSound] = useState();
  const appState = useRef(AppState.currentState);

  // Get current task if one is selected
  const currentTask = tasks.find((task) => task.id === currentTaskId);

  // Load and prepare sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/notification.mp3")
        );
        setSound(sound);
      } catch (error) {
        console.warn("Could not load sound", error);
      }
    };

    loadSounds();

    // Cleanup sound on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Play completed sound
  const playCompletionSound = useCallback(async () => {
    try {
      if (sound) {
        await sound.setPositionAsync(0); // Reset to beginning
        await sound.playAsync();

        // Also vibrate the device
        Vibration.vibrate(500);
      }
    } catch (error) {
      console.warn("Could not play sound", error);
    }
  }, [sound]);

  // Handle app coming from background
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current === "background" && nextAppState === "active") {
        // App has come to the foreground
        if (isRunning) {
          // We need to synchronize our timer
          pauseTimer();
          startTimer();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [isRunning, pauseTimer, startTimer]);

  // Get timer color based on type
  const getTimerColor = () => {
    switch (timerType) {
      case "pomodoro":
        return Colors.timerPomodoro;
      case "shortBreak":
        return Colors.timerShortBreak;
      case "longBreak":
        return Colors.timerLongBreak;
      default:
        return Colors.timerPomodoro;
    }
  };

  // Get timer type label
  const getTimerLabel = () => {
    switch (timerType) {
      case "pomodoro":
        return "Focus Session";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
      default:
        return "Focus Session";
    }
  };

  // Animate progress circle
  useEffect(() => {
    // Calculate progress percentage
    const totalSeconds = (timerSettings[timerType] || 25) * 60;
    const progress = timeRemaining / totalSeconds;

    // Animate to current progress
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Play sound when timer completes
    if (timeRemaining === 0 && !isRunning) {
      playCompletionSound();
    }
  }, [timeRemaining, timerType, isRunning, timerSettings, playCompletionSound]);

  // Handle play/pause button
  const handlePlayPause = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  return (
    <View style={styles.container}>
      {/* Timer type selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            timerType === "pomodoro" && [
              styles.activeTypeButton,
              { backgroundColor: Colors.timerPomodoro + "20" },
            ],
          ]}
          onPress={() => switchTimerType("pomodoro")}
        >
          <Text
            style={[
              styles.typeText,
              timerType === "pomodoro" && [
                styles.activeTypeText,
                { color: Colors.timerPomodoro },
              ],
            ]}
          >
            Focus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            timerType === "shortBreak" && [
              styles.activeTypeButton,
              { backgroundColor: Colors.timerShortBreak + "20" },
            ],
          ]}
          onPress={() => switchTimerType("shortBreak")}
        >
          <Text
            style={[
              styles.typeText,
              timerType === "shortBreak" && [
                styles.activeTypeText,
                { color: Colors.timerShortBreak },
              ],
            ]}
          >
            Short Break
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            timerType === "longBreak" && [
              styles.activeTypeButton,
              { backgroundColor: Colors.timerLongBreak + "20" },
            ],
          ]}
          onPress={() => switchTimerType("longBreak")}
        >
          <Text
            style={[
              styles.typeText,
              timerType === "longBreak" && [
                styles.activeTypeText,
                { color: Colors.timerLongBreak },
              ],
            ]}
          >
            Long Break
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timer circle */}
      <View style={styles.timerContainer}>
        <View style={styles.outerCircle}>
          <Animated.View
            style={[
              styles.progressCircle,
              {
                borderColor: getTimerColor(),
                borderWidth: circleSize / 20,
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                opacity: progressAnimation,
              },
            ]}
          />

          <View style={styles.innerCircle}>
            <Text style={[styles.timerText, { color: getTimerColor() }]}>
              {formatTime(timeRemaining)}
            </Text>
            <Text style={styles.timerLabel}>{getTimerLabel()}</Text>

            {currentTask && (
              <Text style={styles.currentTaskText} numberOfLines={1}>
                Working on: {currentTask.title}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Control buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
          <Ionicons name="refresh-outline" size={24} color={Colors.gray600} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playPauseButton, { backgroundColor: getTimerColor() }]}
          onPress={handlePlayPause}
        >
          <Ionicons
            name={isRunning ? "pause" : "play"}
            size={32}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={skipTimer}>
          <Ionicons
            name="play-skip-forward-outline"
            size={24}
            color={Colors.gray600}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
    padding: 4,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  activeTypeButton: {
    backgroundColor: Colors.primary + "20",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray600,
  },
  activeTypeText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  outerCircle: {
    width: circleSize + 20,
    height: circleSize + 20,
    borderRadius: (circleSize + 20) / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray100,
  },
  progressCircle: {
    position: "absolute",
    borderWidth: 4,
    borderColor: Colors.primary,
    borderStyle: "solid",
    backgroundColor: "transparent",
  },
  innerCircle: {
    width: circleSize - 40,
    height: circleSize - 40,
    borderRadius: (circleSize - 40) / 2,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray600,
    marginBottom: 12,
  },
  currentTaskText: {
    fontSize: 14,
    color: Colors.gray500,
    maxWidth: circleSize - 60,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray100,
    marginHorizontal: 16,
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default FocusTimer;
