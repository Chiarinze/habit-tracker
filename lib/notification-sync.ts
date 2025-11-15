import { supabase } from "./supabase";
import { scheduleActivityReminders, scheduleRoutineReminder } from "./notifications";

export async function syncAllNotificationSchedules() {
  try {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    if (!userId) return;

    // 1. Fetch routines
    const { data: routines } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", userId);

    // 2. Sync routine daily reminders
    for (const r of routines || []) {
      if (r.reminder_time && !r.daily_notification_id) {
        const id = await scheduleRoutineReminder(r);
        if (id) {
          await supabase
            .from("routines")
            .update({ daily_notification_id: id })
            .eq("id", r.id);
        }
      }
    }

    // 3. Fetch upcoming scheduled activities
    const today = new Date().toISOString().slice(0, 10);

    const { data: activities } = await supabase
      .from("scheduled_activities")
      .select("*")
      .eq("user_id", userId)
      .gte("scheduled_date", today); // only future

    // 4. Sync activity reminders
    for (const a of activities || []) {
      const needsMorning = !a.morning_notification_id;
      const needsCustom = a.scheduled_time && !a.custom_notification_id;

      if (needsMorning || needsCustom) {
        const ids = await scheduleActivityReminders(
          a.title,
          a.scheduled_date,
          a.scheduled_time,
          a.reminder_offset_minutes ?? 60
        );

        await supabase
          .from("scheduled_activities")
          .update({
            morning_notification_id: ids.morningId,
            custom_notification_id: ids.customId,
          })
          .eq("id", a.id);
      }
    }
  } catch (err) {
    console.warn("⚠ Notification sync failed:", err);
  }
}
