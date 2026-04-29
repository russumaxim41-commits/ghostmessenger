import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type GlassState = {
  opacity: number; // 0..1 — overlay tint density on glass surfaces
  setOpacity: (v: number) => void;
};

const STORAGE_KEY = "ghost.glass.v2";
const GlassCtx = createContext<GlassState | null>(null);

export function GlassProvider({ children }: { children: React.ReactNode }) {
  const [opacity, setOpacityState] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (typeof parsed.opacity === "number") setOpacityState(parsed.opacity);
      } catch {}
    })();
  }, []);

  const setOpacity = useCallback((v: number) => {
    setOpacityState(v);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ opacity: v })).catch(
      () => {},
    );
  }, []);

  const value = useMemo<GlassState>(
    () => ({ opacity, setOpacity }),
    [opacity, setOpacity],
  );

  return <GlassCtx.Provider value={value}>{children}</GlassCtx.Provider>;
}

export function useGlass(): GlassState {
  const ctx = useContext(GlassCtx);
  if (!ctx) throw new Error("useGlass must be used inside GlassProvider");
  return ctx;
}
