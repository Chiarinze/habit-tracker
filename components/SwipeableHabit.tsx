import { Habit } from "@/types/database.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Text } from "react-native-paper";
import { HabitCard } from "./HabitCard";

interface SwipeableHabitProps {
  habit: Habit;
  isCompleted: boolean;
  onDelete: (id: string, title: string) => void;
  onComplete: (id: string) => void;
}

export function SwipeableHabit({
  habit,
  isCompleted,
  onDelete,
  onComplete,
}: SwipeableHabitProps) {
  const swipeableRef = useRef<Swipeable | null>(null);

  const renderRightActions = () => (
    <View style={styles.swipeActionRight}>
      {isCompleted ? (
        <Text style={{ color: "#fff" }}>Completed!</Text>
      ) : (
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={32}
          color={"#fff"}
        />
      )}
    </View>
  );

  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={32}
        color={"#fff"}
      />
    </View>
  );

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      onDelete(habit.id, habit.title);
    } else if (direction === 'right' && !isCompleted) {
      onComplete(habit.id);
    }
    swipeableRef.current?.close();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeComplete}
      // enabled={!isCompleted}
    >
      <HabitCard habit={habit} isCompleted={isCompleted} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#e53935",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#4caf50",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16,
  },
});