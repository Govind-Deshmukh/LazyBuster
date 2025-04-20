import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Colors from "@/constants/color";

const ProgressBar = ({
  progress,
  height = 12,
  color = Colors.primary,
  backgroundColor = Colors.gray200,
  showPercentage = true,
  label = "",
  animated = true,
  style = {},
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  // Format percentage
  const formattedPercentage = `${Math.round(normalizedProgress)}%`;

  // Width for the progress bar
  const progressWidth = `${normalizedProgress}%`;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{formattedPercentage}</Text>
          )}
        </View>
      ) : (
        showPercentage && (
          <Text style={styles.percentage}>{formattedPercentage}</Text>
        )
      )}

      <View
        style={[
          styles.progressBarContainer,
          {
            height,
            backgroundColor,
            borderRadius: height / 2,
          },
        ]}
      >
        {animated ? (
          <Animated.View
            style={[
              styles.progressBar,
              {
                height,
                width: progressWidth,
                backgroundColor: color,
                borderRadius: height / 2,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.progressBar,
              {
                height,
                width: progressWidth,
                backgroundColor: color,
                borderRadius: height / 2,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray700,
  },
  percentage: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray600,
    marginBottom: 4,
  },
  progressBarContainer: {
    width: "100%",
    overflow: "hidden",
  },
  progressBar: {
    position: "absolute",
    left: 0,
  },
});

export default ProgressBar;
