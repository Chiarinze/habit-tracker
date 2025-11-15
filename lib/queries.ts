import { Alert } from "react-native";
import { supabase, TABLES } from "./supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelActivityNotifications,
  scheduleActivityReminders,
  scheduleRoutineReminder,
} from "./notifications";

// Type helpers
export type Nullable<T> = T | null | undefined;

export const queryKeys = {
  habits: (userId: string | undefined) => ["habits", userId] as const,
  completions: (userId: string | undefined) => ["completions", userId] as const,
  routines: (userId: string | undefined) => ["routines", userId] as const,
  todayRoutines: (userId: string | undefined) =>
    ["todayRoutines", userId] as const,
  scheduledActivities: (userId: string | undefined, date?: string) =>
    ["scheduledActivities", userId, date] as const,
};

// Fetch habits
export const useHabits = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.habits(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.HABITS)
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Fetch today's completions
export const useTodayCompletions = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.completions(userId),
    queryFn: async () => {
      if (!userId) return [];

      const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

      const { data, error } = await supabase
        .from(TABLES.COMPLETIONS)
        .select("*")
        .eq("user_id", userId)
        .eq("completed_date", today);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitData: {
      user_id: string;
      title: string;
      description: string;
      frequency: string;
    }) => {
      const { data, error } = await supabase
        .from(TABLES.HABITS)
        .insert({
          ...habitData,
          streak_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      const userId = (variables as any).user_id;
      queryClient.invalidateQueries({ queryKey: queryKeys.habits(userId) });
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  const deleteHabitMutation = useMutation({
    mutationFn: async ({
      habitId,
      userId,
    }: {
      habitId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from(TABLES.HABITS)
        .delete()
        .eq("id", habitId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      const userId = (variables as any).userId;
      queryClient.invalidateQueries({ queryKey: queryKeys.habits(userId) });
    },
  });

  const deleteHabitWithConfirmation = (
    habitId: string,
    habitTitle: string,
    userId: string
  ) => {
    return new Promise<void>((resolve, reject) => {
      Alert.alert(
        "Delete Habit",
        `Are you sure you want to delete ${habitTitle}? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => reject(new Error("Cancelled")),
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteHabitMutation.mutateAsync({ habitId, userId });
                resolve();
              } catch (error) {
                reject(error);
              }
            },
          },
        ],
        { cancelable: true }
      );
    });
  };

  return {
    ...deleteHabitMutation,
    deleteHabitWithConfirmation,
  };
};

export const useCompleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      userId,
      habit,
    }: {
      habitId: string;
      userId: string;
      habit: { streak_count: number };
    }) => {
      const currentDate = new Date().toISOString();

      // Create completion record
      const { error: insertError } = await supabase
        .from(TABLES.COMPLETIONS)
        .insert({
          habit_id: habitId,
          user_id: userId,
          completed_at: currentDate,
        });

      if (insertError) {
        // Propagate the error for the caller to handle (unique-constraint may trigger here)
        throw insertError;
      }

      // Update habit streak
      const { error: updateError } = await supabase
        .from(TABLES.HABITS)
        .update({
          streak_count: habit.streak_count + 1,
          last_completed: currentDate,
        })
        .eq("id", habitId);

      if (updateError) throw updateError;
    },
    onSuccess: (_data, variables) => {
      const userId = (variables as any).userId;
      queryClient.invalidateQueries({ queryKey: queryKeys.habits(userId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.completions(userId),
      });
    },
  });
};

export const useRoutines = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.routines(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.ROUTINES)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      title: string;
      description?: string;
      category?: string | null;
      reminder_time?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("routines")
        .insert({
          ...input,
          description: input.description || undefined,
          category: input.category || null,
          reminder_time: input.reminder_time || null,
        })
        .select()
        .single();

      if (error) throw error;

      /* ➜ Automatically schedule reminder */
      if (data.reminder_time) {
        const id = await scheduleRoutineReminder(data);
        if (id) {
          await supabase
            .from("routines")
            .update({ daily_notification_id: id })
            .eq("id", data.id);
        }
      }

      return data;
    },

    onSuccess: (routine) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routines(routine.user_id),
      });
    },
  });
};

export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();

  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.ROUTINES)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routines(undefined),
      });
    },
  });

  const deleteRoutineWithConfirmation = (id: string, title: string) => {
    Alert.alert(
      "Delete Routine",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteRoutineMutation.mutate(id),
        },
      ],
      { cancelable: true }
    );
  };

  return { ...deleteRoutineMutation, deleteRoutineWithConfirmation };
};

export const useCompleteRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routineId,
      userId,
    }: {
      routineId: string;
      userId: string;
    }) => {
      const { error } = await supabase.from(TABLES.ROUTINE_COMPLETIONS).insert({
        routine_id: routineId,
        user_id: userId,
      });

      // Handle duplicate completion gracefully
      if (error) {
        if ((error as any).code === "23505") {
          // Already completed today — just ignore silently
          console.log("Routine already marked complete for today");
          return;
        }
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      const userId = (variables as any).userId;
      queryClient.invalidateQueries({
        queryKey: queryKeys.todayRoutines(userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.routines(userId) });
    },
  });
};

export const useTodayRoutines = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.todayRoutines(userId),
    queryFn: async () => {
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().slice(0, 10);

      // Fetch all routines
      const { data: routines, error: routinesError } = await supabase
        .from(TABLES.ROUTINES)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (routinesError) throw routinesError;

      // Fetch all completions for today
      const { data: completions, error: completionsError } = await supabase
        .from(TABLES.ROUTINE_COMPLETIONS)
        .select("routine_id, completed_date")
        .eq("user_id", userId)
        .eq("completed_date", today);

      if (completionsError) throw completionsError;

      const completedIds = (completions || []).map((c: any) => c.routine_id);

      // Mark routines as completed or not
      const routinesWithStatus = (routines || []).map((r: any) => ({
        ...r,
        completed: completedIds.includes(r.id),
      }));

      return routinesWithStatus;
    },
    enabled: !!userId,
  });
};


export const useScheduledActivities = (userId: string, date: string) => {
  return useQuery({
    queryKey: queryKeys.scheduledActivities(userId, date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_activities")
        .select("*")
        .eq("user_id", userId)
        .eq("scheduled_date", date)
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!date,
  });
};

export const useCreateScheduledActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      title: string;
      description?: string;
      scheduled_date: string;
      scheduled_time?: string;
      reminder_offset_minutes: number;
    }) => {
      // 1 create DB row first
      const { data, error } = await supabase
        .from("scheduled_activities")
        .insert({
          user_id: input.user_id,
          title: input.title,
          description: input.description || undefined,
          scheduled_date: input.scheduled_date,
          scheduled_time: input.scheduled_time || null,
          reminder_offset_minutes: input.reminder_offset_minutes,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to create scheduled activity");

      // 2 schedule notifications (local) and collect IDs
      try {
        const ids = await scheduleActivityReminders(
          input.title,
          input.scheduled_date,
          input.scheduled_time ?? null,
          input.reminder_offset_minutes
        );

        // 3 persist notification IDs on the row (if any)
        await supabase
          .from("scheduled_activities")
          .update({
            morning_notification_id: ids.morningId ?? null,
            custom_notification_id: ids.customId ?? null,
          })
          .eq("id", data.id);
      } catch (err) {
        // scheduling failed — warn but we still return the DB row so user can retry scheduling later if needed
        console.warn("Failed to schedule notifications for activity:", err);
      }

      return data;
    },

    onSuccess: (data, variables) => {
      // invalidate the per-day query and any listing queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduledActivities((variables as any).user_id, (variables as any).scheduled_date),
      });
      queryClient.invalidateQueries({ queryKey: ["scheduledActivitiesAll", (variables as any).user_id] });
    },
  });
};

export const useCompleteScheduledActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("scheduled_activities")
        .update({ is_completed: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledActivities"] });
    },
  });
};

export const useAllScheduledActivities = (userId: string) => {
  return useQuery({
    queryKey: ["scheduledActivitiesAll", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("scheduled_activities")
        .select("*")
        .eq("user_id", userId)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useDeleteScheduledActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      user_id,
      scheduled_date,
    }: {
      id: string;
      user_id: string;
      scheduled_date?: string;
    }) => {
      // 1 fetch notification ids stored on the row
      const { data: notifRow, error: selectError } = await supabase
        .from("scheduled_activities")
        .select("morning_notification_id, custom_notification_id")
        .eq("id", id)
        .single();

      if (selectError) {
        // If the row was already gone, treat as success (but surface error if needed)
        throw selectError;
      }

      // 2 cancel notifications if present
      try {
        await cancelActivityNotifications(
          (notifRow as any)?.morning_notification_id ?? null,
          (notifRow as any)?.custom_notification_id ?? null
        );
      } catch (err) {
        // don't block deletion if cancellation fails — log and continue
        console.warn("Failed to cancel notifications for activity", id, err);
      }

      // 3 delete the row
      const { error: deleteError } = await supabase
        .from("scheduled_activities")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
    },
    onSuccess: (_data, variables) => {
      const userId = (variables as any).user_id;
      const scheduledDate = (variables as any).scheduled_date;

      // Invalidate both the per-day query and the all-schedules query so UI updates
      if (userId && scheduledDate) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.scheduledActivities(userId, scheduledDate),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["scheduledActivitiesAll", userId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduledActivities(userId) });
    },
  });
};
