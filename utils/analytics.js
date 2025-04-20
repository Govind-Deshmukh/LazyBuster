import * as storage from "./storage";

// Generate insights about user's task completion patterns
export const generateTaskInsights = async () => {
  try {
    const tasks = await storage.getTasks();
    const now = new Date();

    // Tasks completed in the last 7 days
    const lastWeekTasks = tasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return completedDate >= weekAgo;
    });

    // Tasks completed in the last 30 days
    const lastMonthTasks = tasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return completedDate >= monthAgo;
    });

    // Tasks by priority in the last 30 days
    const priorityStats = {
      high: lastMonthTasks.filter((task) => task.priority === "high").length,
      medium: lastMonthTasks.filter((task) => task.priority === "medium")
        .length,
      low: lastMonthTasks.filter((task) => task.priority === "low").length,
    };

    // Calculate completion rate
    const totalCreatedWeek = tasks.filter((task) => {
      const createdDate = new Date(task.createdAt);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length;

    const totalCreatedMonth = tasks.filter((task) => {
      const createdDate = new Date(task.createdAt);
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return createdDate >= monthAgo;
    }).length;

    const completionRateWeek =
      totalCreatedWeek > 0
        ? (lastWeekTasks.length / totalCreatedWeek) * 100
        : 0;

    const completionRateMonth =
      totalCreatedMonth > 0
        ? (lastMonthTasks.length / totalCreatedMonth) * 100
        : 0;

    // Get completion by day of week
    const dayOfWeekCompletion = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat

    lastMonthTasks.forEach((task) => {
      const completedDate = new Date(task.completedAt);
      const dayOfWeek = completedDate.getDay();
      dayOfWeekCompletion[dayOfWeek]++;
    });

    // Calculate average completion time (from creation to completion)
    let totalCompletionTime = 0;
    let tasksWithCompletionTime = 0;

    lastMonthTasks.forEach((task) => {
      const createdDate = new Date(task.createdAt);
      const completedDate = new Date(task.completedAt);
      const completionTime = (completedDate - createdDate) / (1000 * 60 * 60); // in hours

      if (completionTime > 0) {
        totalCompletionTime += completionTime;
        tasksWithCompletionTime++;
      }
    });

    const avgCompletionTime =
      tasksWithCompletionTime > 0
        ? totalCompletionTime / tasksWithCompletionTime
        : 0;

    // Calculate on-time completion rate
    const onTimeCompletions = lastMonthTasks.filter((task) => {
      if (!task.dueDate) return true; // No due date means no late task

      const dueDate = new Date(task.dueDate);
      const completedDate = new Date(task.completedAt);

      return completedDate <= dueDate;
    }).length;

    const onTimeRate =
      lastMonthTasks.length > 0
        ? (onTimeCompletions / lastMonthTasks.length) * 100
        : 100;

    // Get current streak
    const streak = await storage.getStreak();

    // Calculate productivity score (0-100)
    const productivityScore = calculateProductivityScore(
      completionRateWeek,
      onTimeRate,
      streak.count,
      priorityStats.high
    );

    return {
      tasksCompletedWeek: lastWeekTasks.length,
      tasksCompletedMonth: lastMonthTasks.length,
      completionRateWeek,
      completionRateMonth,
      priorityStats,
      dayOfWeekCompletion,
      avgCompletionTime,
      onTimeRate,
      streak: streak.count,
      productivityScore,
    };
  } catch (error) {
    console.error("Error generating task insights:", error);
    return null;
  }
};

// Calculate productivity score based on several metrics
const calculateProductivityScore = (
  completionRate,
  onTimeRate,
  streak,
  highPriorityCompleted
) => {
  // Weights for different factors
  const weights = {
    completionRate: 0.4,
    onTimeRate: 0.3,
    streak: 0.2,
    highPriority: 0.1,
  };

  // Normalize streak (cap at 10 for max points)
  const normalizedStreak = Math.min(streak, 10) * 10;

  // High priority factor (cap at 10 for max points)
  const highPriorityFactor = Math.min(highPriorityCompleted, 10) * 10;

  // Calculate weighted score
  const score =
    completionRate * weights.completionRate +
    onTimeRate * weights.onTimeRate +
    normalizedStreak * weights.streak +
    highPriorityFactor * weights.highPriority;

  // Ensure the score is between 0-100
  return Math.min(Math.max(score, 0), 100);
};

// Generate focus time insights
export const generateFocusInsights = async () => {
  try {
    const totalFocusTime = await storage.getTotalFocusTime();
    const todayFocusTime = await storage.getTodayFocusTime();
    const completedSessions = await storage.getCompletedSessions();

    // For a proper implementation, we'd need to store daily focus times
    // This is a simplified version
    const dailyAverage = totalFocusTime > 0 ? totalFocusTime / 30 : 0; // Assuming 30 days of data

    return {
      totalFocusTime,
      todayFocusTime,
      completedSessions,
      dailyAverage,
      focusScore: calculateFocusScore(todayFocusTime, completedSessions),
    };
  } catch (error) {
    console.error("Error generating focus insights:", error);
    return null;
  }
};

// Calculate focus score based on today's focus time and completed sessions
const calculateFocusScore = (todayMinutes, sessions) => {
  // Target values for maximum score
  const targetMinutes = 120; // 2 hours of focused work
  const targetSessions = 8; // 8 pomodoro sessions

  // Calculate component scores
  const timeScore = Math.min(todayMinutes / targetMinutes, 1) * 60; // 60% weight
  const sessionScore = Math.min(sessions / targetSessions, 1) * 40; // 40% weight

  // Combine scores
  return Math.round(timeScore + sessionScore);
};

// Generate personalized recommendations based on user's performance
export const generateRecommendations = async () => {
  try {
    const taskInsights = await generateTaskInsights();
    const focusInsights = await generateFocusInsights();

    if (!taskInsights || !focusInsights) {
      return [
        "Keep tracking your tasks and focus time to get personalized recommendations.",
      ];
    }

    const recommendations = [];

    // Task completion recommendations
    if (taskInsights.completionRateWeek < 50) {
      recommendations.push(
        "Try breaking down your tasks into smaller, more manageable steps."
      );
    }

    if (taskInsights.onTimeRate < 70) {
      recommendations.push(
        "Consider setting earlier deadlines or allowing more time for tasks."
      );
    }

    // Priority-based recommendations
    if (taskInsights.priorityStats.high < taskInsights.priorityStats.low) {
      recommendations.push(
        "Focus on completing high-priority tasks first before moving to low-priority items."
      );
    }

    // Day of week patterns
    const leastProductiveDay = taskInsights.dayOfWeekCompletion.indexOf(
      Math.min(...taskInsights.dayOfWeekCompletion)
    );
    const mostProductiveDay = taskInsights.dayOfWeekCompletion.indexOf(
      Math.max(...taskInsights.dayOfWeekCompletion)
    );

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    if (taskInsights.dayOfWeekCompletion[leastProductiveDay] === 0) {
      recommendations.push(
        `Try to complete at least one task on ${daysOfWeek[leastProductiveDay]}.`
      );
    } else {
      recommendations.push(
        `You tend to complete more tasks on ${daysOfWeek[mostProductiveDay]}. Consider scheduling important work on this day.`
      );
    }

    // Focus time recommendations
    if (focusInsights.todayFocusTime < 60) {
      recommendations.push("Aim for at least 1 hour of focused work each day.");
    }

    if (focusInsights.completedSessions < 4) {
      recommendations.push(
        "Try to complete at least 4 Pomodoro sessions daily for better productivity."
      );
    }

    // Add generic recommendations if the list is too short
    if (recommendations.length < 3) {
      recommendations.push(
        "Remember to take regular breaks to maintain productivity."
      );
      recommendations.push("Review your goals daily to stay on track.");
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [
      "Keep tracking your tasks and focus time to get personalized recommendations.",
    ];
  }
};

// Get overall productivity metrics
export const getProductivityOverview = async () => {
  const taskInsights = await generateTaskInsights();
  const focusInsights = await generateFocusInsights();

  if (!taskInsights || !focusInsights) {
    return null;
  }

  return {
    productivityScore: taskInsights.productivityScore,
    focusScore: focusInsights.focusScore,
    streakCount: taskInsights.streak,
    tasksCompletedWeek: taskInsights.tasksCompletedWeek,
    focusHoursWeek: focusInsights.totalFocusTime / 60, // Convert minutes to hours
  };
};

// Generate data for charts
export const generateChartData = async () => {
  try {
    const tasks = await storage.getTasks();
    const now = new Date();

    // Data for the last 7 days
    const last7Days = [];
    const completedByDay = [0, 0, 0, 0, 0, 0, 0];
    const createdByDay = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      last7Days.push(formattedDate);

      // Calculate day index (0 is today, 6 is 6 days ago)
      const dayIndex = 6 - i;

      // Count tasks completed on this day
      completedByDay[dayIndex] = tasks.filter((task) => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === date.getTime();
      }).length;

      // Count tasks created on this day
      createdByDay[dayIndex] = tasks.filter((task) => {
        const createdDate = new Date(task.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === date.getTime();
      }).length;
    }

    // Create dataset for 7-day completion chart
    const completionChartData = last7Days.map((date, index) => ({
      date,
      completed: completedByDay[index],
      created: createdByDay[index],
    }));

    // Data for priority distribution chart
    const priorityCounts = {
      high: tasks.filter((task) => task.priority === "high").length,
      medium: tasks.filter((task) => task.priority === "medium").length,
      low: tasks.filter((task) => task.priority === "low").length,
    };

    // Data for completion status chart
    const completionStatusCounts = {
      completed: tasks.filter((task) => task.completed).length,
      pending: tasks.filter((task) => !task.completed).length,
    };

    return {
      completionChartData,
      priorityDistributionData: [
        { name: "High", value: priorityCounts.high },
        { name: "Medium", value: priorityCounts.medium },
        { name: "Low", value: priorityCounts.low },
      ],
      completionStatusData: [
        { name: "Completed", value: completionStatusCounts.completed },
        { name: "Pending", value: completionStatusCounts.pending },
      ],
    };
  } catch (error) {
    console.error("Error generating chart data:", error);
    return null;
  }
};
