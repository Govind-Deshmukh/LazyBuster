import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Changed to useRouter hook
import { useTaskContext } from "../../context/TaskContext";
import { useTimerContext } from "../../context/TimerContext";
import ProgressBar from "../../components/ProgressBar";
import RealityCheck from "../../components/RealityCheck";
import {
  MOTIVATIONAL_QUOTES,
  REALITY_CHECK_SEVERITY,
} from "../../constants/presets";
import Colors from "../../constants/color";

export default function HomeScreen() {
  const router = useRouter(); // Use the router hook to get the router object
  const {
    tasks,
    getTasksDueToday,
    getOverdueTasks,
    getCompletionRate,
    streakCount,
    getRealityCheck,
  } = useTaskContext();

  const { getFocusStats } = useTimerContext();

  const [showRealityCheck, setShowRealityCheck] = useState(false);
  const [quote, setQuote] = useState("");

  // Get today's date formatted
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get tasks for display
  const todayTasks = getTasksDueToday ? getTasksDueToday() : [];
  const overdueTasks = getOverdueTasks ? getOverdueTasks() : [];
  const completionRate = getCompletionRate ? getCompletionRate(7) : 0;

  // Get focus stats
  const focusStats = getFocusStats
    ? getFocusStats()
    : {
        todayTime: 0,
        completedSessions: 0,
      };

  // Select random quote on mount
  useEffect(() => {
    if (MOTIVATIONAL_QUOTES && MOTIVATIONAL_QUOTES.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * MOTIVATIONAL_QUOTES.length
      );
      setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
    }
  }, []);

  // Reality check status
  const realityCheck = getRealityCheck
    ? getRealityCheck()
    : {
        message: "Stay focused on your tasks!",
        severity: "normal",
      };

  // Format focus time for display
  const formatFocusTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Navigate to add task
  const navigateToAddTask = () => {
    router.push("/addTask");
  };

  // Navigate to focus timer
  const navigateToFocusTimer = () => {
    router.push("/(tabs)/timer");
  };

  // Navigate to journal
  const navigateToJournal = () => {
    router.push("/(tabs)/journal");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with date and streak */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello!</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.streakContainer}>
          <Ionicons name="flame" size={24} color={Colors.streakActive} />
          <Text style={styles.streakCount}>{streakCount || 0} day streak</Text>
        </View>
      </View>

      {/* Reality check card */}
      <TouchableOpacity
        style={[
          styles.realityCheckCard,
          {
            borderLeftColor:
              Colors[
                `reality${
                  realityCheck.severity.charAt(0).toUpperCase() +
                  realityCheck.severity.slice(1)
                }`
              ],
          },
        ]}
        onPress={() => setShowRealityCheck(true)}
      >
        <View style={styles.realityCheckHeader}>
          <Ionicons
            name={
              REALITY_CHECK_SEVERITY[realityCheck.severity]?.icon ||
              "information-circle"
            }
            size={24}
            color={
              Colors[
                `reality${
                  realityCheck.severity.charAt(0).toUpperCase() +
                  realityCheck.severity.slice(1)
                }`
              ]
            }
          />
          <Text style={styles.realityCheckTitle}>Reality Check</Text>
        </View>
        <Text style={styles.realityCheckMessage}>{realityCheck.message}</Text>
        <Text style={styles.realityCheckTap}>Tap for details</Text>
      </TouchableOpacity>

      {/* Quick stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{todayTasks.length}</Text>
          <Text style={styles.statLabel}>Due Today</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              overdueTasks.length > 0 ? { color: Colors.error } : {},
            ]}
          >
            {overdueTasks.length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatFocusTime(focusStats.todayTime)}
          </Text>
          <Text style={styles.statLabel}>Focus Today</Text>
        </View>
      </View>

      {/* Weekly completion rate */}
      <View style={styles.completionContainer}>
        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>Weekly Completion</Text>
          <Text style={styles.completionPercentage}>
            {Math.round(completionRate)}%
          </Text>
        </View>
        <ProgressBar
          progress={completionRate}
          height={10}
          color={
            completionRate > 75
              ? Colors.success
              : completionRate > 50
              ? Colors.warning
              : Colors.error
          }
        />
      </View>

      {/* Quick actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToAddTask}
        >
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: Colors.primary + "20" },
            ]}
          >
            <Ionicons name="add" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.actionText}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToFocusTimer}
        >
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: Colors.timerPomodoro + "20" },
            ]}
          >
            <Ionicons
              name="timer-outline"
              size={24}
              color={Colors.timerPomodoro}
            />
          </View>
          <Text style={styles.actionText}>Start Focus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToJournal}
        >
          <View
            style={[styles.actionIcon, { backgroundColor: Colors.info + "20" }]}
          >
            <Ionicons name="book-outline" size={24} color={Colors.info} />
          </View>
          <Text style={styles.actionText}>Journal</Text>
        </TouchableOpacity>
      </View>

      {/* Motivational quote */}
      {quote ? (
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>{quote}</Text>
        </View>
      ) : null}

      {/* Reality check modal */}
      {showRealityCheck && (
        <RealityCheck onClose={() => setShowRealityCheck(false)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.gray800,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: Colors.gray600,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.streakActive + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.streakActive,
    marginLeft: 6,
  },
  realityCheckCard: {
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  realityCheckHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  realityCheckTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray800,
    marginLeft: 8,
  },
  realityCheckMessage: {
    fontSize: 15,
    color: Colors.gray700,
    lineHeight: 22,
  },
  realityCheckTap: {
    fontSize: 12,
    color: Colors.gray500,
    alignSelf: "flex-end",
    marginTop: 8,
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.gray800,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray600,
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: Colors.gray300,
  },
  completionContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray800,
  },
  completionPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 6,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray700,
  },
  quoteContainer: {
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: "italic",
    color: Colors.gray700,
    lineHeight: 20,
  },
});
