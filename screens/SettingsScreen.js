import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTimerContext } from "../context/TimerContext";

const SettingsScreen = () => {
  const { timerSettings, updateTimerSettings } = useTimerContext();

  // App settings state
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    realityChecks: true,
    soundEffects: true,
    vibration: true,
  });

  // Backup and restore modal
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [restoreCode, setRestoreCode] = useState("");

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem("appSettings");
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error("Failed to load settings from storage", error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem("appSettings", JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save settings to storage", error);
      }
    };

    saveSettings();
  }, [settings]);

  // Update a setting
  const updateSetting = (key, value) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  // Clear all app data with confirmation
  const clearAllData = () => {
    Alert.alert(
      "Reset App",
      "Are you sure you want to reset the app? This will delete all your tasks, journal entries, and settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all AsyncStorage data
              await AsyncStorage.clear();

              // Reset settings to defaults
              setSettings({
                darkMode: false,
                notifications: true,
                realityChecks: true,
                soundEffects: true,
                vibration: true,
              });

              // Reset timer settings to defaults
              updateTimerSettings({
                focusDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                sessionsBeforeLongBreak: 4,
                autoStartBreaks: true,
                autoStartPomodoros: false,
              });

              Alert.alert(
                "Reset Complete",
                "All app data has been reset. The app will now restart.",
                [{ text: "OK" }]
              );

              // In a real app, we would restart the app here
              // For our example, we'll just reload the current screen
              // navigation.reset({
              //   index: 0,
              //   routes: [{ name: 'Settings' }],
              // });
            } catch (error) {
              console.error("Error clearing app data:", error);
              Alert.alert(
                "Error",
                "Failed to reset app data. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // Backup app data
  const backupData = async () => {
    try {
      // Generate backup data from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(allKeys);

      // Convert to a JSON string and create a simple "code"
      // In a real app, this would be encrypted and more secure
      const backupData = JSON.stringify(allData);
      const code = btoa(backupData).substring(0, 20) + "..."; // Just for display

      setBackupCode(code);
      setShowBackupModal(true);

      // Share the backup data
      Share.share({
        message: `ProcrastinationBuster Backup: ${backupData}`,
        title: "App Backup Data",
      });
    } catch (error) {
      console.error("Error backing up data:", error);
      Alert.alert("Error", "Failed to back up app data. Please try again.");
    }
  };

  // Restore app data
  const restoreData = () => {
    Alert.alert(
      "Restore Data",
      "This will replace all your current data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              // In a real app, we would validate and parse the restore code
              // For our example, we'll just show a success message

              Alert.alert(
                "Restore Complete",
                "Your data has been restored successfully!",
                [{ text: "OK" }]
              );

              setShowBackupModal(false);
              setRestoreCode("");
            } catch (error) {
              console.error("Error restoring data:", error);
              Alert.alert(
                "Error",
                "Failed to restore data. The backup code may be invalid."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* General Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={22} color="#5D3FD3" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => updateSetting("notifications", value)}
            trackColor={{ false: "#ccc", true: "#5D3FD3" }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="bulb-outline" size={22} color="#5D3FD3" />
            <Text style={styles.settingText}>Reality Checks</Text>
          </View>
          <Switch
            value={settings.realityChecks}
            onValueChange={(value) => updateSetting("realityChecks", value)}
            trackColor={{ false: "#ccc", true: "#5D3FD3" }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high-outline" size={22} color="#5D3FD3" />
            <Text style={styles.settingText}>Sound Effects</Text>
          </View>
          <Switch
            value={settings.soundEffects}
            onValueChange={(value) => updateSetting("soundEffects", value)}
            trackColor={{ false: "#ccc", true: "#5D3FD3" }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait-outline" size={22} color="#5D3FD3" />
            <Text style={styles.settingText}>Vibration</Text>
          </View>
          <Switch
            value={settings.vibration}
            onValueChange={(value) => updateSetting("vibration", value)}
            trackColor={{ false: "#ccc", true: "#5D3FD3" }}
          />
        </View>
      </View>

      {/* Timer Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Focus Timer</Text>

        <TouchableOpacity
          style={styles.navigationItem}
          onPress={() => {
            /* Navigate to timer settings or open modal */
          }}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="timer-outline" size={22} color="#5D3FD3" />
            <Text style={styles.settingText}>Timer Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity style={styles.navigationItem} onPress={backupData}>
          <View style={styles.settingInfo}>
            <Ionicons name="cloud-upload-outline" size={22} color="#5D3FD3" />
            <Text style={styles.settingText}>Backup Data</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navigationItem}
          onPress={() => setShowBackupModal(true)}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="cloud-download-outline" size={22} color="#5D3FD3" />
            <Text style={styles.settingText}>Restore Data</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navigationItem} onPress={clearAllData}>
          <View style={styles.settingInfo}>
            <Ionicons name="trash-outline" size={22} color="#E74C3C" />
            <Text style={[styles.settingText, { color: "#E74C3C" }]}>
              Reset App
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <TouchableOpacity
          style={styles.navigationItem}
          onPress={() => {
            /* Open about modal or screen */
          }}
        >
          <View style={styles.settingInfo}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#5D3FD3"
            />
            <Text style={styles.settingText}>App Information</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navigationItem}
          onPress={() => {
            /* Open feedback option */
          }}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="mail-outline" size={22} color="#5D3FD3" />
            <Text style={styles.settingText}>Send Feedback</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      {/* Backup/Restore Modal */}
      <Modal
        visible={showBackupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBackupModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Backup & Restore</Text>
              <TouchableOpacity onPress={() => setShowBackupModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.backupSection}>
              <Text style={styles.backupTitle}>Your Backup Code</Text>
              <Text style={styles.backupDescription}>
                Use this code to restore your data on another device. Keep it
                safe!
              </Text>

              <View style={styles.codeContainer}>
                <Text style={styles.backupCode}>
                  {backupCode || "No backup generated yet"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.backupButton}
                onPress={backupData}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="white" />
                <Text style={styles.backupButtonText}>Generate New Backup</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.restoreSection}>
              <Text style={styles.backupTitle}>Restore from Backup</Text>
              <Text style={styles.backupDescription}>
                Enter your backup code to restore your data.
              </Text>

              <TextInput
                style={styles.restoreInput}
                placeholder="Paste your backup code here"
                value={restoreCode}
                onChangeText={setRestoreCode}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.backupButton,
                  {
                    backgroundColor:
                      restoreCode.length > 0 ? "#3498DB" : "#ccc",
                  },
                ]}
                onPress={restoreData}
                disabled={restoreCode.length === 0}
              >
                <Ionicons
                  name="cloud-download-outline"
                  size={20}
                  color="white"
                />
                <Text style={styles.backupButtonText}>Restore Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  navigationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  versionContainer: {
    alignItems: "center",
    padding: 20,
  },
  versionText: {
    color: "#888",
    fontSize: 12,
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
  backupSection: {
    marginBottom: 25,
  },
  restoreSection: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 20,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  backupDescription: {
    color: "#666",
    marginBottom: 15,
  },
  codeContainer: {
    backgroundColor: "#F0F0F0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  backupCode: {
    fontFamily: "monospace",
    fontSize: 14,
  },
  backupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5D3FD3",
    paddingVertical: 12,
    borderRadius: 8,
  },
  backupButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  restoreInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontFamily: "monospace",
    height: 100,
    textAlignVertical: "top",
  },
});

export default SettingsScreen;
