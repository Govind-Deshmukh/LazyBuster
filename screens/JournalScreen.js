import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTaskContext } from "../context/TaskContext";

const JournalScreen = () => {
  // State for journal entries and goals
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    longTerm: [],
  });

  // State for modals
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [activeTab, setActiveTab] = useState("entries"); // 'entries' or 'goals'
  const [activeGoalType, setActiveGoalType] = useState("daily");

  // State for new entry/goal
  const [newEntryText, setNewEntryText] = useState("");
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalType, setNewGoalType] = useState("daily");

  // Get task context for stats
  const { getTasksCompletedToday, statistics } = useTaskContext();

  // Load journal entries and goals from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedEntries = await AsyncStorage.getItem("journalEntries");
        const storedGoals = await AsyncStorage.getItem("goals");

        if (storedEntries) {
          setEntries(JSON.parse(storedEntries));
        }

        if (storedGoals) {
          setGoals(JSON.parse(storedGoals));
        }
      } catch (error) {
        console.error("Failed to load journal data", error);
      }
    };

    loadData();
  }, []);

  // Save journal entries to storage when they change
  useEffect(() => {
    const saveEntries = async () => {
      try {
        await AsyncStorage.setItem("journalEntries", JSON.stringify(entries));
      } catch (error) {
        console.error("Failed to save journal entries", error);
      }
    };

    saveEntries();
  }, [entries]);

  // Save goals to storage when they change
  useEffect(() => {
    const saveGoals = async () => {
      try {
        await AsyncStorage.setItem("goals", JSON.stringify(goals));
      } catch (error) {
        console.error("Failed to save goals", error);
      }
    };

    saveGoals();
  }, [goals]);

  // Add a new journal entry
  const addEntry = () => {
    if (newEntryText.trim() === "") {
      Alert.alert("Error", "Entry cannot be empty");
      return;
    }

    const tasksCompleted = getTasksCompletedToday().length;

    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      text: newEntryText,
      tasksCompleted,
      mood: "neutral",
    };

    setEntries((prevEntries) => [newEntry, ...prevEntries]);
    setNewEntryText("");
    setShowEntryModal(false);
  };

  // Add a new goal
  const addGoal = () => {
    if (newGoalText.trim() === "") {
      Alert.alert("Error", "Goal cannot be empty");
      return;
    }

    const newGoal = {
      id: Date.now().toString(),
      text: newGoalText,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };

    setGoals((prevGoals) => ({
      ...prevGoals,
      [newGoalType]: [...prevGoals[newGoalType], newGoal],
    }));

    setNewGoalText("");
    setShowGoalModal(false);
  };

  // Toggle goal completion status
  const toggleGoalCompletion = (type, goalId) => {
    setGoals((prevGoals) => ({
      ...prevGoals,
      [type]: prevGoals[type].map((goal) =>
        goal.id === goalId ? { ...goal, isCompleted: !goal.isCompleted } : goal
      ),
    }));
  };

  // Delete a goal
  const deleteGoal = (type, goalId) => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedGoals = {
            ...goals,
            [type]: goals[type].filter((goal) => goal.id !== goalId),
          };

          setGoals(updatedGoals);
        },
      },
    ]);
  };

  // Delete a journal entry
  const deleteEntry = (entryId) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setEntries(entries.filter((entry) => entry.id !== entryId));
          },
        },
      ]
    );
  };

  // Format date for journal entries
  const formatEntryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate reflection prompts for new entries
  const getReflectionPrompt = () => {
    const prompts = [
      "What went well today? What could have gone better?",
      "What are you most proud of accomplishing today?",
      "What challenges did you face and how did you overcome them?",
      "What are you looking forward to tomorrow?",
      "Did you avoid procrastination today? Why or why not?",
      "What distractions affected your productivity and how can you minimize them?",
      "Did you make progress toward your goals today?",
      "What's one thing you can do better tomorrow?",
    ];

    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "entries" && styles.activeTab]}
            onPress={() => setActiveTab("entries")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "entries" && styles.activeTabText,
              ]}
            >
              Journal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "goals" && styles.activeTab]}
            onPress={() => setActiveTab("goals")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "goals" && styles.activeTabText,
              ]}
            >
              Goals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Journal Entries Tab */}
        {activeTab === "entries" && (
          <>
            <ScrollView contentContainerStyle={styles.entriesContainer}>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <View key={entry.id} style={styles.entryCard}>
                    <Text style={styles.entryDate}>
                      {formatEntryDate(entry.date)}
                    </Text>
                    <View style={styles.entryContentContainer}>
                      <Text style={styles.entryText}>{entry.text}</Text>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteEntry(entry.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#E74C3C"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.entryStats}>
                      <Text style={styles.entryStatsText}>
                        Tasks completed: {entry.tasksCompleted}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="journal-outline" size={50} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    No journal entries yet. Reflect on your day to stay
                    motivated!
                  </Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowEntryModal(true)}
            >
              <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
          </>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <>
            <View style={styles.goalTypeContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.goalTypeButton,
                    activeGoalType === "daily" && styles.activeGoalType,
                  ]}
                  onPress={() => setActiveGoalType("daily")}
                >
                  <Text
                    style={[
                      styles.goalTypeText,
                      activeGoalType === "daily" && styles.activeGoalTypeText,
                    ]}
                  >
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.goalTypeButton,
                    activeGoalType === "weekly" && styles.activeGoalType,
                  ]}
                  onPress={() => setActiveGoalType("weekly")}
                >
                  <Text
                    style={[
                      styles.goalTypeText,
                      activeGoalType === "weekly" && styles.activeGoalTypeText,
                    ]}
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.goalTypeButton,
                    activeGoalType === "monthly" && styles.activeGoalType,
                  ]}
                  onPress={() => setActiveGoalType("monthly")}
                >
                  <Text
                    style={[
                      styles.goalTypeText,
                      activeGoalType === "monthly" && styles.activeGoalTypeText,
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.goalTypeButton,
                    activeGoalType === "longTerm" && styles.activeGoalType,
                  ]}
                  onPress={() => setActiveGoalType("longTerm")}
                >
                  <Text
                    style={[
                      styles.goalTypeText,
                      activeGoalType === "longTerm" &&
                        styles.activeGoalTypeText,
                    ]}
                  >
                    Long Term
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.goalsContainer}>
              {goals[activeGoalType] && goals[activeGoalType].length > 0 ? (
                goals[activeGoalType].map((goal) => (
                  <View key={goal.id} style={styles.goalCard}>
                    <TouchableOpacity
                      style={styles.goalCheckBox}
                      onPress={() =>
                        toggleGoalCompletion(activeGoalType, goal.id)
                      }
                    >
                      {goal.isCompleted ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={26}
                          color="#5D3FD3"
                        />
                      ) : (
                        <Ionicons
                          name="ellipse-outline"
                          size={26}
                          color="#aaa"
                        />
                      )}
                    </TouchableOpacity>
                    <View style={styles.goalContent}>
                      <Text
                        style={[
                          styles.goalText,
                          goal.isCompleted && styles.completedGoalText,
                        ]}
                      >
                        {goal.text}
                      </Text>
                      <Text style={styles.goalCreatedAt}>
                        Created {new Date(goal.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteGoalButton}
                      onPress={() => deleteGoal(activeGoalType, goal.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#E74C3C"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="flag-outline" size={50} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    No {activeGoalType.replace(/([A-Z])/g, " $1").toLowerCase()}{" "}
                    goals set yet. Add some goals to stay focused!
                  </Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setNewGoalType(activeGoalType);
                setShowGoalModal(true);
              }}
            >
              <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
          </>
        )}

        {/* New Journal Entry Modal */}
        <Modal
          visible={showEntryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEntryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Journal Entry</Text>
                <TouchableOpacity onPress={() => setShowEntryModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.promptText}>{getReflectionPrompt()}</Text>

              <TextInput
                style={styles.textInput}
                placeholder="Write your thoughts here..."
                value={newEntryText}
                onChangeText={setNewEntryText}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.saveButton} onPress={addEntry}>
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* New Goal Modal */}
        <Modal
          visible={showGoalModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowGoalModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set a New Goal</Text>
                <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.goalTypeSelection}>
                <TouchableOpacity
                  style={[
                    styles.goalTypeOption,
                    newGoalType === "daily" && styles.selectedGoalType,
                  ]}
                  onPress={() => setNewGoalType("daily")}
                >
                  <Text
                    style={[
                      styles.goalTypeOptionText,
                      newGoalType === "daily" && styles.selectedGoalTypeText,
                    ]}
                  >
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.goalTypeOption,
                    newGoalType === "weekly" && styles.selectedGoalType,
                  ]}
                  onPress={() => setNewGoalType("weekly")}
                >
                  <Text
                    style={[
                      styles.goalTypeOptionText,
                      newGoalType === "weekly" && styles.selectedGoalTypeText,
                    ]}
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.goalTypeOption,
                    newGoalType === "monthly" && styles.selectedGoalType,
                  ]}
                  onPress={() => setNewGoalType("monthly")}
                >
                  <Text
                    style={[
                      styles.goalTypeOptionText,
                      newGoalType === "monthly" && styles.selectedGoalTypeText,
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.goalTypeOption,
                    newGoalType === "longTerm" && styles.selectedGoalType,
                  ]}
                  onPress={() => setNewGoalType("longTerm")}
                >
                  <Text
                    style={[
                      styles.goalTypeOptionText,
                      newGoalType === "longTerm" && styles.selectedGoalTypeText,
                    ]}
                  >
                    Long Term
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="What's your goal?"
                value={newGoalText}
                onChangeText={setNewGoalText}
                multiline
              />

              <TouchableOpacity style={styles.saveButton} onPress={addGoal}>
                <Text style={styles.saveButtonText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#5D3FD3",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#5D3FD3",
  },
  entriesContainer: {
    padding: 15,
  },
  entryCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  entryDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  entryContentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  entryText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  entryStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  entryStatsText: {
    fontSize: 12,
    color: "#666",
  },
  goalTypeContainer: {
    backgroundColor: "white",
    paddingVertical: 10,
    elevation: 3,
  },
  goalTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  activeGoalType: {
    backgroundColor: "#5D3FD3",
  },
  goalTypeText: {
    color: "#666",
    fontWeight: "500",
  },
  activeGoalTypeText: {
    color: "white",
  },
  goalsContainer: {
    padding: 15,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  goalCheckBox: {
    marginRight: 15,
  },
  goalContent: {
    flex: 1,
  },
  goalText: {
    fontSize: 16,
  },
  completedGoalText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  goalCreatedAt: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  deleteGoalButton: {
    padding: 5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  emptyStateText: {
    textAlign: "center",
    marginTop: 15,
    color: "#666",
    lineHeight: 22,
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
    maxHeight: "80%",
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
  promptText: {
    fontSize: 16,
    color: "#5D3FD3",
    marginBottom: 15,
    fontStyle: "italic",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
    marginBottom: 20,
    textAlignVertical: "top",
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
  goalTypeSelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  goalTypeOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 10,
    marginBottom: 10,
  },
  selectedGoalType: {
    backgroundColor: "#5D3FD3",
  },
  goalTypeOptionText: {
    color: "#666",
  },
  selectedGoalTypeText: {
    color: "white",
    fontWeight: "500",
  },
});

export default JournalScreen;
