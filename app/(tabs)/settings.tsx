import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "@/components/AppBackground";
import { Avatar } from "@/components/Avatar";
import { GlassCard } from "@/components/GlassCard";
import { GlassSlider } from "@/components/GlassSlider";
import { useBackground } from "@/contexts/BackgroundContext";
import { useGlass } from "@/contexts/GlassContext";
import { useIdentity } from "@/contexts/IdentityContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useMesh, type ConnectionMode } from "@/contexts/MeshContext";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { avatarLetter, copyToClipboard } from "@/lib/ghost";
import { tapDanger } from "@/lib/haptics";
import type { Locale } from "@/lib/i18n";
import { panicWipe } from "@/lib/panic";
import {
  loadRelayStats,
  relayAvailable,
  startRelay,
  stopRelay,
  type RelayStats,
} from "@/lib/relay";

function tap() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? Math.max(insets.top, 64) : insets.top;
  const bottom = (Platform.OS === "web" ? 84 : insets.bottom + 88) + 16;

  const { tokens, mode: themeMode, setMode: setThemeMode } = useTheme();
  const glass = useGlass();
  const bg = useBackground();
  const { identity, setName, pickAvatar, resetAvatar, resetIdentity } =
    useIdentity();
  const mesh = useMesh();
  const { locale, setLocale, available, t } = useLocale();

  const [nameInput, setNameInput] = useState<string>(identity?.name ?? "");
  const [relayStats, setRelayStats] = useState<RelayStats | null>(null);
  const [relayBusy, setRelayBusy] = useState(false);
  const relayOk = relayAvailable();

  useEffect(() => {
    if (identity?.name && nameInput === "") setNameInput(identity.name);
  }, [identity?.name, nameInput]);

  useEffect(() => {
    let alive = true;
    loadRelayStats().then((s) => {
      if (alive) setRelayStats(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onSaveName = async () => {
    if (!nameInput.trim()) return;
    await setName(nameInput.trim());
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
  };

  const toggleRelay = useCallback(async () => {
    tap();
    if (!relayStats) return;
    setRelayBusy(true);
    try {
      if (relayStats.enabled) {
        await stopRelay();
        setRelayStats({ ...relayStats, enabled: false });
      } else {
        const r = await startRelay();
        if (r.ok) {
          setRelayStats({ ...relayStats, enabled: true });
        } else if (r.reason) {
          if (Platform.OS === "web") {
            // eslint-disable-next-line no-alert
            window.alert(r.reason);
          } else {
            Alert.alert(t("settings.relay.failTitle"), r.reason);
          }
        }
      }
    } finally {
      setRelayBusy(false);
    }
  }, [relayStats, t]);

  const onReset = () => {
    const title = t("settings.reset.confirmTitle");
    const msg = t("settings.reset.confirmBody");
    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n\n${msg}`)) {
        resetIdentity();
      }
      return;
    }
    Alert.alert(title, msg, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.reset.confirmCta"),
        style: "destructive",
        onPress: () => {
          resetIdentity();
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => {});
        },
      },
    ]);
  };

  const onPanic = () => {
    const title = t("settings.panic.confirmTitle");
    const msg = t("settings.panic.confirmBody");
    const fire = async () => {
      await panicWipe();
      tapDanger();
      resetIdentity();
    };
    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n\n${msg}`)) fire();
      return;
    }
    Alert.alert(title, msg, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.panic.confirmCta"),
        style: "destructive",
        onPress: () => void fire(),
      },
    ]);
  };

  if (!identity)
    return (
      <AppBackground scopeId="tab.settings">
        <View />
      </AppBackground>
    );

  return (
    <AppBackground scopeId="tab.settings">
      <ScrollView
        contentContainerStyle={{
          paddingTop: top + 14,
          paddingBottom: bottom,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.pageTitle,
            { color: tokens.text, paddingHorizontal: 6 },
          ]}
        >
          {t("settings.title")}
        </Text>

        {/* IDENTITY */}
        <View style={{ height: 18 }} />
        <GlassCard radius={24} intensity={50}>
          <View style={styles.idCard}>
            <View style={styles.idHead}>
              <Avatar
                hue={identity.avatarHue}
                letter={avatarLetter(identity.name)}
                uri={identity.avatarUri}
                size={72}
                square
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.idName, { color: tokens.text }]}>
                  {identity.name}
                </Text>
                <Pressable
                  onPress={() => {
                    tap();
                    copyToClipboard("#" + identity.shortId);
                  }}
                  hitSlop={6}
                  style={styles.idIdRow}
                >
                  <Feather name="hash" size={11} color={tokens.accent} />
                  <Text style={[styles.idId, { color: tokens.textMuted }]}>
                    {identity.shortId}
                  </Text>
                  <Feather name="copy" size={10} color={tokens.textFaint} />
                </Pressable>
              </View>
            </View>

            <View style={styles.avatarBtns}>
              <SmallBtn
                icon="image"
                label={t("settings.id.changeAvatar")}
                onPress={() => {
                  tap();
                  pickAvatar();
                }}
              />
              <SmallBtn
                icon="rotate-ccw"
                label={t("common.reset")}
                onPress={() => {
                  tap();
                  resetAvatar();
                }}
                muted
              />
            </View>

            <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
              {t("settings.id.nameLabel")}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                onBlur={onSaveName}
                onSubmitEditing={onSaveName}
                placeholder={t("settings.id.namePlaceholder")}
                placeholderTextColor={tokens.textFaint}
                style={[
                  styles.input,
                  {
                    color: tokens.text,
                    borderColor: tokens.cardBorder,
                    backgroundColor: tokens.surface,
                  },
                ]}
              />
              <Pressable
                onPress={onSaveName}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: tokens.accent },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Feather name="check" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text style={[styles.helpText, { color: tokens.textFaint }]}>
              {t("settings.id.help")}
            </Text>
          </View>
        </GlassCard>

        {/* LANGUAGE */}
        <SectionHeader
          title={t("settings.lang.title")}
          desc={t("settings.lang.desc")}
        />
        <GlassCard radius={20} intensity={45}>
          <View style={styles.themeRow}>
            {available.map((opt) => {
              const active = locale === opt.code;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => {
                    tap();
                    setLocale(opt.code as Locale);
                  }}
                  style={[
                    styles.themePill,
                    {
                      borderColor: active ? tokens.accent : tokens.cardBorder,
                      backgroundColor: active
                        ? tokens.accentSoft
                        : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langTag,
                      {
                        color: active ? tokens.accent : tokens.textMuted,
                        borderColor: active ? tokens.accent : tokens.cardBorder,
                      },
                    ]}
                  >
                    {opt.tag}
                  </Text>
                  <Text
                    style={[
                      styles.themeText,
                      { color: active ? tokens.text : tokens.textMuted },
                    ]}
                  >
                    {opt.native}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* THEME */}
        <SectionHeader
          title={t("settings.theme.title")}
          desc={t("settings.theme.desc")}
        />
        <GlassCard radius={20} intensity={45}>
          <View style={styles.themeRow}>
            {(["light", "dark", "auto"] as ThemeMode[]).map((m) => {
              const active = themeMode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    tap();
                    setThemeMode(m);
                  }}
                  style={[
                    styles.themePill,
                    {
                      borderColor: active ? tokens.accent : tokens.cardBorder,
                      backgroundColor: active
                        ? tokens.accentSoft
                        : "transparent",
                    },
                  ]}
                >
                  <Feather
                    name={
                      m === "light"
                        ? "sun"
                        : m === "dark"
                          ? "moon"
                          : "smartphone"
                    }
                    size={14}
                    color={active ? tokens.accent : tokens.textMuted}
                  />
                  <Text
                    style={[
                      styles.themeText,
                      { color: active ? tokens.text : tokens.textMuted },
                    ]}
                  >
                    {m === "light"
                      ? t("settings.theme.light")
                      : m === "dark"
                        ? t("settings.theme.dark")
                        : t("settings.theme.auto")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* GLASS OPACITY */}
        <SectionHeader
          title={t("settings.glass.title")}
          desc={t("settings.glass.desc")}
        />
        <GlassCard radius={20} intensity={45}>
          <View style={{ padding: 16 }}>
            <GlassSlider
              value={glass.opacity}
              onChange={glass.setOpacity}
              min={0}
              max={1}
              showValue
              format={(v) => `${Math.round(v * 100)}%`}
              leftLabel={t("settings.glass.left")}
              rightLabel={t("settings.glass.right")}
            />
          </View>
        </GlassCard>

        {/* BACKGROUND */}
        <SectionHeader
          title={t("settings.bg.title")}
          desc={t("settings.bg.desc")}
        />
        <GlassCard radius={20} intensity={45}>
          <View style={styles.bgRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: tokens.text }]}>
                {t("settings.bg.row")}
              </Text>
              <Text style={[styles.rowSub, { color: tokens.textMuted }]}>
                {bg.global ? t("settings.bg.set") : t("settings.bg.default")}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                tap();
                bg.pickGlobal();
              }}
              style={({ pressed }) => [
                styles.bgBtn,
                {
                  backgroundColor: tokens.accentSoft,
                  borderColor: tokens.accent,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="image" size={14} color={tokens.accent} />
              <Text style={[styles.bgBtnText, { color: tokens.text }]}>
                {t("common.choose")}
              </Text>
            </Pressable>
            {bg.global ? (
              <Pressable
                onPress={() => {
                  tap();
                  bg.resetGlobal();
                }}
                hitSlop={6}
                style={[styles.iconBtn, { borderColor: tokens.cardBorder }]}
              >
                <Feather name="x" size={14} color={tokens.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </GlassCard>

        {/* CONNECTION */}
        <SectionHeader
          title={t("settings.conn.title")}
          desc={t("settings.conn.desc")}
        />
        <GlassCard radius={20} intensity={45}>
          <View style={styles.themeRow}>
            {(["auto", "wifi", "ble"] as ConnectionMode[]).map((m) => {
              const active = mesh.mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    tap();
                    mesh.setMode(m);
                  }}
                  style={[
                    styles.themePill,
                    {
                      borderColor: active ? tokens.accent : tokens.cardBorder,
                      backgroundColor: active
                        ? tokens.accentSoft
                        : "transparent",
                    },
                  ]}
                >
                  <Feather
                    name={
                      m === "auto"
                        ? "shuffle"
                        : m === "wifi"
                          ? "wifi"
                          : "bluetooth"
                    }
                    size={14}
                    color={active ? tokens.accent : tokens.textMuted}
                  />
                  <Text
                    style={[
                      styles.themeText,
                      { color: active ? tokens.text : tokens.textMuted },
                    ]}
                  >
                    {m === "auto"
                      ? t("settings.conn.auto")
                      : m === "wifi"
                        ? t("settings.conn.wifi")
                        : t("settings.conn.ble")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* RELAY */}
        <SectionHeader
          title={t("settings.relay.title")}
          desc={t("settings.relay.desc")}
        />
        <GlassCard radius={20} intensity={45}>
          <View style={styles.relayRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: tokens.text }]}>
                {t("settings.relay.row")}
              </Text>
              <Text style={[styles.rowSub, { color: tokens.textMuted }]}>
                {!relayOk
                  ? t("settings.relay.unavailable")
                  : relayStats?.enabled
                    ? t("settings.relay.active", {
                        n: relayStats.encounters,
                      })
                    : t("settings.relay.off")}
              </Text>
            </View>
            <Pressable
              onPress={toggleRelay}
              disabled={relayBusy || !relayOk}
              style={({ pressed }) => [
                styles.toggleBtn,
                {
                  backgroundColor: relayStats?.enabled
                    ? tokens.accent
                    : "transparent",
                  borderColor: relayStats?.enabled
                    ? tokens.accent
                    : tokens.cardBorder,
                  opacity: !relayOk ? 0.45 : 1,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: relayStats?.enabled ? "#FFFFFF" : tokens.text,
                  },
                ]}
              >
                {relayStats?.enabled
                  ? t("settings.relay.toggleOff")
                  : t("settings.relay.on")}
              </Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* ABOUT */}
        <SectionHeader
          title={t("settings.about.title")}
          desc=""
        />
        <GlassCard radius={20} intensity={45}>
          <View style={{ padding: 16 }}>
            <Text style={[styles.aboutBody, { color: tokens.textMuted }]}>
              {t("settings.about.body")}
            </Text>
            <Text style={[styles.aboutMeta, { color: tokens.textFaint }]}>
              {t("settings.about.meta")}
            </Text>
          </View>
        </GlassCard>

        {/* RESET */}
        <View style={{ height: 22 }} />
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.resetBtn,
            { borderColor: tokens.danger },
            pressed && {
              opacity: 0.7,
              backgroundColor: "rgba(225,29,72,0.08)",
            },
          ]}
        >
          <Feather name="trash-2" size={15} color={tokens.danger} />
          <Text style={[styles.resetText, { color: tokens.danger }]}>
            {t("settings.reset.button")}
          </Text>
        </Pressable>
        <Text style={[styles.resetHint, { color: tokens.textFaint }]}>
          {t("settings.reset.hint")}
        </Text>

        {/* PANIC WIPE */}
        <View style={{ height: 18 }} />
        <Pressable
          onPress={onPanic}
          style={({ pressed }) => [
            styles.panicBtn,
            {
              backgroundColor: tokens.danger,
              borderColor: tokens.danger,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name="zap" size={15} color="#FFFFFF" />
          <Text style={styles.panicText}>{t("settings.panic.button")}</Text>
        </Pressable>
        <Text style={[styles.resetHint, { color: tokens.textFaint }]}>
          {t("settings.panic.hint")}
        </Text>
      </ScrollView>
    </AppBackground>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  const { tokens } = useTheme();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: tokens.text }]}>{title}</Text>
      {desc ? (
        <Text style={[styles.sectionDesc, { color: tokens.textMuted }]}>
          {desc}
        </Text>
      ) : null}
    </View>
  );
}

function SmallBtn({
  icon,
  label,
  onPress,
  muted,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallBtn,
        {
          backgroundColor: muted ? "transparent" : tokens.accentSoft,
          borderColor: muted ? tokens.cardBorder : tokens.accent,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Feather
        name={icon}
        size={13}
        color={muted ? tokens.textMuted : tokens.accent}
      />
      <Text
        style={[
          styles.smallBtnText,
          { color: muted ? tokens.textMuted : tokens.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1 },

  panicBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  panicText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  idCard: { padding: 18 },
  idHead: { flexDirection: "row", alignItems: "center" },
  idName: { fontFamily: "Inter_700Bold", fontSize: 22 },
  idIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  idId: { fontFamily: "Inter_500Medium", fontSize: 12 },
  helpText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 10,
    lineHeight: 15,
  },

  avatarBtns: { flexDirection: "row", gap: 8, marginTop: 16 },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  smallBtnText: { fontFamily: "Inter_500Medium", fontSize: 12 },

  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHead: {
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  themeRow: { flexDirection: "row", gap: 6, padding: 6 },
  themePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  langTag: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },

  bgRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  relayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 64,
    alignItems: "center",
  },
  toggleText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },

  rowTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3 },
  bgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  bgBtnText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  aboutBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  aboutMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 12,
    letterSpacing: 0.3,
  },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    marginHorizontal: 6,
    backgroundColor: "transparent",
  },
  resetText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  resetHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },
});
