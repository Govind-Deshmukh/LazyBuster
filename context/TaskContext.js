import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { Alert } from "react-native";
import * as storage from "../utils/storage";

// Create the context
export const TaskContext = createContext();

// Custom hook for using the task context
export const useTaskContext = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streakCount, setStreakCount] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);

  // Load saved tasks on component mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await storage.getTasks();
        if (savedTasks) setTasks(savedTasks);

        const streak = await storage.getStreak();
        if (streak) setStreakCount(streak.count);

        const lastDate = await storage.getLastCompletedDate();
        if (lastDate) setLastCompletedDate(new Date(lastDate));

        setLoading(false);
      } catch (error) {
        console.error("Failed to load tasks:", error);
        // Initialize with empty data on error
        setTasks([]);
        setStreakCount(0);
        setLastCompletedDate(null);
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Update storage whenever tasks change
  useEffect(() => {
    if (!loading) {
      storage.saveTasks(tasks);
      // Move the streak update logic here to avoid circular dependencies
      updateStreakCount();
    }
  }, [tasks, loading]); // removed streakCount from dependencies

  // Check and update streak - moved to a separate function
  const updateStreakCount = useCallback(() => {
    if (loading) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedTodayTasks = tasks.filter(
      (task) =>
        task.completed &&
        new Date(task.completedAt).setHours(0, 0, 0, 0) === today.getTime()
    );

    // If completed tasks today
    if (completedTodayTasks.length > 0) {
      if (!lastCompletedDate) {
        // First time completing tasks
        setStreakCount(1);
        setLastCompletedDate(today);
        storage.saveStreak({ count: 1 });
        storage.saveLastCompletedDate(today.toISOString());
      } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const lastDate = new Date(lastCompletedDate);
        lastDate.setHours(0, 0, 0, 0);

        if (lastDate.getTime() === yesterday.getTime()) {
          // Consecutive day
          const newStreakCount = streakCount + 1;
          setStreakCount(newStreakCount);
          setLastCompletedDate(today);
          storage.saveStreak({ count: newStreakCount });
          storage.saveLastCompletedDate(today.toISOString());
        } else if (lastDate.getTime() < yesterday.getTime()) {
          // Broke the streak
          setStreakCount(1);
          setLastCompletedDate(today);
          storage.saveStreak({ count: 1 });
          storage.saveLastCompletedDate(today.toISOString());
        }
        // If lastDate is today, we don't need to update anything
      }
    }
  }, [tasks, loading, lastCompletedDate, streakCount]);

  // Add a new task
  const addTask = (task) => {
    const newTask = {
      id: Date.now().toString(),
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
      dueDate: task.dueDate || null,
      isRecurring: task.isRecurring || false,
      recurringType: task.recurringType || null, // 'daily', 'weekly', 'monthly'
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      timeSpent: 0, // time spent in minutes
      category: task.category || "general",
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    return newTask;
  };

  // Update an existing task
  const updateTask = (taskId, updatedFields) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updatedFields } : task
      )
    );
  };

  // Mark a task as complete
  const completeTask = (taskId) => {
    setTasks((prevTasks) => {
      const newTasks = prevTasks.map((task) => {
        if (task.id === taskId) {
          const completedTask = {
            ...task,
            completed: true,
            completedAt: new Date().toISOString(),
          };
          return completedTask;
        }
        return task;
      });

      // For recurring tasks, add the next instance separately
      const task = prevTasks.find((t) => t.id === taskId);
      if (task && task.isRecurring) {
        const nextDueDate = getNextRecurringDate(
          task.dueDate,
          task.recurringType
        );

        if (nextDueDate) {
          const newRecurringTask = {
            ...task,
            id: (Date.now() + 1).toString(), // Ensure unique ID
            completed: false,
            completedAt: null,
            dueDate: nextDueDate.toISOString(),
            createdAt: new Date().toISOString(),
            timeSpent: 0,
          };
          return [...newTasks, newRecurringTask];
        }
      }
      return newTasks;
    });
  };

  // Helper function to calculate next date for recurring tasks
  const getNextRecurringDate = (currentDueDate, recurringType) => {
    if (!currentDueDate || !recurringType) return null;

    const dueDate = new Date(currentDueDate);
    const nextDate = new Date(dueDate);

    switch (recurringType) {
      case "daily":
        nextDate.setDate(dueDate.getDate() + 1);
        break;
      case "weekly":
        nextDate.setDate(dueDate.getDate() + 7);
        break;
      case "monthly":
        nextDate.setMonth(dueDate.getMonth() + 1);
        break;
      default:
        return null;
    }

    return nextDate;
  };

  // Delete a task
  const deleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  // Update time spent on a task
  const updateTaskTime = (taskId, minutes) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, timeSpent: (task.timeSpent || 0) + minutes }
          : task
      )
    );
  };

  // Get tasks due today - memoized to avoid recalculation on every render
  const getTasksDueToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (!task.dueDate || task.completed) return false;

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      return dueDate.getTime() === today.getTime();
    });
  }, [tasks]);

  // Get overdue tasks - memoized
  const getOverdueTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (!task.dueDate || task.completed) return false;

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      return dueDate.getTime() < today.getTime();
    });
  }, [tasks]);

  // Get tasks by priority - memoized
  const getTasksByPriority = useCallback(
    (priority) => {
      return tasks.filter(
        (task) => !task.completed && task.priority === priority
      );
    },
    [tasks]
  );

  // Calculate completion rate for a given time period - memoized
  const getCompletionRate = useCallback(
    (days = 7) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const tasksInPeriod = tasks.filter((task) => {
        const createdAt = new Date(task.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });

      if (tasksInPeriod.length === 0) return 0;

      const completedTasks = tasksInPeriod.filter((task) => task.completed);
      return (completedTasks.length / tasksInPeriod.length) * 100;
    },
    [tasks]
  );

  // Get tasks completed today - new helper function
  const getTasksCompletedToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (!task.completed || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
  }, [tasks]);

  // Get the reality check status - memoized
  const getRealityCheck = useCallback(() => {
    const overdueTasks = getOverdueTasks();
    const todayTasks = getTasksDueToday();
    const pendingHighPriorityTasks = getTasksByPriority("high");

    let message = "";
    let severity = "normal";

    if (overdueTasks.length > 3) {
      message = `You have ${overdueTasks.length} overdue tasks! Time for a serious catch-up session.`;
      severity = "high";
    } else if (pendingHighPriorityTasks.length > 2) {
      message = `You have ${pendingHighPriorityTasks.length} high priority tasks pending. Focus on these first!`;
      severity = "medium";
    } else if (todayTasks.length > 0) {
      message = `You have ${todayTasks.length} tasks due today. Make sure to complete them!`;
      severity = "normal";
    } else {
      message = "You're on track! Keep up the good work.";
      severity = "good";
    }

    return { message, severity };
  }, [getOverdueTasks, getTasksDueToday, getTasksByPriority]);

  const value = {
    tasks,
    loading,
    streakCount,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    updateTaskTime,
    getTasksDueToday,
    getOverdueTasks,
    getTasksByPriority,
    getCompletionRate,
    getRealityCheck,
    getTasksCompletedToday,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
