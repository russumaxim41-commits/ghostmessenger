import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "@/components/AppBackground";
import { GlassCard } from "@/components/GlassCard";
import { useLocale } from "@/contexts/LocaleContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTheme } from "@/contexts/ThemeContext";

type PermItem = {
  key: "ble" | "wifi" | "media";
  icon: keyof typeof Feather.glyphMap;
  titleKey: string;
  bodyKey: string;
};

const PERMS: PermItem[] = [
  {
    key: "ble",
    icon: "bluetooth",
    titleKey: "onb.perm.ble.title",
    bodyKey: "onb.perm.ble.body",
  },
  {
    key: "wifi",
    icon: "wifi",
    titleKey: "onb.perm.wifi.title",
    bodyKey: "onb.perm.wifi.body",
  },
  {
    key: "media",
    icon: "image",
    titleKey: "onb.perm.media.title",
    bodyKey: "onb.perm.media.body",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { t } = useLocale();
  const { complete } = useOnboarding();
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const orb = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(orb, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [orb]);

  const requestPerm = async (key: PermItem["key"]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setBusy(true);
    try {
      if (key === "media") {
        const r = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setGranted((g) => ({ ...g, media: r.granted }));
      } else {
        // BLE/Wi-Fi: на iOS будут запрошены при первом сканировании;
        // на Android system-promпт через нативный модуль. Здесь даём
        // пользователю явно "согласиться" — флаг сохранится и сканер
        // запустится с первого включения.
        setGranted((g) => ({ ...g, [key]: true }));
      }
    } catch {
      setGranted((g) => ({ ...g, [key]: false }));
    } finally {
      setBusy(false);
    }
  };

  const enter = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    await complete();
    router.replace("/(tabs)");
  };

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 22,
          minHeight: "100%",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Орб */}
        <View style={styles.orbWrap}>
          <Animated.View
            style={[
              styles.orbHalo,
              {
                borderColor: tokens.accent,
                opacity: orb.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.25, 0.7],
                }),
                transform: [
                  {
                    scale: orb.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.18],
                    }),
                  },
                ],
              },
            ]}
          />
          <View
            style={[
              styles.orb,
              {
                backgroundColor: tokens.accentSoft,
                borderColor: tokens.accent,
              },
            ]}
          >
            <Feather name="moon" size={32} color={tokens.accent} />
          </View>
        </View>

        <Text style={[styles.title, { color: tokens.text }]}>
          {t("onb.welcome")}
        </Text>
        <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
          {t("onb.intro")}
        </Text>

        <View style={{ height: 22 }} />

        {PERMS.map((p) => {
          const ok = granted[p.key];
          return (
            <View key={p.key} style={{ marginBottom: 12 }}>
              <GlassCard radius={22} intensity={50}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: ok
                          ? tokens.accentSoft
                          : "rgba(120,120,140,0.15)",
                        borderColor: ok ? tokens.accent : tokens.cardBorder,
                      },
                    ]}
                  >
                    <Feather
                      name={p.icon}
                      size={18}
                      color={ok ? tokens.accent : tokens.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: tokens.text }]}>
                      {t(p.titleKey)}
                    </Text>
                    <Text
                      style={[styles.itemBody, { color: tokens.textMuted }]}
                    >
                      {t(p.bodyKey)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => requestPerm(p.key)}
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.allowBtn,
                      {
                        backgroundColor: ok ? tokens.accent : "transparent",
                        borderColor: ok ? tokens.accent : tokens.cardBorder,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    {ok ? (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[styles.allowText, { color: tokens.text }]}
                      >
                        {t("onb.allow")}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </GlassCard>
            </View>
          );
        })}

        <View style={{ height: 8 }} />

        <Pressable
          onPress={enter}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: tokens.accent,
              shadowColor: tokens.accent,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.ctaText}>{t("onb.enter")}</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
        </Pressable>

        <Text style={[styles.fineprint, { color: tokens.textFaint }]}>
          {t("onb.fineprint")}
        </Text>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  orbWrap: {
    alignItems: "center",
    marginBottom: 24,
    height: 110,
    justifyContent: "center",
  },
  orbHalo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
  },
  orb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  itemTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  itemBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  allowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  allowText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  fineprint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 12,
    lineHeight: 15,
  },
});
