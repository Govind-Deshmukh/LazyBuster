// app/+not-found.js
import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Link, router } from "expo-router";
import Colors from "../constants/color";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.subtitle}>This screen doesn't exist.</Text>

      <View style={styles.separator} />

      <Text style={styles.description}>
        It looks like you've followed a broken link or entered a URL that
        doesn't exist in the LazyBuster app.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Go to Home Screen</Text>
      </TouchableOpacity>

      {/* Alternative way to navigate using Link component */}
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Or tap here to go home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  separator: {
    height: 1,
    width: "80%",
    backgroundColor: Colors.border,
    marginVertical: 24,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 24,
    maxWidth: "80%",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
  },
});
