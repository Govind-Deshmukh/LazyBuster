import React from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View } from "react-native";
import { TaskProvider } from "../context/TaskContext";
import { TimerProvider } from "../context/TimerContext";
import Colors from "../constants/color";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="auto" />
      <TaskProvider>
        <TimerProvider>
          <Slot />
        </TimerProvider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
