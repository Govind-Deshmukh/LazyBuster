import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Switch,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTaskContext } from "../context/TaskContext";
import TaskItem from "../components/TaskItem";
import PriorityPicker from "../components/PriorityPicker";
import Colors from "../constants/color";

const TasksScreen = ({ navigation, route }) => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    getTasksByPriority,
  } = useTaskContext();

  // State for task filters and modal
  const [filterMode, setFilterMode] = useState("all"); // 'all', 'today', 'upcoming'
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  // State for new/editing task
  const [taskText, setTaskText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("daily"); // 'daily', 'weekly', 'monthly'

  // Animation value for the filter bar
  const filterBarAnimation = useRef(new Animated.Value(0)).current;

  // Check for route params
  useEffect(() => {
    if (route?.params?.openAddTask) {
      setShowAddModal(true);
    }

    if (route?.params?.focusedTaskId) {
      // Find and edit specific task
      const taskToEdit = tasks.find(
        (task) => task.id === route.params.focusedTaskId
      );
      if (taskToEdit) {
        handleEditTask(taskToEdit);
      }
    }
  }, [route?.params]);

  // Listen for scroll to show/hide filter bar
  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.y;

    Animated.timing(filterBarAnimation, {
      toValue: scrollOffset > 50 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Filter tasks based on selected filter
  const getFilteredTasks = () => {
    if (!tasks || tasks.length === 0) return [];

    switch (filterMode) {
      case "today":
        const today = new Date().toLocaleDateString();
        return tasks.filter((task) => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate).toLocaleDateString() === today;
        });
      case "upcoming":
        const now = new Date();
        return tasks
          .filter((task) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate > now;
          })
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      case "high":
        return tasks.filter((task) => task.priority === "high");
      case "medium":
        return tasks.filter((task) => task.priority === "medium");
      case "low":
        return tasks.filter((task) => task.priority === "low");
      case "completed":
        return tasks
          .filter((task) => task.completed)
          .slice()
          .reverse();
      default:
        return tasks;
    }
  };

  // Handle adding a new task
  const handleAddTask = () => {
    if (taskTitle.trim() === "") {
      Alert.alert("Error", "Task title cannot be empty");
      return;
    }

    const newTask = {
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      dueDate: taskDueDate,
      isRecurring: isRecurring,
      recurringType: isRecurring ? recurringPattern : null,
    };

    if (isEditing && editingTaskId) {
      updateTask(editingTaskId, newTask);
    } else {
      addTask(newTask);
    }

    // Reset form and close modal
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskDueDate(null);
    setIsRecurring(false);
    setRecurringPattern("daily");
    setShowAddModal(false);
    setIsEditing(false);
    setEditingTaskId(null);
  };

  // Handle editing a task
  const handleEditTask = (task) => {
    setIsEditing(true);
    setEditingTaskId(task.id);
    setTaskTitle(task.title || "");
    setTaskDescription(task.description || "");
    setTaskPriority(task.priority || "medium");
    setTaskDueDate(task.dueDate || null);
    setIsRecurring(task.isRecurring || false);
    setRecurringPattern(task.recurringType || "daily");
    setShowAddModal(true);
  };

  // Handle deleting a task with confirmation
  const handleDeleteTask = (taskId) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTask(taskId),
      },
    ]);
  };

  // Custom date picker options
  const dateOptions = [
    { label: "Today", value: 0 },
    { label: "Tomorrow", value: 1 },
    { label: "Next Week", value: 7 },
    { label: "In Two Weeks", value: 14 },
    { label: "No Due Date", value: null },
  ];

  // Set due date based on days from now
  const setDateFromNow = (days) => {
    if (days === null) {
      setTaskDueDate(null);
      setShowDatePicker(false);
      return;
    }

    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(23, 59, 59, 0);
    setTaskDueDate(date.toISOString());
    setShowDatePicker(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Select Due Date";

    return new Date(dateString).toLocaleDateString();
  };

  // Custom DatePicker component as a replacement for DateTimePicker
  const CustomDatePicker = () => (
    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.datePickerModalOverlay}>
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Due Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Ionicons name="close" size={24} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          {dateOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={styles.dateOption}
              onPress={() => setDateFromNow(option.value)}
            >
              <Text style={styles.dateOptionText}>{option.label}</Text>
              <Ionicons
                name={option.value === null ? "calendar-outline" : "calendar"}
                size={20}
                color={option.value === null ? Colors.gray600 : Colors.primary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <Animated.View
        style={[
          styles.filterBar,
          {
            transform: [
              {
                translateY: filterBarAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -50],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "all" && styles.activeFilter,
            ]}
            onPress={() => setFilterMode("all")}
          >
            <Text
              style={
                filterMode === "all"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "today" && styles.activeFilter,
            ]}
            onPress={() => setFilterMode("today")}
          >
            <Text
              style={
                filterMode === "today"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "upcoming" && styles.activeFilter,
            ]}
            onPress={() => setFilterMode("upcoming")}
          >
            <Text
              style={
                filterMode === "upcoming"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "high" && styles.activeFilter,
            ]}
            onPress={() => setFilterMode("high")}
          >
            <Text
              style={
                filterMode === "high"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              High Priority
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "medium" && styles.activeFilter,
            ]}
            onPress={() => setFilterMode("medium")}
          >
            <Text
              style={
                filterMode === "medium"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              Medium Priority
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "low" && styles.activeFilter,
            ]}
            onPress={() => setFilterMode("low")}
          >
            <Text
              style={
                filterMode === "low"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              Low Priority
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterMode === "completed" && styles.activeFilter,
            ]}
            onPress={() => setFilterMode("completed")}
          >
            <Text
              style={
                filterMode === "completed"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              Completed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Task List */}
      <FlatList
        data={getFilteredTasks()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem task={item} onPress={() => handleEditTask(item)} />
        )}
        onScroll={handleScroll}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {filterMode === "completed"
                ? "You haven't completed any tasks yet"
                : "No tasks found. Add some tasks to get started!"}
            </Text>
          </View>
        }
      />

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setIsEditing(false);
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add/Edit Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Task" : "Add New Task"}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Title:</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="What needs to be done?"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />

            <Text style={styles.inputLabel}>Description (optional):</Text>
            <TextInput
              style={styles.input}
              placeholder="Add details about this task..."
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
            />

            <Text style={styles.inputLabel}>Priority:</Text>
            <PriorityPicker
              selectedPriority={taskPriority}
              onPriorityChange={setTaskPriority}
            />

            <View style={styles.dateSection}>
              <Text style={styles.inputLabel}>Due Date:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {taskDueDate ? formatDate(taskDueDate) : "Select Date"}
                </Text>
                <Ionicons name="calendar" size={20} color="#5D3FD3" />
              </TouchableOpacity>
              {taskDueDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setTaskDueDate(null)}
                >
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Custom Date Picker */}
            <CustomDatePicker />

            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>Recurring Task:</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: "#ccc", true: "#5D3FD3" }}
              />
            </View>

            {isRecurring && (
              <View style={styles.recurringOptions}>
                <TouchableOpacity
                  style={[
                    styles.recurringButton,
                    recurringPattern === "daily" && styles.selectedRecurring,
                  ]}
                  onPress={() => setRecurringPattern("daily")}
                >
                  <Text
                    style={
                      recurringPattern === "daily"
                        ? styles.selectedRecurringText
                        : styles.recurringText
                    }
                  >
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.recurringButton,
                    recurringPattern === "weekly" && styles.selectedRecurring,
                  ]}
                  onPress={() => setRecurringPattern("weekly")}
                >
                  <Text
                    style={
                      recurringPattern === "weekly"
                        ? styles.selectedRecurringText
                        : styles.recurringText
                    }
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.recurringButton,
                    recurringPattern === "monthly" && styles.selectedRecurring,
                  ]}
                  onPress={() => setRecurringPattern("monthly")}
                >
                  <Text
                    style={
                      recurringPattern === "monthly"
                        ? styles.selectedRecurringText
                        : styles.recurringText
                    }
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleAddTask}>
              <Text style={styles.saveButtonText}>
                {isEditing ? "Update Task" : "Add Task"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  filterBar: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 3,
    zIndex: 1,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  activeFilter: {
    backgroundColor: "#5D3FD3",
  },
  filterText: {
    color: "#666",
  },
  activeFilterText: {
    color: "white",
    fontWeight: "500",
  },
  listContent: {
    padding: 15,
    paddingTop: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#5D3FD3",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  dateButtonText: {
    marginRight: 8,
    color: "#333",
  },
  clearDateButton: {
    marginLeft: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  recurringOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  recurringButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5,
    borderRadius: 8,
  },
  selectedRecurring: {
    borderColor: "#5D3FD3",
    backgroundColor: "#F0EBFF",
  },
  recurringText: {
    color: "#666",
  },
  selectedRecurringText: {
    color: "#5D3FD3",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#5D3FD3",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerModal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "80%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dateOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dateOptionText: {
    fontSize: 16,
  },
});

export default TasksScreen;
