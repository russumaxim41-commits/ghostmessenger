import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

type OnboardingState = {
  ready: boolean;
  completed: boolean;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
};

const KEY = "ghost.onboarding.v2";
const Ctx = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  // На вебе пропускаем стартовый экран по умолчанию — превью открывает
  // сразу вкладки. На реальном устройстве экран онбординга появляется
  // при первом запуске, как и должно.
  const [completed, setCompleted] = useState(Platform.OS === "web");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw === "1") setCompleted(true);
        else if (Platform.OS !== "web") setCompleted(false);
      } catch {}
      setReady(true);
    })();
  }, []);

  const complete = useCallback(async () => {
    setCompleted(true);
    try {
      await AsyncStorage.setItem(KEY, "1");
    } catch {}
  }, []);

  const reset = useCallback(async () => {
    setCompleted(false);
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
  }, []);

  const value = useMemo<OnboardingState>(
    () => ({ ready, completed, complete, reset }),
    [ready, completed, complete, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOnboarding must be inside OnboardingProvider");
  return v;
}
