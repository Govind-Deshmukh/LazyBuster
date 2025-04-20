import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTimerContext } from "../context/TimerContext";
import { useTaskContext } from "../context/TaskContext";
import FocusTimer from "../components/FocusTimer";
import ProgressBar from "../components/ProgressBar";
import Colors from "../constants/color";
import * as storage from "../utils/storage";

const TimerScreen = () => {
  const {
    timerSettings,
    updateTimerSettings,
    completedSessions,
    currentTaskId,
    setCurrentTask,
    getFocusStats,
  } = useTimerContext();

  const { tasks } = useTaskContext();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tempSettings, setTempSettings] = useState({ ...timerSettings });
  const [incompleteTasks, setIncompleteTasks] = useState([]);

  // Get focus stats with error handling
  const focusStats = getFocusStats
    ? getFocusStats()
    : {
        totalTime: 0,
        todayTime: 0,
        completedSessions: 0,
        averagePerDay: 0,
      };

  // Update incomplete tasks list
  useEffect(() => {
    if (tasks && Array.isArray(tasks)) {
      const filtered = tasks.filter((task) => !task.completed);
      setIncompleteTasks(filtered);
    }
  }, [tasks]);

  // Initialize temp settings when timer settings change
  useEffect(() => {
    if (timerSettings) {
      setTempSettings({ ...timerSettings });
    }
  }, [timerSettings]);

  // Handle save settings
  const handleSaveSettings = () => {
    updateTimerSettings(tempSettings);
    setShowSettingsModal(false);
  };

  // Format timer settings for display (mm:ss)
  const formatSettingTime = (minutes) => {
    return `${minutes}:00`;
  };

  // Format focus time for display
  const formatFocusTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }
  };

  // Handle select task
  const handleSelectTask = (taskId) => {
    if (setCurrentTask) {
      setCurrentTask(taskId);
    }
    setShowTasksModal(false);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";

    const options = { month: "short", day: "numeric" };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  // Render task item for selection modal
  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        currentTaskId === item.id && styles.selectedTaskItem,
      ]}
      onPress={() => handleSelectTask(item.id)}
    >
      <View style={styles.taskInfo}>
        <Text
          style={[
            styles.taskTitle,
            currentTaskId === item.id && styles.selectedTaskTitle,
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {item.dueDate && (
          <Text style={styles.taskDueDate}>
            Due: {formatDate(item.dueDate)}
          </Text>
        )}
      </View>

      {currentTaskId === item.id && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Timer */}
      <FocusTimer />

      {/* Task selection button */}
      <TouchableOpacity
        style={styles.selectTaskButton}
        onPress={() => setShowTasksModal(true)}
      >
        <Ionicons name="list" size={20} color={Colors.primary} />
        <Text style={styles.selectTaskText}>
          {currentTaskId ? "Change Task" : "Select a Task"}
        </Text>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Focus Stats</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatFocusTime(focusStats.todayTime)}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedSessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatFocusTime(focusStats.totalTime)}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Timer Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setShowSettingsModal(true)}
      >
        <Ionicons name="settings-outline" size={20} color={Colors.gray600} />
        <Text style={styles.settingsText}>Timer Settings</Text>
      </TouchableOpacity>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Timer Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Pomodoro</Text>
              <View style={styles.settingControls}>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() =>
                    setTempSettings({
                      ...tempSettings,
                      pomodoro: Math.max(1, tempSettings.pomodoro - 5),
                    })
                  }
                >
                  <Ionicons name="remove" size={20} color={Colors.gray600} />
                </TouchableOpacity>

                <Text style={styles.settingValue}>
                  {formatSettingTime(tempSettings?.pomodoro || 25)}
                </Text>

                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() =>
                    setTempSettings({
                      ...tempSettings,
                      pomodoro: Math.min(60, tempSettings.pomodoro + 5),
                    })
                  }
                >
                  <Ionicons name="add" size={20} color={Colors.gray600} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Short Break</Text>
              <View style={styles.settingControls}>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() =>
                    setTempSettings({
                      ...tempSettings,
                      shortBreak: Math.max(1, tempSettings.shortBreak - 1),
                    })
                  }
                >
                  <Ionicons name="remove" size={20} color={Colors.gray600} />
                </TouchableOpacity>

                <Text style={styles.settingValue}>
                  {formatSettingTime(tempSettings?.shortBreak || 5)}
                </Text>

                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() =>
                    setTempSettings({
                      ...tempSettings,
                      shortBreak: Math.min(30, tempSettings.shortBreak + 1),
                    })
                  }
                >
                  <Ionicons name="add" size={20} color={Colors.gray600} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Long Break</Text>
              <View style={styles.settingControls}>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() =>
                    setTempSettings({
                      ...tempSettings,
                      longBreak: Math.max(5, tempSettings.longBreak - 5),
                    })
                  }
                >
                  <Ionicons name="remove" size={20} color={Colors.gray600} />
                </TouchableOpacity>

                <Text style={styles.settingValue}>
                  {formatSettingTime(tempSettings?.longBreak || 15)}
                </Text>

                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() =>
                    setTempSettings({
                      ...tempSettings,
                      longBreak: Math.min(60, tempSettings.longBreak + 5),
                    })
                  }
                >
                  <Ionicons name="add" size={20} color={Colors.gray600} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveSettings}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tasks Selection Modal */}
      <Modal
        visible={showTasksModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTasksModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Task</Text>
              <TouchableOpacity onPress={() => setShowTasksModal(false)}>
                <Ionicons name="close" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            {incompleteTasks.length > 0 ? (
              <FlatList
                data={incompleteTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id}
                style={styles.tasksList}
              />
            ) : (
              <View style={styles.emptyTasksContainer}>
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={48}
                  color={Colors.gray400}
                />
                <Text style={styles.emptyTasksText}>No tasks available</Text>
                <Text style={styles.emptyTasksSubtext}>
                  Add tasks to select them for focused work
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  selectTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary + "15",
    alignSelf: "center",
  },
  selectTaskText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.primary,
    marginLeft: 8,
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.gray800,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray600,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.gray200,
    alignSelf: "center",
  },
  settingsText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.gray600,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxHeight: "80%",
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray800,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.gray700,
  },
  settingControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray800,
    marginHorizontal: 12,
    minWidth: 60,
    textAlign: "center",
  },
  saveButton: {
    marginVertical: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  tasksList: {
    maxHeight: 400,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  selectedTaskItem: {
    backgroundColor: Colors.primary + "15",
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.gray800,
    marginBottom: 4,
  },
  selectedTaskTitle: {
    color: Colors.primary,
  },
  taskDueDate: {
    fontSize: 14,
    color: Colors.gray600,
  },
  emptyTasksContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTasksText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray600,
    marginTop: 16,
  },
  emptyTasksSubtext: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: "center",
    marginTop: 8,
  },
});

export default TimerScreen;
