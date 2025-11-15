import * as Notifications from "expo-notifications";

// Basic config (notifications won’t work in Expo Go, but this keeps it ready)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Schedule a reminder for a given routine
export async function scheduleRoutineReminder(routine: Routine) {
  if (!routine.reminder_time) return;

  try {
    const parts = routine.reminder_time.split(':');
    if (parts.length < 2) {
      console.warn(`Invalid reminder_time format for ${routine.title}`);
      return;
    }

    const [hour, minute] = parts.map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Routine Reminder',
        body: `It's time for your "${routine.title}" routine.`,
        data: { routineId: routine.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log(`Scheduled daily reminder for ${routine.title} at ${routine.reminder_time}`);
  } catch (error) {
    console.error('Error scheduling routine reminder:', error);
  }
}

// Cancel all reminders (e.g., when user logs out)
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
