import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTimerContext } from "../context/TimerContext";
import { useTaskContext } from "../context/TaskContext";
import Colors from "../constants/color";

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

      {/* Timer display - simplified rectangular design */}
      <View style={styles.timerDisplay}>
        <View style={styles.timerInfo}>
          <Text style={[styles.timerText, { color: getTimerColor() }]}>
            {formatTime(timeRemaining)}
          </Text>
          <Text style={styles.timerLabel}>{getTimerLabel()}</Text>
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
            size={28}
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
    width: "100%",
    paddingVertical: 8,
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
    padding: 4,
    alignSelf: "center",
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  timerDisplay: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    padding: 20,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  timerInfo: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray600,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default FocusTimer;
