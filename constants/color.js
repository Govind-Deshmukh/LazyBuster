// Color palette for the LazyBuster app
const Colors = {
  // Primary brand colors
  primary: "#4F46E5", // Indigo for primary actions
  primaryDark: "#4338CA",
  primaryLight: "#818CF8",

  // Secondary colors
  secondary: "#FB7185", // Rose color as secondary
  secondaryDark: "#E11D48",
  secondaryLight: "#FDA4AF",

  // Grays
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // System colors
  success: "#10B981", // Green
  successLight: "#A7F3D0",
  warning: "#F59E0B", // Amber
  warningLight: "#FCD34D",
  error: "#EF4444", // Red
  errorLight: "#FCA5A5",
  info: "#3B82F6", // Blue
  infoLight: "#93C5FD",

  // Priority colors
  priorityHigh: "#EF4444", // Red
  priorityMedium: "#F59E0B", // Amber
  priorityLow: "#10B981", // Green

  // Streak colors
  streakActive: "#F59E0B", // Amber
  streakInactive: "#E5E7EB", // Gray

  // Reality check severity colors
  realityHigh: "#EF4444", // Red
  realityMedium: "#F59E0B", // Amber
  realityNormal: "#3B82F6", // Blue
  realityGood: "#10B981", // Green

  // Timer colors
  timerPomodoro: "#EF4444", // Red
  timerShortBreak: "#10B981", // Green
  timerLongBreak: "#3B82F6", // Blue

  // UI Colors
  background: "#FFFFFF",
  backgroundDark: "#111827",
  card: "#FFFFFF",
  cardDark: "#1F2937",
  text: "#111827",
  textDark: "#F9FAFB",
  border: "#E5E7EB",
  borderDark: "#4B5563",

  // Chart colors
  chart: [
    "#4F46E5", // Indigo
    "#FB7185", // Rose
    "#10B981", // Green
    "#F59E0B", // Amber
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
    "#EC4899", // Pink
  ],
};

// Dark mode colors
const DarkColors = {
  ...Colors,
  background: Colors.backgroundDark,
  card: Colors.cardDark,
  text: Colors.textDark,
  border: Colors.borderDark,
};

// Get the right color set based on dark mode
export const getColors = (isDarkMode = false) => {
  return isDarkMode ? DarkColors : Colors;
};

export default Colors;
