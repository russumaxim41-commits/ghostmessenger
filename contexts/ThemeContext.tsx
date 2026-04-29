import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "auto";

export type ThemeTokens = {
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  danger: string;
  divider: string;
  surface: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
};

const DARK: ThemeTokens = {
  bg: "#000000",
  card: "rgba(28, 28, 32, 0.7)",
  cardBorder: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.6)",
  textFaint: "rgba(255,255,255,0.4)",
  accent: "#A855F7",
  accentSoft: "rgba(168,85,247,0.22)",
  danger: "#FF4D6D",
  divider: "rgba(255,255,255,0.06)",
  surface: "rgba(20,20,24,0.6)",
  tabBar: "rgba(0,0,0,0.85)",
  tabActive: "#A855F7",
  tabInactive: "rgba(255,255,255,0.55)",
};

const LIGHT: ThemeTokens = {
  bg: "#F4F1FA",
  card: "rgba(255,255,255,0.55)",
  cardBorder: "rgba(0,0,0,0.06)",
  text: "#0F0B1A",
  textMuted: "rgba(15,11,26,0.6)",
  textFaint: "rgba(15,11,26,0.4)",
  accent: "#7C3AED",
  accentSoft: "rgba(124,58,237,0.18)",
  danger: "#E11D48",
  divider: "rgba(0,0,0,0.06)",
  surface: "rgba(255,255,255,0.55)",
  tabBar: "rgba(255,255,255,0.85)",
  tabActive: "#7C3AED",
  tabInactive: "rgba(15,11,26,0.55)",
};

type ThemeState = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  tokens: ThemeTokens;
  setMode: (m: ThemeMode) => void;
};

const STORAGE_KEY = "ghost.theme.v1";
const ThemeCtx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === "light" || raw === "dark" || raw === "auto") {
          setModeState(raw);
        }
      } catch {}
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const resolved: "light" | "dark" = useMemo(() => {
    if (mode === "auto") return system === "light" ? "light" : "dark";
    return mode;
  }, [mode, system]);

  const tokens = resolved === "light" ? LIGHT : DARK;

  const value = useMemo<ThemeState>(
    () => ({ mode, resolved, tokens, setMode }),
    [mode, resolved, tokens, setMode],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
