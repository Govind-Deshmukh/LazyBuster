import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTaskContext } from "../context/TaskContext";
import { useTimerContext } from "../context/TimerContext";
import {
  MOTIVATIONAL_QUOTES,
  REALITY_CHECK_SEVERITY,
} from "../constants/presets";
import * as storage from "../utils/storage";
import Colors from "../constants/color";

const { width } = Dimensions.get("window");

const RealityCheck = ({ onClose }) => {
  // Get context data with safe fallbacks
  const taskContext = useTaskContext() || {};
  const timerContext = useTimerContext() || {};

  // Extract methods with safe fallbacks
  const getRealityCheck = taskContext.getRealityCheck;
  const getTasksDueToday = taskContext.getTasksDueToday;
  const getOverdueTasks = taskContext.getOverdueTasks;
  const getTasksCompletedToday = taskContext.getTasksCompletedToday;
  const getFocusStats = timerContext.getFocusStats;

  const [visible, setVisible] = useState(true);
  const [slideAnimation] = useState(new Animated.Value(0));
  const [quote, setQuote] = useState("");
  const [sound, setSound] = useState(null);

  // Get reality check data
  const realityCheck = getRealityCheck
    ? getRealityCheck()
    : { message: "Stay focused on your tasks!", severity: "normal" };

  // Get task data with safe defaults
  const todayTasks = getTasksDueToday ? getTasksDueToday() : [];
  const overdueTasks = getOverdueTasks ? getOverdueTasks() : [];
  const completedTasks = getTasksCompletedToday ? getTasksCompletedToday() : [];

  // Get focus stats with safe defaults
  const focusStats = getFocusStats
    ? getFocusStats()
    : { todayTime: 0, totalTime: 0 };

  // Get severity styling
  const severityInfo =
    REALITY_CHECK_SEVERITY[realityCheck.severity] ||
    REALITY_CHECK_SEVERITY.normal;

  // Load and play sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/notification.mp3")
        );
        setSound(sound);
        await sound.playAsync();
      } catch (error) {
        console.warn("Could not load or play sound", error);
      }
    };

    loadSound();

    // Try to vibrate device
    try {
      Vibration.vibrate(500);
    } catch (error) {
      console.warn("Vibration not supported", error);
    }

    // Cleanup sound on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Select a motivational quote and start animation
  useEffect(() => {
    // Get a random quote
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);

    // Start slide-in animation
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Record that this reality check was shown
    storage.saveRealityCheckDismissed(new Date());
  }, []);

  // Format focus time for display
  const formatFocusTime = useCallback((minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }, []);

  // Handle close action
  const handleClose = useCallback(() => {
    // Play sound when closing
    if (sound) {
      sound.playAsync().catch((error) => {
        console.warn("Error playing sound on close:", error);
      });
    }

    // Animate out
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    });
  }, [sound, onClose, slideAnimation]);

  // Handle focus now action - closes but also signals intent to focus
  const handleFocusNow = useCallback(() => {
    // We could add additional logic here to navigate to timer
    // or start a focus session automatically

    handleClose();
  }, [handleClose]);

  // Animation values
  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  // Don't render if not visible
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBackground}>
        <Animated.View
          style={[styles.container, { transform: [{ translateY }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons
              name={severityInfo.icon}
              size={28}
              color={severityInfo.color}
            />
            <Text style={styles.title}>Reality Check</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          {/* Message */}
          <View
            style={[
              styles.messageContainer,
              { borderColor: severityInfo.color },
            ]}
          >
            <Text style={styles.message}>{realityCheck.message}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayTasks.length}</Text>
              <Text style={styles.statLabel}>Due Today</Text>
            </View>

            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  overdueTasks.length > 0 ? { color: Colors.error } : {},
                ]}
              >
                {overdueTasks.length}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatFocusTime(focusStats.todayTime || 0)}
              </Text>
              <Text style={styles.statLabel}>Focus Today</Text>
            </View>
          </View>

          {/* Completion progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Daily Tasks Completed</Text>
              <Text style={styles.progressValue}>
                {completedTasks.length}/
                {completedTasks.length + todayTasks.length}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${calculateCompletionPercentage(
                      completedTasks.length,
                      todayTasks.length
                    )}%`,
                    backgroundColor: getProgressColor(
                      completedTasks.length,
                      todayTasks.length
                    ),
                  },
                ]}
              />
            </View>
          </View>

          {/* Motivational quote */}
          <View style={styles.quoteContainer}>
            <Text style={styles.quote}>{quote}</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleFocusNow}
            >
              <Ionicons
                name="timer-outline"
                size={18}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.primaryButtonText}>Start Focusing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleClose}
            >
              <Text style={styles.secondaryButtonText}>Remind Me Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Helper function to calculate completion percentage
const calculateCompletionPercentage = (completed, remaining) => {
  const total = completed + remaining;
  if (total === 0) return 100; // If no tasks, show as 100% complete
  return Math.round((completed / total) * 100);
};

// Helper function to get appropriate color based on progress
const getProgressColor = (completed, remaining) => {
  const percentage = calculateCompletionPercentage(completed, remaining);

  if (percentage >= 75) return Colors.success;
  if (percentage >= 40) return Colors.warning;
  return Colors.error;
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width - 40,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.gray800,
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  messageContainer: {
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  message: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.gray800,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.gray800,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray600,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray700,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  quoteContainer: {
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderColor: Colors.info,
  },
  quote: {
    fontSize: 14,
    fontStyle: "italic",
    color: Colors.gray700,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 6,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: Colors.gray200,
  },
  secondaryButtonText: {
    color: Colors.gray700,
    fontWeight: "600",
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default RealityCheck;
