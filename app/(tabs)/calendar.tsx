import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import {
  useAllScheduledActivities,
  useDeleteScheduledActivity,
} from "@/lib/queries";
import Toast from "react-native-toast-message";

export default function CalendarScreen() {
  const { user } = useAuth();
  const theme = useTheme();

  // selected date defaults to today in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // fetch all activities for the user (used to render dots and the day's list)
  const {
    data: allActivities = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAllScheduledActivities(user?.id ?? "");

  // deletion hook (mutation)
  const deleteScheduled = useDeleteScheduledActivity();

  // prepare markedDates object for react-native-calendars
  const markedDates = React.useMemo(() => {
    const map: Record<
      string,
      {
        dots?: { color: string; key?: string }[];
        selected?: boolean;
        selectedColor?: string;
      }
    > = {};

    (allActivities || []).forEach((a: any) => {
      const date = a.scheduled_date;
      if (!date) return;
      if (!map[date]) {
        map[date] = { dots: [{ color: "#7c4dff", key: "activity" }] };
      } else {
        // avoid duplicate dot keys
        map[date].dots = map[date].dots || [];
      }
    });

    // mark currently selected date as selected (keeps a dot too)
    if (!map[selectedDate]) {
      map[selectedDate] = { selected: true, selectedColor: "#7c4dff" };
    } else {
      map[selectedDate].selected = true;
      map[selectedDate].selectedColor = "#7c4dff";
    }

    // adapt to react-native-calendars' marking type "multi-dot"
    const result: Record<string, any> = {};
    Object.keys(map).forEach((k) => {
      result[k] = map[k].dots
        ? {
            dots: map[k].dots,
            selected: !!map[k].selected,
            selectedColor: map[k].selectedColor,
          }
        : { selected: map[k].selected, selectedColor: map[k].selectedColor };
    });
    return result;
  }, [allActivities, selectedDate]);

  // list activities on selected date
  const activitiesForSelectedDate = (allActivities || []).filter(
    (a: any) => a.scheduled_date === selectedDate
  );

  const onRefresh = useCallback(() => {
    return refetch();
  }, [refetch]);

  const handleDelete = (activity: any) => {
    Alert.alert(
      "Delete Activity",
      `Are you sure you want to delete "${activity.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScheduled.mutateAsync({
                id: activity.id,
                user_id: activity.user_id,
                scheduled_date: activity.scheduled_date,
              });
              Toast.show({
                type: "success",
                text1: "Activity deleted",
              });
              refetch();
            } catch (err) {
              console.error("Delete failed", err);
              Toast.show({
                type: "error",
                text1: "Failed to delete activity",
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header — fixed */}
      <Text variant="headlineSmall" style={styles.header}>
        Calendar
      </Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isLoading}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Calendar
          // react-native-calendars day object type inferred; use dateString
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markingType={"multi-dot"}
          markedDates={markedDates}
        />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Activities for {selectedDate}
          </Text>

          {activitiesForSelectedDate.length === 0 ? (
            <Text style={styles.emptyText}>No activities for this date.</Text>
          ) : (
            activitiesForSelectedDate.map((act: any) => (
              <Card key={act.id} style={styles.card}>
                <Card.Content>
                  {act.description ? (
                    <Text style={styles.desc}>{act.description}</Text>
                  ) : null}
                  {act.scheduled_time ? (
                    <Text style={styles.time}>Time: {act.scheduled_time}</Text>
                  ) : null}

                  <View style={styles.cardActions}>
                    <Button
                      mode="text"
                      textColor={theme.colors.error}
                      onPress={() => handleDelete(act)}
                    >
                      Delete
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { fontWeight: "bold", margin: 16 },
  scrollContent: { padding: 12, paddingBottom: 60 },
  section: { marginTop: 18 },
  sectionTitle: { fontWeight: "bold", marginBottom: 8, color: "#7c4dff" },
  emptyText: { color: "#888", fontStyle: "italic" },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: "#fff" },
  title: { fontWeight: "bold" },
  desc: { color: "#666", marginTop: 6 },
  time: { color: "#7c4dff", marginTop: 6 },
  cardActions: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: { marginLeft: 8 },
});
