# LazyBuster

A productivity app designed to help overcome procrastination, stay focused, and achieve goals through effective task management, focus timers, and self-reflection.

## Overview

LazyBuster is a mobile application built with Expo and React Native that helps users who struggle with procrastination and staying on task. It combines task management with focus techniques, reality checks, and analytics to build better productivity habits.

The app works completely offline and client-side with no backend requirements, making it accessible anywhere and ensuring your productivity data stays private.

## Features

### Implemented Features

#### Task Management

- ✅ Create tasks with title, description, priority, category, and due date
- ✅ Mark tasks as complete with swipe actions
- ✅ Support for recurring tasks (daily, weekly, monthly)
- ✅ Task filtering and sorting by various criteria
- ✅ Task priority levels (high, medium, low)

#### Focus Timer (Pomodoro Technique)

- ✅ Customizable work and break sessions
- ✅ Track focus time statistics
- ✅ Associate focus sessions with specific tasks
- ✅ Visual progress indicators

#### Reality Check System

- ✅ Personalized reminders based on task status
- ✅ Motivational quotes and encouragement
- ✅ Streak tracking for consistent productivity
- ✅ Daily check-ins to maintain momentum

#### Journaling

- ✅ Daily reflection on accomplishments
- ✅ Guided prompts for self-reflection
- ✅ Historical record of productivity insights

#### Analytics & Insights

- ✅ Productivity score calculation
- ✅ Task completion charts
- ✅ Focus time tracking and visualization
- ✅ Personalized productivity recommendations

#### Additional Features

- ✅ Offline storage with AsyncStorage
- ✅ Clean, intuitive UI
- ✅ Light/dark mode support
- ✅ Local notifications for task reminders

### Features to Implement

#### Enhanced Task Management

- ⬜ Task import/export functionality
- ⬜ Task templates for common activities
- ⬜ Sub-tasks for breaking down complex tasks
- ⬜ Task tagging and advanced filtering
- ⬜ Task sharing and collaboration features

#### Advanced Focus Tools

- ⬜ Background ambient sounds for focus sessions
- ⬜ Website/app blocking during focus sessions
- ⬜ Advanced focus statistics and trends
- ⬜ Focus challenges and achievements

#### Improved Analytics

- ⬜ Weekly and monthly productivity reports
- ⬜ Productivity insights across different categories
- ⬜ Export of analytics data
- ⬜ AI-powered productivity recommendations

#### Enhanced User Experience

- ⬜ Custom themes and appearance options
- ⬜ Widgets for home screen access
- ⬜ Voice input for quick task creation
- ⬜ Improved accessibility features

## Technical Details

### Project Structure

```
LazyBuster/
├── app/
│   ├── addTask.js                # Task creation/editing screen
│   ├── _layout.js                # Root layout with providers
│   ├── +not-found.js             # 404 screen
│   └── (tabs)/                   # Main tab navigation
│       ├── index.js              # Home tab
│       ├── insights.js           # Analytics tab
│       ├── journal.js            # Journal tab
│       ├── _layout.js            # Tab navigation layout
│       ├── settings.js           # Settings tab
│       ├── tasks.js              # Tasks management tab
│       └── timer.js              # Focus timer tab
├── assets/                       # Images and fonts
├── components/                   # Reusable UI components
│   ├── FocusTimer.js             # Pomodoro timer component
│   ├── PriorityPicker.js         # Task priority selector
│   ├── ProgressBar.js            # Visual progress indicator
│   ├── RealityCheck.js           # Reality check popup
│   └── TaskItem.js               # Individual task item component
├── constants/                    # App constants
│   ├── colors.js                 # Color definitions
│   └── presets.js                # App presets and configurations
├── context/                      # React Context providers
│   ├── TaskContext.js            # Task management context
│   └── TimerContext.js           # Focus timer context
├── screens/                      # Screen components
├── utils/                        # Utility functions
│   ├── analytics.js              # Analytics processing
│   ├── notifications.js          # Local notifications
│   └── storage.js                # AsyncStorage management
```

### Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **UI Components**: Custom components with native elements
- **Notifications**: Expo Notifications
- **Styling**: StyleSheet API with custom theme system

## How It Works

### Task Management

The app uses TaskContext to manage all task-related operations. Tasks are stored locally using AsyncStorage and can be created, updated, completed, and deleted. The tasks include properties like priority, due date, category, and recurring settings.

Tasks can be filtered and sorted by various criteria, helping users focus on what matters most. Swiping actions provide quick ways to mark tasks as complete or delete them.

### Focus Timer

The Pomodoro technique is implemented through the TimerContext. Users can set custom durations for focus sessions and breaks, and the timer automatically cycles between them. The app tracks focus time statistics and allows users to associate focus sessions with specific tasks.

### Reality Checks

The RealityCheck component provides timely reminders based on the user's task status. It analyzes overdue tasks, high-priority items, and today's schedule to generate personalized "reality checks" that help users stay on track.

### Analytics

The InsightsScreen provides visualization of productivity data, helping users understand their patterns and improve their habits. It shows task completion rates, focus time statistics, and calculates an overall productivity score. The analytics engine also generates personalized recommendations based on the user's data.

### Storage System

All data is stored locally using AsyncStorage, with a robust utility layer (storage.js) that handles saving and retrieving data with proper error handling. This ensures data persistence even when the app is closed.

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/LazyBuster.git
cd LazyBuster
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npx expo start
```

4. Open the app on your device or emulator:
   - Scan the QR code with the Expo Go app on your device
   - Press 'a' to open on Android emulator
   - Press 'i' to open on iOS simulator

## Troubleshooting

### Common Issues

#### DateTimePicker Issues

If you encounter issues with the DateTimePicker component, it's a known limitation in Expo Go. The app implements a custom date picker solution to work around this.

#### Gesture Handler Errors

Make sure to wrap your app with `GestureHandlerRootView` in the root component to enable swipe actions.

#### Notification Limitations

Push notifications have limited functionality in Expo Go. For full notification support, use a development build.

### Resolving Issues

1. Clear the cache and restart:

```bash
npx expo start --clear
```

2. Ensure all dependencies are correctly installed:

```bash
npm install
```

3. Check for React Native version compatibility issues.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
