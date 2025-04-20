import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTimerContext } from "../context/TimerContext";
import { useTaskContext } from "../context/TaskContext";
import FocusTimer from "../components/FocusTimer";
import ProgressBar from "../components/ProgressBar";
import Colors from "../constants/color";

const TimerScreen = () => {
  const router = useRouter();
  const {
    timerSettings,
    updateTimerSettings,
    completedSessions,
    currentTaskId,
    setCurrentTask,
    getFocusStats,
    isRunning,
    timerType,
    timeRemaining,
    pauseTimer,
  } = useTimerContext();

  const { tasks, getTasksDueToday, updateTaskTime } = useTaskContext();

  // Local state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tempSettings, setTempSettings] = useState({ ...timerSettings });
  const [incompleteTasks, setIncompleteTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTaskData] = useState(null);
  const [sessionFocusTime, setSessionFocusTime] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState(null);

  // Get focus stats with error handling
  const focusStats = getFocusStats
    ? getFocusStats()
    : {
        totalTime: 0,
        todayTime: 0,
        completedSessions: 0,
        averagePerDay: 0,
      };

  // Update incomplete tasks list and current task data
  useEffect(() => {
    setLoading(true);

    // Then filter all incomplete tasks
    if (tasks && Array.isArray(tasks)) {
      const filtered = tasks.filter((task) => !task.completed);
      setIncompleteTasks(filtered);

      // If there's a current task ID, find the task data
      if (currentTaskId) {
        const taskData = filtered.find((task) => task.id === currentTaskId);
        setCurrentTaskData(taskData || null);
      } else {
        setCurrentTaskData(null);
      }
    }

    setLoading(false);
  }, [tasks, currentTaskId]);

  // Initialize temp settings when timer settings change
  useEffect(() => {
    if (timerSettings) {
      setTempSettings({ ...timerSettings });
    }
  }, [timerSettings]);

  // Track session time when timer is running
  useEffect(() => {
    if (isRunning && !timerStartTime && timerType === "pomodoro") {
      // Timer just started
      setTimerStartTime(Date.now());
    } else if (!isRunning && timerStartTime && timerType === "pomodoro") {
      // Timer just stopped
      const elapsedTime = Math.floor(
        (Date.now() - timerStartTime) / (1000 * 60)
      );
      if (elapsedTime > 0) {
        setSessionFocusTime((prevTime) => prevTime + elapsedTime);

        // If there's a current task, update its time
        if (currentTaskId && updateTaskTime) {
          updateTaskTime(currentTaskId, elapsedTime);
        }
      }
      setTimerStartTime(null);
    }
  }, [isRunning, timerType, timerStartTime, currentTaskId, updateTaskTime]);

  // Handle save settings
  const handleSaveSettings = () => {
    // Validate settings
    if (
      !tempSettings ||
      tempSettings.pomodoro < 1 ||
      tempSettings.shortBreak < 1 ||
      tempSettings.longBreak < 5
    ) {
      Alert.alert(
        "Invalid Settings",
        "Please make sure all timer durations are valid."
      );
      return;
    }

    updateTimerSettings(tempSettings);
    setShowSettingsModal(false);
  };

  // Format timer settings for display (mm:ss)
  const formatSettingTime = (minutes) => {
    return `${minutes}:00`;
  };

  // Format focus time for display
  const formatFocusTime = (minutes) => {
    if (!minutes || minutes === 0) return "0 min";

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
    // If the timer is running, ask for confirmation before changing task
    if (isRunning && timerType === "pomodoro") {
      Alert.alert(
        "Timer Running",
        "Changing tasks will pause your current timer. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => {
              pauseTimer();
              setCurrentTask(taskId);
              setShowTasksModal(false);
            },
          },
        ]
      );
    } else {
      setCurrentTask(taskId);
      setShowTasksModal(false);
    }
  };

  // Add a new task
  const handleAddNewTask = () => {
    router.push("/addTask");
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";

    const options = { month: "short", day: "numeric" };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  // Show task priority indicator
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return Colors.priorityHigh;
      case "medium":
        return Colors.priorityMedium;
      case "low":
        return Colors.priorityLow;
      default:
        return Colors.priorityMedium;
    }
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
      <View
        style={[
          styles.taskPriorityIndicator,
          { backgroundColor: getPriorityColor(item.priority) },
        ]}
      />

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
          <Text
            style={[
              styles.taskDueDate,
              new Date(item.dueDate) < new Date()
                ? styles.overdueDateText
                : null,
            ]}
          >
            Due: {formatDate(item.dueDate)}
          </Text>
        )}
      </View>

      {currentTaskId === item.id && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  // Pomodoro progress percentage
  const getPomodoroProgress = useCallback(() => {
    if (timerType !== "pomodoro" || !timeRemaining) return 0;

    const totalSeconds = timerSettings?.pomodoro
      ? timerSettings.pomodoro * 60
      : 1500;
    return Math.round((timeRemaining / totalSeconds) * 100);
  }, [timerType, timeRemaining, timerSettings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Current task banner */}
        {currentTask && (
          <View style={styles.currentTaskBanner}>
            <Text style={styles.currentTaskLabel}>Current Task:</Text>
            <Text style={styles.currentTaskTitle} numberOfLines={1}>
              {currentTask.title}
            </Text>
            <TouchableOpacity
              style={styles.changeTaskButton}
              onPress={() => setShowTasksModal(true)}
            >
              <Text style={styles.changeTaskText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timer Component */}
        <FocusTimer />

        {/* Pomodoro Progress */}
        {timerType === "pomodoro" && timeRemaining > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Session Progress</Text>
              <Text style={styles.progressValue}>{getPomodoroProgress()}%</Text>
            </View>
            <ProgressBar
              progress={getPomodoroProgress()}
              height={8}
              color={isRunning ? Colors.timerPomodoro : Colors.gray400}
            />
          </View>
        )}

        {/* Task selection button */}
        {!currentTask && (
          <View style={styles.taskSelectionArea}>
            <TouchableOpacity
              style={styles.selectTaskButton}
              onPress={() => setShowTasksModal(true)}
            >
              <Ionicons name="list" size={20} color={Colors.primary} />
              <Text style={styles.selectTaskText}>Select a Task</Text>
            </TouchableOpacity>
          </View>
        )}

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

          {/* Current session stats if timer is or was running */}
          {(sessionFocusTime > 0 || isRunning) && timerType === "pomodoro" && (
            <View style={styles.sessionStatsContainer}>
              <Text style={styles.sessionLabel}>Current session:</Text>
              <Text style={styles.sessionTime}>
                {formatFocusTime(sessionFocusTime)}{" "}
                {isRunning ? "(running)" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Timer Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.gray600} />
          <Text style={styles.settingsText}>Timer Settings</Text>
        </TouchableOpacity>
      </ScrollView>

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

            <ScrollView>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Pomodoro</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity
                    style={styles.settingButton}
                    onPress={() =>
                      setTempSettings({
                        ...tempSettings,
                        pomodoro: Math.max(
                          1,
                          (tempSettings?.pomodoro || 25) - 5
                        ),
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
                        pomodoro: Math.min(
                          60,
                          (tempSettings?.pomodoro || 25) + 5
                        ),
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
                        shortBreak: Math.max(
                          1,
                          (tempSettings?.shortBreak || 5) - 1
                        ),
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
                        shortBreak: Math.min(
                          30,
                          (tempSettings?.shortBreak || 5) + 1
                        ),
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
                        longBreak: Math.max(
                          5,
                          (tempSettings?.longBreak || 15) - 5
                        ),
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
                        longBreak: Math.min(
                          60,
                          (tempSettings?.longBreak || 15) + 5
                        ),
                      })
                    }
                  >
                    <Ionicons name="add" size={20} color={Colors.gray600} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

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

            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loaderText}>Loading tasks...</Text>
              </View>
            ) : incompleteTasks.length > 0 ? (
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

                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={handleAddNewTask}
                >
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={styles.addTaskText}>Add New Task</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  currentTaskBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "15",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  currentTaskLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray600,
    marginRight: 6,
  },
  currentTaskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  changeTaskButton: {
    backgroundColor: Colors.primary + "30",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeTaskText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
  },
  progressContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.gray600,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.timerPomodoro,
  },
  taskSelectionArea: {
    marginVertical: 12,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  selectTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.primary + "15",
    minWidth: 150,
  },
  selectTaskText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.primary,
    marginLeft: 8,
  },
  statsContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
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
  sessionStatsContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionLabel: {
    fontSize: 14,
    color: Colors.gray600,
    marginRight: 8,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  taskPriorityIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
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
  overdueDateText: {
    color: Colors.error,
    fontWeight: "500",
  },
  loaderContainer: {
    padding: 24,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
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
    marginBottom: 16,
  },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addTaskText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default TimerScreen;
