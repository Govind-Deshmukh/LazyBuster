import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTaskContext } from "../context/TaskContext";
import PriorityPicker from "../components/PriorityPicker";
import Colors from "../constants/color";
import { RECURRING_OPTIONS, TASK_CATEGORIES } from "../constants/presets";
import * as Notifications from "../utils/notifications";

// Using Modal for a custom date picker implementation
import { Modal } from "react-native";

// This is the AddTask screen component
export default function AddTask() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tasks, addTask, updateTask, deleteTask } = useTaskContext();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");
  const [dueDate, setDueDate] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState("daily");

  // For date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  // For category picker
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // For recurring type picker
  const [showRecurringPicker, setShowRecurringPicker] = useState(false);

  // Check if we're editing an existing task
  const [editMode, setEditMode] = useState(false);
  const [taskId, setTaskId] = useState(null);

  // Populate form when editing an existing task
  useEffect(() => {
    if (params.taskId) {
      const task = tasks.find((t) => t.id === params.taskId);
      if (task) {
        setTaskId(task.id);
        setTitle(task.title);
        setDescription(task.description || "");
        setPriority(task.priority || "medium");
        setCategory(task.category || "general");
        setDueDate(task.dueDate ? new Date(task.dueDate) : null);
        setIsRecurring(task.isRecurring || false);
        setRecurringType(task.recurringType || "daily");
        setEditMode(true);
      }
    }
  }, [params.taskId, tasks]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      dueDate: dueDate ? dueDate.toISOString() : null,
      isRecurring,
      recurringType: isRecurring ? recurringType : null,
    };

    if (editMode) {
      updateTask(taskId, taskData);
    } else {
      const newTask = addTask(taskData);

      // Schedule notification if due date is set
      if (newTask && newTask.dueDate) {
        try {
          await Notifications.scheduleTaskReminder(newTask);
        } catch (error) {
          console.error("Failed to schedule notification:", error);
        }
      }
    }

    router.back();
  };

  // Handle task deletion with confirmation
  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          deleteTask(taskId);
          router.back();
        },
        style: "destructive",
      },
    ]);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "Select Due Date";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Simple date options for picker
  const dateOptions = [
    { label: "Today", value: 0 },
    { label: "Tomorrow", value: 1 },
    { label: "In 3 days", value: 3 },
    { label: "Next week", value: 7 },
    { label: "Next month", value: 30 },
    { label: "No due date", value: null },
  ];

  // Set a date based on days from now
  const setDateFromNow = (days) => {
    if (days === null) {
      setDueDate(null);
      return;
    }

    const date = new Date();
    date.setDate(date.getDate() + days);
    // Set time to end of day
    date.setHours(23, 59, 59, 0);
    setDueDate(date);
  };

  // Custom date picker component to avoid native DateTimePicker issues
  const CustomDatePicker = () => {
    return (
      <Modal
        transparent={true}
        visible={showDatePicker}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Choose a Due Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateOptions}>
              {dateOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={styles.dateOption}
                  onPress={() => {
                    setDateFromNow(option.value);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.dateOptionText}>{option.label}</Text>
                  {option.value === null ? (
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={Colors.gray600}
                    />
                  ) : (
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        {/* Task Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="What do you need to do?"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={Colors.gray500}
          />
        </View>

        {/* Task Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details about this task..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={Colors.gray500}
          />
        </View>

        {/* Priority Picker */}
        <View style={styles.inputContainer}>
          <PriorityPicker
            selectedPriority={priority}
            onPriorityChange={setPriority}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {TASK_CATEGORIES.find((c) => c.id === category)?.label ||
                "General"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.gray600} />
          </TouchableOpacity>
        </View>

        {/* Due Date Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {dueDate ? formatDate(dueDate) : "Select Due Date"}
            </Text>
            <Ionicons name="calendar" size={20} color={Colors.gray600} />
          </TouchableOpacity>

          {/* Custom Date Picker */}
          <CustomDatePicker />
        </View>

        {/* Recurring Task Toggle */}
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Recurring Task</Text>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: Colors.gray300, true: Colors.primary + "70" }}
            thumbColor={isRecurring ? Colors.primary : Colors.gray400}
          />
        </View>

        {/* Recurring Type Picker (visible only if isRecurring is true) */}
        {isRecurring && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Repeat</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRecurringPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {RECURRING_OPTIONS.find((o) => o.id === recurringType)?.label ||
                  "Daily"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.gray600} />
            </TouchableOpacity>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>
            {editMode ? "Update Task" : "Add Task"}
          </Text>
        </TouchableOpacity>

        {/* Delete Button (only in edit mode) */}
        {editMode && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={Colors.error} />
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          </TouchableOpacity>
        )}

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCategoryPicker(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.pickerModalContent}>
                <Text style={styles.pickerModalTitle}>Select Category</Text>

                {TASK_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.pickerOption,
                      category === cat.id && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        category === cat.id && styles.selectedOptionText,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {category === cat.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCategoryPicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Recurring Type Picker Modal */}
        <Modal
          visible={showRecurringPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRecurringPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowRecurringPicker(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.pickerModalContent}>
                <Text style={styles.pickerModalTitle}>Repeat Frequency</Text>

                {RECURRING_OPTIONS.filter((o) => o.id !== "none").map(
                  (option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.pickerOption,
                        recurringType === option.id && styles.selectedOption,
                      ]}
                      onPress={() => {
                        setRecurringType(option.id);
                        setShowRecurringPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          recurringType === option.id &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {recurringType === option.id && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={Colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  )
                )}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowRecurringPicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.gray800,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: Colors.gray800,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.errorLight,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerModalContent: {
    width: "85%",
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 16,
    textAlign: "center",
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  selectedOption: {
    backgroundColor: Colors.primary + "15",
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.gray700,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: "500",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.gray200,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray700,
  },
  datePickerContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "85%",
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    paddingBottom: 10,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray800,
  },
  dateOptions: {
    width: "100%",
  },
  dateOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  dateOptionText: {
    fontSize: 16,
    color: Colors.gray800,
  },
});
