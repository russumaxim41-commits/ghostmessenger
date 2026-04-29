import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NativeModules, Platform } from "react-native";

import { translate, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";

type LocaleState = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  available: typeof SUPPORTED_LOCALES;
};

const STORAGE_KEY = "ghost.locale.v1";
const LocaleCtx = createContext<LocaleState | null>(null);

function detectInitialLocale(): Locale {
  try {
    let tag = "ru";
    if (Platform.OS === "ios") {
      const settings: any = NativeModules.SettingsManager?.settings ?? {};
      tag =
        (settings.AppleLocale as string | undefined) ??
        (settings.AppleLanguages?.[0] as string | undefined) ??
        "ru";
    } else if (Platform.OS === "android") {
      tag =
        (NativeModules.I18nManager?.localeIdentifier as string | undefined) ??
        "ru";
    } else if (Platform.OS === "web" && typeof navigator !== "undefined") {
      tag = navigator.language ?? "ru";
    }
    const lower = String(tag).toLowerCase();
    if (lower.startsWith("en")) return "en";
    if (lower.startsWith("zh")) return "zh";
    return "ru";
  } catch {
    return "ru";
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === "ru" || raw === "en" || raw === "zh") {
          setLocaleState(raw);
          return;
        }
        setLocaleState(detectInitialLocale());
      } catch {
        setLocaleState(detectInitialLocale());
      }
    })();
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );

  const value = useMemo<LocaleState>(
    () => ({ locale, setLocale, t, available: SUPPORTED_LOCALES }),
    [locale, setLocale, t],
  );

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): LocaleState {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
