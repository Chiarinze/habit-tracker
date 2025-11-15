import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Text, Card } from "react-native-paper";
import { useRouter } from "expo-router";

export default function AddSelector() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Add Item
      </Text>

      <Card style={styles.card} onPress={() => router.push("/(add)/routine")}>
        <Card.Content>
          <Text variant="titleMedium">Add Routine</Text>
          <Text>Daily activities you perform every day. Optional 6 AM reminder.</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => router.push("/(add)/schedule")}>
        <Card.Content>
          <Text variant="titleMedium">Add Schedule</Text>
          <Text>One-off activities for a specific day — get morning and custom reminders.</Text>
        </Card.Content>
      </Card>

      <Button mode="text" onPress={() => router.back()} style={styles.close}>
        Close
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: { textAlign: "center", marginVertical: 12, fontWeight: "bold" },
  card: { marginVertical: 8, borderRadius: 12 },
  close: { marginTop: 16 },
});
