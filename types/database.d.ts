declare interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string;
  frequency: string;
  streak_count: number;
  last_completed?: string | null;
  created_at: string;
}

declare interface HabitCompletion {
  id?: string;
  habit_id: string;
  user_id?: string;
  completed_at?: string;
  completed_date: string;
  created_at?: string | null;
}

declare interface Routine {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category?: "morning" | "afternoon" | "evening" | null;
  reminder_time?: string | null;
  created_at: string;
  updated_at: string;
}

declare interface RoutineWithStatus extends Routine {
  completed?: boolean;
}

declare interface ScheduledActivity {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string | null; // HH:MM
  morning_notification_id?: string | null;
  custom_notification_id?: string | null;
  reminder_offset_minutes?: number | null;
  is_completed?: boolean;
  created_at?: string;
}

declare interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp?: number;
}
