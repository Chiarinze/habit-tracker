import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import { supabase, TABLES } from "@/lib/supabase";

export default function StreaksScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [routines, setRoutines] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      try {
        const { data: rdata, error: rerr } = await supabase
          .from(TABLES.ROUTINES)
          .select("*")
          .eq("user_id", userId);

        if (rerr) throw rerr;
        setRoutines(rdata || []);

        const { data: cdata, error: cerr } = await supabase
          .from("routine_completions")
          .select("id, routine_id, completed_date")
          .eq("user_id", userId)
          .order("completed_date", { ascending: true });

        if (cerr) throw cerr;
        setCompletions(cdata || []);
      } catch (error) {
        console.error("Streaks fetch error:", error);
      }
    };

    fetch();
  }, [userId]);

  // helper: compute streaks for a given routine
  const getStreakData = (routineId: string) => {
    const rows = (completions || []).filter((c) => c.routine_id === routineId);

    if (!rows || rows.length === 0) return { streak: 0, bestStreak: 0, total: 0 };

    // convert to sorted array of date strings 'YYYY-MM-DD'
    const dates = rows.map((r) => r.completed_date).sort();

    let best = 0;
    let current = 1;
    let last = new Date(dates[0]);
    let total = dates.length;

    for (let i = 1; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const diffDays = Math.round((d.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        current++;
      } else if (diffDays > 1) {
        if (current > best) best = current;
        current = 1;
      }
      last = d;
    }
    if (current > best) best = current;

    // determine if streak continues today
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDateStr = dates[dates.length - 1];
    const streak = lastDateStr === todayStr ? current : 0;

    return { streak, bestStreak: best, total };
  };

  const routineStreaks = useMemo(
    () =>
      routines.map((r) => {
        const s = getStreakData(r.id);
        return { routine: r, ...s };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routines, completions]
  );

  const topThree = [...routineStreaks].sort((a, b) => b.bestStreak - a.bestStreak).slice(0, 3);

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Routine Streaks</Text>

      {topThree.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text style={styles.rankingTitle}>🏅 Top Streaks</Text>
          {topThree.map((it, idx) => (
            <View key={it.routine.id} style={styles.rankingRow}>
              <View style={[styles.rankingBadge, idx === 0 ? styles.badge1 : idx === 1 ? styles.badge2 : styles.badge3]}>
                <Text style={styles.rankingBadgeText}>{idx + 1}</Text>
              </View>
              <Text style={styles.rankingHabit}>{it.routine.title}</Text>
              <Text style={styles.rankingStreak}>{it.bestStreak}</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
        {routineStreaks.map((rs) => (
          <Card key={rs.routine.id} style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.habitTitle}>{rs.routine.title}</Text>
              <Text style={styles.habitDescription}>{rs.routine.description}</Text>
              <View style={styles.statsRow}>
                <Text>🔥 Current: {rs.streak}</Text>
                <Text>🏆 Best: {rs.bestStreak}</Text>
                <Text>✅ Total: {rs.total}</Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: { fontWeight: "bold", marginBottom: 8 },
  rankingContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  rankingTitle: { fontWeight: "700", color: "#7c4dff", marginBottom: 8 },
  rankingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  rankingBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 10, backgroundColor: "#e0e0e0" },
  badge1: { backgroundColor: "#ffd700" },
  badge2: { backgroundColor: "#c0c0c0" },
  badge3: { backgroundColor: "#cd7f32" },
  rankingBadgeText: { color: "#fff", fontWeight: "bold" },
  rankingHabit: { flex: 1, fontWeight: "600" },
  rankingStreak: { color: "#7c4dff", fontWeight: "700" },
  card: { marginVertical: 8, borderRadius: 12 },
  habitTitle: { fontWeight: "700" },
  habitDescription: { color: "#666", marginTop: 6 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
});
