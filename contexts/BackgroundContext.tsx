import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type BgMap = Record<string, string | null>;

type BgState = {
  global: string | null;
  scopes: BgMap;
  pickGlobal: () => Promise<void>;
  pickFor: (scopeId: string) => Promise<void>;
  resetGlobal: () => void;
  resetFor: (scopeId: string) => void;
  uriFor: (scopeId?: string) => string | null;
};

const STORAGE_KEY = "ghost.bg.v2";
const BgCtx = createContext<BgState | null>(null);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [global, setGlobal] = useState<string | null>(null);
  const [scopes, setScopes] = useState<BgMap>({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (typeof parsed.global === "string" || parsed.global === null) {
          setGlobal(parsed.global);
        }
        if (parsed.scopes && typeof parsed.scopes === "object") {
          setScopes(parsed.scopes);
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback(
    async (next: { global?: string | null; scopes?: BgMap }) => {
      const merged = {
        global: next.global ?? global,
        scopes: next.scopes ?? scopes,
      };
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
    },
    [global, scopes],
  );

  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return null;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });
      if (res.canceled || !res.assets?.[0]) return null;
      return res.assets[0].uri;
    } catch {
      return null;
    }
  }, []);

  const pickGlobal = useCallback(async () => {
    const uri = await pickImage();
    if (!uri) return;
    setGlobal(uri);
    persist({ global: uri });
  }, [pickImage, persist]);

  const pickFor = useCallback(
    async (scopeId: string) => {
      const uri = await pickImage();
      if (!uri) return;
      const next = { ...scopes, [scopeId]: uri };
      setScopes(next);
      persist({ scopes: next });
    },
    [pickImage, scopes, persist],
  );

  const resetGlobal = useCallback(() => {
    setGlobal(null);
    persist({ global: null });
  }, [persist]);

  const resetFor = useCallback(
    (scopeId: string) => {
      const next = { ...scopes };
      delete next[scopeId];
      setScopes(next);
      persist({ scopes: next });
    },
    [scopes, persist],
  );

  const uriFor = useCallback(
    (scopeId?: string): string | null => {
      if (scopeId && scopes[scopeId]) return scopes[scopeId] ?? null;
      return global;
    },
    [global, scopes],
  );

  const value = useMemo<BgState>(
    () => ({ global, scopes, pickGlobal, pickFor, resetGlobal, resetFor, uriFor }),
    [global, scopes, pickGlobal, pickFor, resetGlobal, resetFor, uriFor],
  );

  return <BgCtx.Provider value={value}>{children}</BgCtx.Provider>;
}

export function useBackground(): BgState {
  const ctx = useContext(BgCtx);
  if (!ctx)
    throw new Error("useBackground must be used inside BackgroundProvider");
  return ctx;
}
