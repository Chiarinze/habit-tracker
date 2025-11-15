// app/(tabs)/daily-routines.tsx
import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Text, Card, Button, useTheme } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import { useRoutines, useDeleteRoutine } from "@/lib/queries";
// import { useToast } from "@/components/ToastProvider";

export default function DailyRoutinesScreen() {
  const { user } = useAuth();
  // const toast = useToast();
  const theme = useTheme();
  const userId = user?.id ?? "";

  const { data: routines = [], refetch, isFetching } = useRoutines(userId);
  const deleteRoutine = useDeleteRoutine();

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      uncategorized: [],
    };
    (routines || []).forEach((r: any) => {
      if (!r.category) map.uncategorized.push(r);
      else map[r.category]?.push(r);
    });
    return map;
  }, [routines]);

  const handleDelete = (id: string, titleText: string) => {
    deleteRoutine.deleteRoutineWithConfirmation(id, titleText);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Daily Routines
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {["morning", "afternoon", "evening", "uncategorized"].map((section) => {
          const items =
            section === "uncategorized"
              ? grouped.uncategorized
              : grouped[section];
          if (!items || items.length === 0) return null;
          return (
            <View key={section} style={{ marginBottom: 12 }}>
              <Text style={styles.sectionHeader}>
                {section === "uncategorized"
                  ? "Other"
                  : section.charAt(0).toUpperCase() + section.slice(1)}
              </Text>
              {items.map((r: any) => (
                <Card key={r.id} style={styles.card}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.title}>
                      {r.title}
                    </Text>
                    {r.description ? (
                      <Text style={styles.desc}>{r.description}</Text>
                    ) : null}
                    <View style={styles.cardActions}>
                      <Button
                        mode="text"
                        textColor={theme.colors.error}
                        onPress={() => handleDelete(r.id, r.title)}
                      >
                        Delete
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  header: { fontWeight: "bold", marginBottom: 12 },
  sectionHeader: {
    textTransform: "capitalize",
    fontWeight: "700",
    marginBottom: 8,
    color: "#7c4dff",
  },
  card: { marginBottom: 10, borderRadius: 12 },
  title: { fontWeight: "700" },
  desc: { color: "#666" },
  cardActions: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  form: { marginTop: 12 },
  input: { marginBottom: 8 },
});
