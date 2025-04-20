import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTimerContext } from "../context/TimerContext";
import { useTaskContext } from "../context/TaskContext";
import * as Notifications from "../utils/notifications";
import Colors from "@/constants/color";

const { width } = Dimensions.get("window");
const circleSize = width * 0.7;

const FocusTimer = () => {
  const {
    isRunning,
    timerType,
    timeRemaining,
    timerSettings,
    formatTime,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    switchTimerType,
    currentTaskId,
  } = useTimerContext();

  const { tasks } = useTaskContext();

  const [progressAnimation] = useState(new Animated.Value(1));

  // Get current task if one is selected
  const currentTask = tasks.find((task) => task.id === currentTaskId);

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
    const totalSeconds = timerSettings[timerType] * 60;
    const progress = timeRemaining / totalSeconds;

    // Animate to current progress
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Notify when timer completes
    if (timeRemaining === 0 && !isRunning) {
      Notifications.showTimerCompletedNotification(timerType);
    }
  }, [timeRemaining, timerType, isRunning]);

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
