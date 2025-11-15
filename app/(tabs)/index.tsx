// app/(tabs)/index.tsx
import React, { useCallback, useMemo } from "react";
import { StyleSheet, View, RefreshControl } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Text } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import {
  useTodayRoutines,
  useScheduledActivities,
  useCompleteRoutine,
  useCompleteScheduledActivity,
} from "@/lib/queries";
import { useToast } from "@/components/ToastProvider";
import { ActivityItem } from "@/components/ActivityItem";
import Toast from "react-native-toast-message";

export default function TodayScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const userId = user?.id ?? "";

  // Routines (with completed flag)
  const {
    data: routines = [],
    refetch: refetchRoutines,
    isFetching: routinesLoading,
  } = useTodayRoutines(userId);

  // Scheduled activities for today
  const today = new Date().toISOString().slice(0, 10);
  const {
    data: activities = [],
    refetch: refetchActivities,
    isFetching: activitiesLoading,
  } = useScheduledActivities(userId, today);

  const completeRoutine = useCompleteRoutine();
  const completeScheduled = useCompleteScheduledActivity();

  const refreshing = routinesLoading || activitiesLoading;

  const onRefresh = useCallback(() => {
    refetchRoutines();
    refetchActivities();
  }, [refetchActivities, refetchRoutines]);

  // split routines into pending/completed (service provides completed flag)
  const pendingRoutines = useMemo(
    () => routines.filter((r: any) => !r.completed),
    [routines]
  );
  const completedRoutines = useMemo(
    () => routines.filter((r: any) => !!r.completed),
    [routines]
  );

  // scheduled activities split
  const pendingActivities = activities.filter((a: any) => !a.is_completed);
  const completedActivities = activities.filter((a: any) => !!a.is_completed);

  const handleCompleteRoutine = async (id: string) => {
    if (!user) return;
    try {
      await completeRoutine.mutateAsync({ routineId: id, userId });
      Toast.show({
        type: "success",
        text1: "Routine completed",
      });
    } catch (error: any) {
      if ((error as any)?.code === "23505") {
        toast.show("Routine already completed today");
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to complete routine",
        });
      }
    }
  };

  const handleCompleteActivity = async (id: string) => {
    try {
      await completeScheduled.mutateAsync({ id });
      Toast.show({
        type: "success",
        text1: "Activity completed",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to complete activity",
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={styles.title}>
          Today&apos;s Activities
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Daily Routines
        </Text>

        {pendingRoutines.length === 0 ? (
          <Text style={styles.emptyText}>No pending routines for today.</Text>
        ) : (
          pendingRoutines.map((r: any) => (
            <ActivityItem
              key={r.id}
              id={r.id}
              title={r.title}
              description={r.description ?? undefined}
              isCompleted={!!r.completed}
              meta={r.category ? r.category.toUpperCase() : undefined}
              onComplete={handleCompleteRoutine}
            />
          ))
        )}

        {completedRoutines.length > 0 && (
          <>
            <Text
              variant="titleMedium"
              style={[styles.sectionHeader, { marginTop: 6 }]}
            >
              Completed Routines
            </Text>
            {completedRoutines.map((r: any) => (
              <ActivityItem
                key={r.id}
                id={r.id}
                title={r.title}
                description={r.description ?? undefined}
                isCompleted={true}
                meta={r.category ? r.category.toUpperCase() : undefined}
                onComplete={() => {}}
              />
            ))}
          </>
        )}

        <Text variant="titleMedium" style={styles.sectionHeader}>
          Scheduled Activities
        </Text>

        {pendingActivities.length === 0 ? (
          <Text style={styles.emptyText}>
            No scheduled activities for today.
          </Text>
        ) : (
          pendingActivities.map((a: any) => (
            <ActivityItem
              key={a.id}
              id={a.id}
              title={a.title}
              description={a.description ?? undefined}
              isCompleted={!!a.is_completed}
              meta={a.scheduled_time ? `At ${a.scheduled_time}` : undefined}
              onComplete={handleCompleteActivity}
            />
          ))
        )}

        {completedActivities.length > 0 && (
          <>
            <Text
              variant="titleMedium"
              style={[styles.sectionHeader, { marginTop: 6 }]}
            >
              Completed Activities
            </Text>
            {completedActivities.map((a: any) => (
              <ActivityItem
                key={a.id}
                id={a.id}
                title={a.title}
                description={a.description ?? undefined}
                isCompleted={true}
                meta={a.scheduled_time ? `At ${a.scheduled_time}` : undefined}
                onComplete={() => {}}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontWeight: "bold" },
  scrollContent: { paddingBottom: 80 },
  sectionHeader: {
    fontWeight: "bold",
    marginVertical: 10,
    fontSize: 16,
    color: "#7c4dff",
  },
  emptyText: { color: "#888", fontStyle: "italic", marginBottom: 8 },
});
