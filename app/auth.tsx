import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");
  const [isLoading, setIsLoading] = useState(false);

  const theme = useTheme();
  const router = useRouter();

  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Passwords must be at least 6 characters long.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        const error = await signUp(email, password);
        if (error) {
          setError(error);
          return;
        }

        await signIn(email, password);
      } else {
        const error = await signIn(email, password);
        if (error) {
          setError(error);
          return;
        }
        router.replace("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title} variant="headlineMedium">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Text>

          <TextInput
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="example@gmail.com"
            mode="outlined"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            label="Password"
            autoCapitalize="none"
            mode="outlined"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={{ color: theme.colors.error }}> {error}</Text>}

          <Button
            mode="contained"
            style={styles.button}
            onPress={handleAuth}
            loading={isLoading}
            disabled={isLoading}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <Button
            mode="text"
            onPress={handleSwitchMode}
            style={styles.switchModeButton}
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  switchModeButton: {
    marginTop: 16,
  },
});
