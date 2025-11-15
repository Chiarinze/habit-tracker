import React, { createContext, useCallback, useContext, useState } from "react";
import { Snackbar } from "react-native-paper";
import { View, StyleSheet, Platform } from "react-native";

type ToastOptions = { duration?: number };
type ToastContextType = {
  show: (message: string, options?: ToastOptions) => void;
  showError: (message: string, options?: ToastOptions) => void;
  showSuccess: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState<number>(4000);
  const [isError, setIsError] = useState(false);

  const show = useCallback((msg: string, options?: ToastOptions) => {
    setMessage(msg);
    setDuration(options?.duration ?? 4000);
    setIsError(false);
    setVisible(true);
  }, []);

  const showError = useCallback((msg: string, options?: ToastOptions) => {
    setMessage(msg);
    setDuration(options?.duration ?? 5000);
    setIsError(true);
    setVisible(true);
  }, []);

  const showSuccess = useCallback((msg: string, options?: ToastOptions) => {
    setMessage(msg);
    setDuration(options?.duration ?? 3500);
    setIsError(false);
    setVisible(true);
  }, []);

  return (
    <ToastContext.Provider value={{ show, showError, showSuccess }}>
      {children}
      {/* Top positioned snackbar */}
      <View pointerEvents="box-none" style={styles.container}>
        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={duration}
          action={{
            label: "OK",
            onPress: () => setVisible(false),
          }}
          style={[styles.snackbar, isError ? styles.error : undefined]}
        >
          {message}
        </Snackbar>
      </View>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  snackbar: {
    width: "92%",
    borderRadius: 8,
    paddingHorizontal: 14,
    alignSelf: "center",
  },
  error: {
    backgroundColor: "#b00020",
  },
});
