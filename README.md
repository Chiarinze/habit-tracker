# Habit Tracker

A lightweight productivity app built with **React Native**, **Expo**, and **Supabase**.  
It helps users manage daily routines, schedule activities, track streaks, and receive reminders.

---

## ✨ Features

- 📋 Create and manage **Daily Routines** (morning, afternoon, evening)
- 📅 Add **Scheduled Activities** with optional time
- 🏠 **Today Screen** showing all routines + activities due today
- ✅ **Swipe Right to Complete** tasks (cannot be done twice per day)
- 🔥 **Routine Streak Tracking** with best streak history
- 📆 **Calendar View** with activity markers and delete support
- 🔔 **Local Notifications**  
  - 6 AM morning reminder  
  - Custom reminder before scheduled time
- ➕ **Add Screen** for adding routines or schedules
- 💬 **Toast Messages** using `react-native-toast-message`
- ☁️ Supabase + React Query for data, caching, and sync

---

## 🛠️ Tech Stack

- **Expo / React Native** - Mobile framework
- **Expo Router** - File-based routing
- **Supabase** - Backend and database
- **React Query** - Data fetching and caching
- **Expo Notifications** - Push notifications
- **React Native Calendars** - Calendar component
- **React Native Toast Message** - Toast notifications

---

## 🚀 Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Add environment variables

Create a `.env` file or use Expo's built-in env system:

```env
EXPO_PUBLIC_SUPABASE_URL=your-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### 3. Run the app

```sh
npx expo start
```

---

## 📝 Notes

- Notifications only work on real devices.
- Scheduled reminders automatically sync when the app starts.
- Streaks apply to routines only, not scheduled activities.

---

## 📄 License

This project is for personal use and development.