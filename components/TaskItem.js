import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useTaskContext } from "../context/TaskContext";
import Colors from "@/constants/color";
import { PRIORITY_LEVELS } from "../constants/presets";

const TaskItem = ({ task, onPress }) => {
  const { completeTask, deleteTask } = useTaskContext();
  const [swipeableRef, setSwipeableRef] = useState(null);

  // Get priority color from presets
  const priorityColor =
    PRIORITY_LEVELS.find((p) => p.id === task.priority)?.color ||
    Colors.priorityMedium;

  // Format due date display
  const formatDueDate = (dateString) => {
    if (!dateString) return "";

    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueDay = new Date(dueDate);
    dueDay.setHours(0, 0, 0, 0);

    if (dueDay.getTime() === today.getTime()) {
      return "Today";
    } else if (dueDay.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else if (dueDay < today) {
      return `Overdue: ${dueDate.toLocaleDateString()}`;
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  // Handle task completion
  const handleComplete = () => {
    completeTask(task.id);
    if (swipeableRef) {
      swipeableRef.close();
    }
  };

  // Handle task deletion with confirmation
  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => deleteTask(task.id),
        style: "destructive",
      },
    ]);
    if (swipeableRef) {
      swipeableRef.close();
    }
  };

  // Right swipe actions (complete and delete)
  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.rightActions}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.completeButton,
            { transform: [{ translateX: trans }] },
          ]}
        >
          <TouchableOpacity onPress={handleComplete}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={[
            styles.actionButton,
            styles.deleteButton,
            { transform: [{ translateX: trans }] },
          ]}
        >
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Determine if task is overdue
  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false;

    const dueDate = new Date(task.dueDate);
    const now = new Date();

    return dueDate < now;
  };

  return (
    <Swipeable
      ref={(ref) => setSwipeableRef(ref)}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity
        onPress={() => onPress(task)}
        style={[
          styles.container,
          task.completed && styles.completedContainer,
          isOverdue() && styles.overdueContainer,
        ]}
      >
        {/* Priority indicator */}
        <View
          style={[styles.priorityIndicator, { backgroundColor: priorityColor }]}
        />

        <TouchableOpacity style={styles.checkbox} onPress={handleComplete}>
          <Ionicons
            name={task.completed ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={task.completed ? Colors.success : Colors.gray400}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              task.completed && styles.completedText,
              isOverdue() && styles.overdueText,
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              style={[
                styles.description,
                task.completed && styles.completedText,
              ]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}

          <View style={styles.metaContainer}>
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={isOverdue() ? Colors.error : Colors.gray500}
                />
                <Text
                  style={[styles.dueDate, isOverdue() && styles.overdueDate]}
                >
                  {formatDueDate(task.dueDate)}
                </Text>
              </View>
            )}

            {task.isRecurring && (
              <View style={styles.recurringContainer}>
                <Ionicons name="repeat" size={14} color={Colors.info} />
                <Text style={styles.recurring}>
                  {task.recurringType?.charAt(0).toUpperCase() +
                    task.recurringType?.slice(1)}
                </Text>
              </View>
            )}

            {task.timeSpent > 0 && (
              <View style={styles.timeSpentContainer}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={Colors.gray500}
                />
                <Text style={styles.timeSpent}>{task.timeSpent} min</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.gray400}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completedContainer: {
    opacity: 0.7,
    backgroundColor: Colors.gray100,
  },
  overdueContainer: {
    borderLeftColor: Colors.error,
    borderLeftWidth: 3,
  },
  priorityIndicator: {
    width: 4,
    height: "80%",
    borderRadius: 2,
    marginRight: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: Colors.gray500,
  },
  overdueText: {
    color: Colors.error,
  },
  description: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  dueDate: {
    fontSize: 12,
    color: Colors.gray500,
    marginLeft: 4,
  },
  overdueDate: {
    color: Colors.error,
    fontWeight: "500",
  },
  recurringContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  recurring: {
    fontSize: 12,
    color: Colors.info,
    marginLeft: 4,
  },
  timeSpentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeSpent: {
    fontSize: 12,
    color: Colors.gray500,
    marginLeft: 4,
  },
  chevron: {
    marginLeft: 10,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  actionButton: {
    width: 48,
    height: "86%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: Colors.success,
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
});

export default TaskItem;
