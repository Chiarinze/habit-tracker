import { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  TextInput,
  Button,
  Text,
  SegmentedButtons,
  Switch,
} from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import { useCreateRoutine } from "@/lib/queries";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export default function AddRoutineForm() {
  const { user } = useAuth();
  const createRoutine = useCreateRoutine();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [enableMorningReminder, setEnableMorningReminder] = useState(true);

  const handleAdd = async () => {
    if (!user) return;
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: "Title required",
      });
      return;
    }

    await createRoutine.mutateAsync({
      user_id: user.id,
      title,
      description: description || undefined,
      category: category || null,
      reminder_time: enableMorningReminder ? "06:00" : null,
    });

    Toast.show({
      type: "success",
      text1: "Routine added",
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.heading}>
        Add Routine
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

      <SegmentedButtons
        value={category}
        onValueChange={setCategory}
        style={styles.input}
        buttons={[
          { value: "morning", label: "Morning" },
          { value: "afternoon", label: "Afternoon" },
          { value: "evening", label: "Evening" },
        ]}
      />

      <View style={styles.row}>
        <Text>Send daily reminder at 6 AM</Text>
        <Switch
          value={enableMorningReminder}
          onValueChange={setEnableMorningReminder}
        />
      </View>

      <Button mode="contained" onPress={handleAdd} style={{ marginTop: 20 }}>
        Add Routine
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontWeight: "bold", marginBottom: 16 },
  input: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
