// Preset values and options for the LazyBuster app

// Task priority levels
export const PRIORITY_LEVELS = [
  { id: "high", label: "High", color: "#EF4444" },
  { id: "medium", label: "Medium", color: "#F59E0B" },
  { id: "low", label: "Low", color: "#10B981" },
];

// Task categories
export const TASK_CATEGORIES = [
  { id: "work", label: "Work" },
  { id: "personal", label: "Personal" },
  { id: "health", label: "Health" },
  { id: "education", label: "Education" },
  { id: "financial", label: "Financial" },
  { id: "social", label: "Social" },
  { id: "other", label: "Other" },
];

// Recurring task options
export const RECURRING_OPTIONS = [
  { id: "none", label: "One-time" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

// Timer presets (in minutes)
export const TIMER_PRESETS = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
};

// Reality check frequency options
export const REALITY_CHECK_FREQUENCIES = [
  { id: "off", label: "Off" },
  { id: "daily", label: "Daily" },
  { id: "hourly", label: "Hourly" },
];

// Journal prompts
export const JOURNAL_PROMPTS = [
  "What was your biggest accomplishment today?",
  "What could you have done better today?",
  "What are you grateful for today?",
  "What is your main focus for tomorrow?",
  "What distracted you the most today?",
  "What new habit would help you be more productive?",
  "What task did you procrastinate on today and why?",
  "How could you better manage your time tomorrow?",
  "Rate your productivity today from 1-10 and explain why.",
  "What is one thing you learned today?",
];

// Motivational quotes for reality checks
export const MOTIVATIONAL_QUOTES = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "It does not matter how slowly you go as long as you do not stop. - Confucius",
  "Productivity is never an accident. It is always the result of a commitment to excellence. - Paul J. Meyer",
  "Action is the foundational key to all success. - Pablo Picasso",
  "Don't count the days, make the days count. - Muhammad Ali",
  "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
  "You don't have to be great to start, but you have to start to be great. - Zig Ziglar",
  "The secret of getting ahead is getting started. - Mark Twain",
  "Motivation is what gets you started. Habit is what keeps you going. - Jim Ryun",
  "The difference between ordinary and extraordinary is that little extra. - Jimmy Johnson",
  "Productivity is being able to do things that you were never able to do before. - Franz Kafka",
  "Focus on being productive instead of busy. - Tim Ferriss",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work. - Stephen King",
];

// Default app settings
export const DEFAULT_APP_SETTINGS = {
  darkMode: false,
  notificationsEnabled: true,
  realityCheckFrequency: "daily",
  autoStartBreaks: false,
  soundEnabled: true,
  streakReminderEnabled: true,
  reminderTime: {
    hour: 20,
    minute: 0,
  },
};

// Task sort options
export const TASK_SORT_OPTIONS = [
  { id: "dueDate", label: "Due Date" },
  { id: "priority", label: "Priority" },
  { id: "createdAt", label: "Created Date" },
  { id: "title", label: "Alphabetical" },
];

// Task filter options
export const TASK_FILTER_OPTIONS = [
  { id: "all", label: "All Tasks" },
  { id: "today", label: "Due Today" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
  { id: "high", label: "High Priority" },
];

// Reality check severity levels
export const REALITY_CHECK_SEVERITY = {
  high: {
    color: "#EF4444",
    icon: "alert-circle",
  },
  medium: {
    color: "#F59E0B",
    icon: "alert-triangle",
  },
  normal: {
    color: "#3B82F6",
    icon: "information-circle",
  },
  good: {
    color: "#10B981",
    icon: "checkmark-circle",
  },
};
