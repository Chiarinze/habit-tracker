import { Alert } from 'react-native';
import { supabase, TABLES } from './supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query keys
export const queryKeys = {
  habits: ['habits'] as const,
  completions: ['completions'] as const,
};

// Fetch habits
export const useHabits = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.habits,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.HABITS)
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Fetch today's completions
export const useTodayCompletions = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.completions,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from(TABLES.COMPLETIONS)
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', today.toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Create habit mutation
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
          last_completed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
    },
  });
};

// Delete habit mutation
export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from(TABLES.HABITS)
        .delete()
        .eq('id', habitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
    },
  });

  const deleteHabitWithConfirmation = (habitId: string, habitTitle: string) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete ${habitTitle}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHabitMutation.mutate(habitId),
        },
      ],
      { cancelable: true }
    );
  };

  return {
    ...deleteHabitMutation,
    deleteHabitWithConfirmation,
  };
};

// Complete habit mutation
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
      habit: any;
    }) => {
      const currentDate = new Date().toISOString();

      // Create completion record
      await supabase.from(TABLES.COMPLETIONS).insert({
        habit_id: habitId,
        user_id: userId,
        completed_at: currentDate,
      });

      // Update habit streak
      await supabase
        .from(TABLES.HABITS)
        .update({
          streak_count: habit.streak_count + 1,
          last_completed: currentDate,
        })
        .eq('id', habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
      queryClient.invalidateQueries({ queryKey: queryKeys.completions });
    },
  });
};