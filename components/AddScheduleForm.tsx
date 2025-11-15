import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import { useCreateScheduledActivity } from "@/lib/queries";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export default function AddScheduleForm() {
  const { user } = useAuth();
  const createActivity = useCreateScheduledActivity();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const [reminderOffset, setReminderOffset] = useState("60");

  const handleAdd = async () => {
    if (!user) return;
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: "Title required",
      });
      return;
    }

    await createActivity.mutateAsync({
      user_id: user.id,
      title,
      description: description || undefined,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || undefined,
      reminder_offset_minutes: Number(reminderOffset),
    });

    Toast.show({
      type: "success",
      text1: "Scheduled activity added",
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.heading}>
        Add Schedule
      </Text>

      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <TextInput
        label="Date (YYYY-MM-DD)"
        value={scheduledDate}
        onChangeText={setScheduledDate}
        style={styles.input}
      />
      <TextInput
        label="Time (HH:MM optional)"
        value={scheduledTime}
        onChangeText={setScheduledTime}
        style={styles.input}
      />
      <TextInput
        label="Reminder offset (minutes)"
        value={reminderOffset}
        onChangeText={setReminderOffset}
        style={styles.input}
        keyboardType="numeric"
      />

      <Button mode="contained" onPress={handleAdd}>
        Add Schedule
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontWeight: "bold", marginBottom: 16 },
  input: { marginBottom: 12 },
});
