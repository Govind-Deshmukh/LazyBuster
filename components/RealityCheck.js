import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTaskContext } from "../context/TaskContext";
import {
  MOTIVATIONAL_QUOTES,
  REALITY_CHECK_SEVERITY,
} from "../constants/presets";
import * as storage from "../utils/storage";
import Colors from "@/constants/color";

const { width } = Dimensions.get("window");

const RealityCheck = ({ onClose }) => {
  const { getRealityCheck, getTasksDueToday, getOverdueTasks } =
    useTaskContext();
  const [visible, setVisible] = useState(true);
  const [slideAnimation] = useState(new Animated.Value(0));
  const [quote, setQuote] = useState("");

  // Get reality check message and severity
  const { message, severity } = getRealityCheck();

  // Get stats for today
  const todayTasks = getTasksDueToday();
  const overdueTasks = getOverdueTasks();

  // Get severity icon and color
  const severityInfo =
    REALITY_CHECK_SEVERITY[severity] || REALITY_CHECK_SEVERITY.normal;

  // Select a random motivational quote on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);

    // Start animation
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle close
  const handleClose = async () => {
    // Animate out
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      storage.saveRealityCheckDismissed(new Date());

      if (onClose) {
        onClose();
      }
    });
  };

  // Handle transform based on animation
  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

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
            <Text style={styles.message}>{message}</Text>
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
                {Math.round(
                  (todayTasks.filter((t) => t.completed).length /
                    Math.max(todayTasks.length, 1)) *
                    100
                )}
                %
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
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
              onPress={handleClose}
            >
              <Text style={styles.primaryButtonText}>I'll Focus Now</Text>
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
});

export default RealityCheck;
