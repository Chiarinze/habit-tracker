import React, { useRef } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ActivityItemProps {
  id: string;
  title: string;
  description?: string | null;
  isCompleted?: boolean;
  onComplete: (id: string) => void;
  // optional small meta (time / category)
  meta?: string | null;
}

export function ActivityItem({
  id,
  title,
  description,
  isCompleted = false,
  onComplete,
  meta,
}: ActivityItemProps) {
  const swipeRef = useRef<Swipeable | null>(null);

  const renderRightActions = () => (
    <View style={styles.rightAction}>
      <MaterialCommunityIcons name="check-circle" size={30} color="#fff" />
    </View>
  );

  const handleOpen = (direction: "left" | "right") => {
    if (direction === "right" && !isCompleted) {
      onComplete(id);
    }
    swipeRef.current?.close();
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      enableTrackpadTwoFingerGesture
      onSwipeableOpen={handleOpen}
      containerStyle={{ opacity: isCompleted ? 0.6 : 1 }}
      // disable swiping if already completed
      enabled={!isCompleted}
    >
      <Card style={[styles.card, isCompleted && styles.completedCard]}>
        <Card.Content>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {description}
                </Text>
              ) : null}
              {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            </View>
            {isCompleted && (
              <TouchableOpacity>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={26}
                  color="#4caf50"
                />
              </TouchableOpacity>
            )}
          </View>
        </Card.Content>
      </Card>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  completedCard: {
    backgroundColor: "#f2f2f2",
  },
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontWeight: "700" },
  desc: { color: "#666", marginTop: 6 },
  meta: { marginTop: 6, color: "#7c4dff", fontSize: 12 },
  rightAction: {
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    marginBottom: 12,
    borderRadius: 12,
  },
});
