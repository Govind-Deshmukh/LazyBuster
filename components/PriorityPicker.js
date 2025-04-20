import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PRIORITY_LEVELS } from "../constants/presets";
import Colors from "@/constants/color";

const PriorityPicker = ({ selectedPriority, onPriorityChange }) => {
  // Get priority icon based on level
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return "alert-circle";
      case "medium":
        return "alert";
      case "low":
        return "checkmark-circle";
      default:
        return "alert";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.priorityButtons}>
        {PRIORITY_LEVELS.map((priority) => (
          <TouchableOpacity
            key={priority.id}
            style={[
              styles.priorityButton,
              selectedPriority === priority.id && styles.selectedButton,
              selectedPriority === priority.id && {
                backgroundColor: priority.color + "20",
              },
              { borderColor: priority.color },
            ]}
            onPress={() => onPriorityChange(priority.id)}
          >
            <Ionicons
              name={getPriorityIcon(priority.id)}
              size={18}
              color={priority.color}
              style={styles.priorityIcon}
            />
            <Text
              style={[
                styles.priorityText,
                selectedPriority === priority.id && styles.selectedText,
                {
                  color:
                    selectedPriority === priority.id
                      ? priority.color
                      : Colors.gray600,
                },
              ]}
            >
              {priority.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray700,
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priorityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray300,
    flex: 1,
    marginHorizontal: 4,
  },
  selectedButton: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },
  priorityIcon: {
    marginRight: 6,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray600,
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: "600",
  },
});

export default PriorityPicker;
