// app/(tabs)/journal.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import Colors from "../../constants/color";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState("");

  // Load journal entries on component mount
  useEffect(() => {
    loadEntries();
  }, []);

  // Save entries to AsyncStorage
  const saveEntries = async (updatedEntries) => {
    try {
      await AsyncStorage.setItem(
        "journal_entries",
        JSON.stringify(updatedEntries)
      );
    } catch (error) {
      console.error("Error saving journal entries", error);
    }
  };

  // Load entries from AsyncStorage
  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem("journal_entries");
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error("Error loading journal entries", error);
    }
  };

  // Add a new journal entry
  const addEntry = () => {
    if (newEntry.trim().length === 0) return;

    const entry = {
      id: Date.now().toString(),
      text: newEntry,
      date: new Date().toISOString(),
    };

    const updatedEntries = [entry, ...entries];
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
    setNewEntry("");
  };

  // Delete a journal entry
  const deleteEntry = (id) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journal</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Write your thoughts..."
          placeholderTextColor={Colors.textSecondary}
          value={newEntry}
          onChangeText={setNewEntry}
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={addEntry}>
          <Text style={styles.addButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
              <TouchableOpacity onPress={() => deleteEntry(item.id)}>
                <Text style={styles.deleteButton}>Delete</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.entryText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Your journal is empty. Start writing your thoughts!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 15,
    color: Colors.text,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  entryDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deleteButton: {
    color: Colors.danger,
    fontSize: 12,
  },
  entryText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
