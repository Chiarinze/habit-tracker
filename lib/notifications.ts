import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// PERMISSIONS + ANDROID CHANNEL
export async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === "granted";
  }
  return true;
}

export async function configureNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
}

// Helpers
function formatTimeDiff(msDiff: number) {
  // msDiff assumed positive (future). Return human-friendly string.
  const minutesTotal = Math.round(msDiff / 60000);
  if (minutesTotal < 1) return "less than a minute";

  if (minutesTotal < 60) {
    return `${minutesTotal} minute${minutesTotal === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  if (minutes === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${
    minutes === 1 ? "" : "s"
  }`;
}

// ROUTINE REMINDER — always daily, returns ID
export async function scheduleRoutineReminder(
  routine: Routine
): Promise<string | null> {
  try {
    if (!routine.reminder_time) return null;

    const [hour, minute] = routine.reminder_time.split(":").map(Number);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Routine Reminder",
        body: `It's time for "${routine.title}".`,
        data: { routineId: routine.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return id;
  } catch (err) {
    console.error("Routine reminder failed:", err);
    return null;
  }
}

// ACTIVITY REMINDERS — Morning + Custom
// Returns: { morningId, customId }
export async function scheduleActivityReminders(
  title: string,
  scheduled_date: string, // YYYY-MM-DD
  scheduled_time: string | null, // HH:MM or null
  offset_minutes: number
): Promise<{ morningId: string | null; customId: string | null }> {
  // explicitly type result so it can hold string IDs later
  const result: { morningId: string | null; customId: string | null } = {
    morningId: null,
    customId: null,
  };

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return result;

    const now = Date.now();

    // 1. Morning reminder — 6 AM
    const morning = new Date(`${scheduled_date}T06:00:00`);
    const secondsUntilMorning = Math.floor((morning.getTime() - now) / 1000);

    if (secondsUntilMorning > 0) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌅 Morning Reminder",
          body: `You have "${title}" scheduled today.`,
          data: { type: "morning_reminder", title },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilMorning,
        },
      });

      result.morningId = id;
    }

    // 2. Custom reminder (offset X minutes before activity)
    if (scheduled_time) {
      // build activity Date object from scheduled_date + scheduled_time
      const activityDateIso = `${scheduled_date}T${scheduled_time}:00`;
      const activityDate = new Date(activityDateIso);
      const triggerTimeMs = activityDate.getTime() - offset_minutes * 60_000;
      const msUntilCustom = triggerTimeMs - now;
      const secondsUntilCustom = Math.floor(msUntilCustom / 1000);

      if (secondsUntilCustom > 0) {
        // human-friendly delta until reminder
        const humanDelta = formatTimeDiff(msUntilCustom);

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "⏰ Upcoming Activity",
            // include how long until the reminder in the message
            body: `"${title}" starts in ${humanDelta}.`,
            data: {
              type: "custom_reminder",
              title,
              scheduled_date,
              scheduled_time,
              offset_minutes,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntilCustom,
          },
        });

        result.customId = id;
      } else {
        // custom reminder time is in the past; skip
        // (no scheduling)
      }
    }

    return result;
  } catch (err) {
    console.error("Activity reminder failed:", err);
    return result;
  }
}

// Cancel ALL notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("cancelAllNotifications failed:", error);
  }
}

// Cancel 1 or 2 specific notifications
export async function cancelActivityNotifications(
  morningId?: string | null,
  customId?: string | null
) {
  try {
    if (morningId) {
      await Notifications.cancelScheduledNotificationAsync(morningId);
    }
    if (customId) {
      await Notifications.cancelScheduledNotificationAsync(customId);
    }
  } catch (err) {
    console.warn("Failed to cancel specific notifications:", err);
  }
}
