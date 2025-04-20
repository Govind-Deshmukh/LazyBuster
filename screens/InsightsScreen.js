import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTaskContext } from "../context/TaskContext";
import { useTimerContext } from "../context/TimerContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock LineChart component since we're staying lightweight
const LineChart = ({ data, labels, color }) => {
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartLabels}>
        {labels.map((label, index) => (
          <Text key={index} style={styles.chartLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.chartContent}>
        <View style={[styles.chartLine, { backgroundColor: color }]} />
        {data.map((value, index) => (
          <View
            key={index}
            style={[
              styles.chartDot,
              {
                left: `${(index / (data.length - 1)) * 100}%`,
                bottom: `${(value / Math.max(...data, 1)) * 100}%`,
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const InsightsScreen = () => {
  // States for analytics data
  const [timeRange, setTimeRange] = useState("week"); // 'week', 'month', 'year'
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    taskCompletion: [],
    focusTime: [],
    streak: 0,
    mostProductiveDay: "",
    mostProductiveTime: "",
    labels: [],
  });

  // Get context data with safe fallbacks
  const taskContext = useTaskContext() || {};
  const timerContext = useTimerContext() || {};

  // Extract with default values to avoid undefined errors
  const tasks = taskContext.tasks || [];
  const streakCount = taskContext.streakCount || 0;
  const completedTasks = tasks.filter((task) => task.completed) || [];

  // For focus history, we'll create a simple structure if not available
  const focusHistory = timerContext.focusHistory || [];

  // Load and process analytics data
  useEffect(() => {
    const generateAnalytics = async () => {
      setIsLoading(true);

      try {
        // Get date range
        const endDate = new Date();
        const startDate = new Date();

        if (timeRange === "week") {
          startDate.setDate(endDate.getDate() - 7);
        } else if (timeRange === "month") {
          startDate.setDate(endDate.getDate() - 30);
        } else {
          startDate.setDate(endDate.getDate() - 90); // 3 months for 'year' view
        }

        // Generate date labels for x-axis
        const dateLabels = generateDateLabels(startDate, endDate, timeRange);

        // Filter tasks and focus sessions within date range
        const filteredTasks = completedTasks.filter((task) => {
          const completedAt = task.completedAt
            ? new Date(task.completedAt)
            : null;
          return (
            completedAt && completedAt >= startDate && completedAt <= endDate
          );
        });

        // For focus sessions, we'll create a simplified structure
        const filteredFocusSessions = focusHistory.filter((session) => {
          const sessionDate = session.date ? new Date(session.date) : null;
          return (
            sessionDate && sessionDate >= startDate && sessionDate <= endDate
          );
        });

        // Calculate task completion by day
        const taskCompletionData = calculateDailyMetrics(
          filteredTasks,
          startDate,
          endDate,
          (task) => 1 // Count each task as 1
        );

        // Calculate focus time by day (in minutes)
        const focusTimeData = calculateDailyMetrics(
          filteredFocusSessions,
          startDate,
          endDate,
          (session) => session.duration || 0
        );

        // Find most productive day
        const dayTotals = {};
        filteredTasks.forEach((task) => {
          if (task.completedAt) {
            const day = new Date(task.completedAt).toLocaleDateString("en-US", {
              weekday: "long",
            });
            dayTotals[day] = (dayTotals[day] || 0) + 1;
          }
        });

        const mostProductiveDay =
          Object.keys(dayTotals).length > 0
            ? Object.keys(dayTotals).reduce((a, b) =>
                dayTotals[a] > dayTotals[b] ? a : b
              )
            : "No data";

        // Find most productive time
        const hourTotals = {};
        filteredTasks.forEach((task) => {
          if (task.completedAt) {
            const hour = new Date(task.completedAt).getHours();
            hourTotals[hour] = (hourTotals[hour] || 0) + 1;
          }
        });

        const mostProductiveHour =
          Object.keys(hourTotals).length > 0
            ? Object.keys(hourTotals).reduce((a, b) =>
                hourTotals[a] > hourTotals[b] ? a : b
              )
            : null;

        const mostProductiveTime = mostProductiveHour
          ? formatHour(parseInt(mostProductiveHour))
          : "No data";

        // Set analytics data
        setAnalyticsData({
          taskCompletion: taskCompletionData,
          focusTime: focusTimeData,
          labels: dateLabels,
          streak: streakCount,
          mostProductiveDay,
          mostProductiveTime,
        });
      } catch (error) {
        console.error("Error generating analytics:", error);
        // Set default data on error
        setAnalyticsData({
          taskCompletion: [],
          focusTime: [],
          labels: [],
          streak: streakCount,
          mostProductiveDay: "No data",
          mostProductiveTime: "No data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateAnalytics();
  }, [timeRange, completedTasks, focusHistory, streakCount]);

  // Generate date labels for x-axis based on time range
  const generateDateLabels = (startDate, endDate, range) => {
    const labels = [];
    const currentDate = new Date(startDate);

    if (range === "week") {
      while (currentDate <= endDate) {
        labels.push(
          currentDate.toLocaleDateString("en-US", { weekday: "short" })
        );
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (range === "month") {
      // For month, use every 3rd day
      while (currentDate <= endDate) {
        if (labels.length % 3 === 0) {
          labels.push(
            currentDate.toLocaleDateString("en-US", { day: "numeric" })
          );
        } else {
          labels.push("");
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // For year (3 months), use weekly intervals
      while (currentDate <= endDate) {
        if (labels.length % 7 === 0) {
          labels.push(
            currentDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          );
        } else {
          labels.push("");
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return labels;
  };

  // Calculate daily metrics for tasks or focus sessions
  const calculateDailyMetrics = (items, startDate, endDate, valueFunction) => {
    const data = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayItems = items.filter((item) => {
        const itemDate = new Date(item.completedAt || item.date);
        return itemDate.toDateString() === currentDate.toDateString();
      });

      const dayTotal = dayItems.reduce(
        (total, item) => total + valueFunction(item),
        0
      );
      data.push(dayTotal);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  };

  // Format hour to AM/PM
  const formatHour = (hour) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  // Calculate productivity score (0-100)
  const calculateProductivityScore = () => {
    if (
      !analyticsData.taskCompletion ||
      analyticsData.taskCompletion.length === 0
    )
      return 0;

    // Average tasks per day
    const avgTasks =
      analyticsData.taskCompletion.reduce((sum, val) => sum + val, 0) /
      analyticsData.taskCompletion.length;

    // Average focus minutes per day
    const avgFocus =
      analyticsData.focusTime.reduce((sum, val) => sum + val, 0) /
      analyticsData.focusTime.length;

    // Calculate score based on tasks (max 50 points) and focus time (max 50 points)
    const taskScore = Math.min(avgTasks * 10, 50); // 5 tasks a day would be perfect
    const focusScore = Math.min(avgFocus / 4, 50); // 200 minutes a day would be perfect

    return Math.round(taskScore + focusScore);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "week" && styles.activeTimeRange,
          ]}
          onPress={() => setTimeRange("week")}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === "week" && styles.activeTimeRangeText,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "month" && styles.activeTimeRange,
          ]}
          onPress={() => setTimeRange("month")}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === "month" && styles.activeTimeRangeText,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            timeRange === "year" && styles.activeTimeRange,
          ]}
          onPress={() => setTimeRange("year")}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === "year" && styles.activeTimeRangeText,
            ]}
          >
            3 Months
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5D3FD3" />
          <Text style={styles.loadingText}>Generating insights...</Text>
        </View>
      ) : (
        <>
          {/* Productivity Score */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Productivity Score</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>
                {calculateProductivityScore()}
              </Text>
            </View>
            <Text style={styles.scoreHint}>
              Based on your task completion rate and focus time
            </Text>
          </View>

          {/* Task Completion Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Tasks Completed</Text>
            {analyticsData.taskCompletion.length > 0 ? (
              <LineChart
                data={analyticsData.taskCompletion}
                labels={analyticsData.labels}
                color="#5D3FD3"
              />
            ) : (
              <View style={styles.emptyDataContainer}>
                <Text style={styles.emptyDataText}>No task data available</Text>
              </View>
            )}
          </View>

          {/* Focus Time Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Focus Time (minutes)</Text>
            {analyticsData.focusTime.length > 0 ? (
              <LineChart
                data={analyticsData.focusTime}
                labels={analyticsData.labels}
                color="#F39C12"
              />
            ) : (
              <View style={styles.emptyDataContainer}>
                <Text style={styles.emptyDataText}>
                  No focus time data available
                </Text>
              </View>
            )}
          </View>

          {/* Insights Grid */}
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <Ionicons name="flame" size={24} color="#E74C3C" />
              <Text style={styles.insightValue}>{analyticsData.streak}</Text>
              <Text style={styles.insightLabel}>Day Streak</Text>
            </View>

            <View style={styles.insightCard}>
              <Ionicons name="calendar" size={24} color="#3498DB" />
              <Text style={styles.insightValue}>
                {analyticsData.mostProductiveDay}
              </Text>
              <Text style={styles.insightLabel}>Most Productive Day</Text>
            </View>

            <View style={styles.insightCard}>
              <Ionicons name="time" size={24} color="#2ECC71" />
              <Text style={styles.insightValue}>
                {analyticsData.mostProductiveTime}
              </Text>
              <Text style={styles.insightLabel}>Most Productive Time</Text>
            </View>

            <View style={styles.insightCard}>
              <Ionicons name="checkmark-done" size={24} color="#9B59B6" />
              <Text style={styles.insightValue}>
                {analyticsData.taskCompletion
                  ? analyticsData.taskCompletion.reduce(
                      (sum, val) => sum + val,
                      0
                    )
                  : 0}
              </Text>
              <Text style={styles.insightLabel}>Total Tasks</Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>
              {generateSummary(
                analyticsData.taskCompletion || [],
                analyticsData.focusTime || [],
                analyticsData.streak || 0,
                calculateProductivityScore()
              )}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

// Generate a summary based on the analytics data
const generateSummary = (taskCompletion, focusTime, streak, score) => {
  // Calculate averages
  const avgTasks =
    taskCompletion.length > 0
      ? taskCompletion.reduce((sum, val) => sum + val, 0) /
        taskCompletion.length
      : 0;

  const avgFocus =
    focusTime.length > 0
      ? focusTime.reduce((sum, val) => sum + val, 0) / focusTime.length
      : 0;

  // Generate encouraging messages based on data
  let message = "";

  if (score >= 80) {
    message =
      "Excellent work! You're showing high productivity levels. Keep up the great momentum!";
  } else if (score >= 60) {
    message =
      "Good job! You're maintaining a solid productivity level. Keep building those habits!";
  } else if (score >= 40) {
    message =
      "You're making progress! Try to increase your focus sessions for even better results.";
  } else if (score >= 20) {
    message =
      "You're taking steps in the right direction. Try setting smaller, achievable goals.";
  } else {
    message =
      "Getting started is the hardest part. Try using the focus timer for just 5 minutes today.";
  }

  return `You've completed an average of ${avgTasks.toFixed(
    1
  )} tasks per day and focused for an average of ${avgFocus.toFixed(
    1
  )} minutes. You're on a ${streak}-day streak. ${message}`;
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 10,
    justifyContent: "center",
    elevation: 3,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 5,
  },
  activeTimeRange: {
    backgroundColor: "#5D3FD3",
  },
  timeRangeText: {
    color: "#666",
    fontWeight: "500",
  },
  activeTimeRangeText: {
    color: "white",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  scoreCard: {
    margin: 15,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0EBFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#5D3FD3",
    marginBottom: 15,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#5D3FD3",
  },
  scoreHint: {
    color: "#666",
    textAlign: "center",
  },
  chartCard: {
    margin: 15,
    marginTop: 0,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  chartContainer: {
    height: 180,
    marginTop: 10,
  },
  chartContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    position: "relative",
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  chartLabel: {
    fontSize: 10,
    color: "#888",
    textAlign: "center",
    flex: 1,
  },
  chartLine: {
    position: "absolute",
    height: 2,
    width: "100%",
    bottom: "50%",
    opacity: 0.3,
  },
  chartDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyDataContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyDataText: {
    color: "#888",
    fontStyle: "italic",
  },
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: 10,
  },
  insightCard: {
    width: (width - 40) / 2,
    margin: 5,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 3,
    alignItems: "center",
  },
  insightValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  insightLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  summaryCard: {
    margin: 15,
    marginTop: 5,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryText: {
    color: "#333",
    lineHeight: 22,
  },
});

export default InsightsScreen;
