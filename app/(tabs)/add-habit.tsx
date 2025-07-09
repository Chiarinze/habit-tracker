import { useAuth } from "@/lib/auth-context";
import { useCreateHabit } from "@/lib/queries";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Button,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];

export default function AddHabitScreen() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [error, setError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const createHabit = useCreateHabit();

  useFocusEffect(
  useCallback(() => {
    setIsSuccess(false);
    setError("");
  }, [])
);

  const handleSubmit = async () => {
    if (!user) return;

    try {
      await createHabit.mutateAsync({
        user_id: user.id,
        title,
        description,
        frequency,
      });

      setTitle("");
      setDescription("");
      setFrequency("daily");
      setError("");
      setIsSuccess(true);
      setTimeout(() => router.back(), 100);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }

      setError("There was an error creating the habit");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <TextInput
          label="Title"
          mode="outlined"
          onChangeText={setTitle}
          value={title}
          style={styles.input}
          returnKeyType="next"
        />
        <TextInput
          label="Description"
          mode="outlined"
          onChangeText={setDescription}
          value={description}
          style={styles.input}
        />
        <View style={styles.frequencyContainer}>
          <SegmentedButtons
            value={frequency}
            onValueChange={(value) => setFrequency(value as Frequency)}
            buttons={FREQUENCIES.map((freq) => ({
              value: freq,
              label: freq.charAt(0).toUpperCase() + freq.slice(1),
            }))}
          />
        </View>
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!title || !description || createHabit.isPending}
          loading={createHabit.isPending}
        >
          {createHabit.isPending ? "Adding..." : "Add Habit"}
        </Button>
        {isSuccess && (
          <Text
            style={{
              color: theme.colors.primary,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Habit created successfully!
          </Text>
        )}

        {error && <Text style={{ color: theme.colors.error }}> {error}</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },

  input: {
    marginBottom: 16,
  },

  frequencyContainer: {
    marginBottom: 24,
  },
});
