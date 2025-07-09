import { HabitsList } from "@/components/HabitsList";
import { useAuth } from "@/lib/auth-context";
import {
  useCompleteHabit,
  useDeleteHabit,
  useHabits,
  useTodayCompletions,
} from "@/lib/queries";
import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Text } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();

  const userId = user?.id ?? "";
  const { data: habits = [] } = useHabits(userId);
  const { data: completions = [] } = useTodayCompletions(userId);
  const { deleteHabitWithConfirmation } = useDeleteHabit();
  const completeHabit = useCompleteHabit();

  const completedHabits = completions.map((c) => c.habit_id);

  const handleDeleteHabit = (id: string, title: string) => {
    deleteHabitWithConfirmation(id, title);
  };

  const handleCompleteHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;
    try {
      const habit = habits?.find((h) => h.id === id);
      if (!habit) return;

      await completeHabit.mutateAsync({
        habitId: id,
        userId: userId,
        habit,
      });
    } catch (error) {
      console.error("Completion error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Today&apos;s Habits
        </Text>
        <Button mode="text" onPress={signOut} icon={"logout"}>
          Sign Out
        </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <HabitsList
          habits={habits}
          completedHabits={completedHabits}
          onDeleteHabit={handleDeleteHabit}
          onCompleteHabit={handleCompleteHabit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "black",
    fontWeight: "bold",
  },
});
