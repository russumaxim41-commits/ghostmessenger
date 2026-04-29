import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "@/components/AppBackground";
import { Avatar } from "@/components/Avatar";
import { CondensationText } from "@/components/CondensationText";
import { GlassCard } from "@/components/GlassCard";
import { ScopeHeaderActions } from "@/components/ScopeHeaderActions";
import { useBackground } from "@/contexts/BackgroundContext";
import { useIdentity } from "@/contexts/IdentityContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useMesh, type Message } from "@/contexts/MeshContext";
import { useTheme } from "@/contexts/ThemeContext";
import { avatarLetter } from "@/lib/ghost";
import { tapMaterial } from "@/lib/haptics";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const peerKey = String(id);
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { t } = useLocale();
  const bg = useBackground();
  const { chats, sendMessage, markRead, peers, getRatchetFingerprint } =
    useMesh();
  const { identity } = useIdentity();
  const [text, setText] = useState<string>("");
  const lastSeenIdRef = useRef<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const chat = useMemo(
    () => chats.find((c) => c.peerKey === peerKey),
    [chats, peerKey],
  );
  const peer = useMemo(
    () => peers.find((p) => p.publicKey === peerKey),
    [peers, peerKey],
  );
  const peerName = chat?.peerName ?? peer?.name ?? t("chat.unknown");
  const peerHue = chat?.avatarHue ?? peer?.avatarHue ?? 270;
  const peerShortId = chat?.peerShortId ?? peer?.shortId ?? peerKey.slice(0, 6);
  const ratchetFp = getRatchetFingerprint(peerKey);

  useEffect(() => {
    markRead(peerKey);
  }, [peerKey, markRead]);

  // Detect newly added own message → trigger entrance animation
  useEffect(() => {
    const msgs = chat?.messages ?? [];
    const last = msgs[msgs.length - 1];
    if (!last || !identity) return;
    if (last.fromKey !== identity.publicKey) return;
    if (lastSeenIdRef.current === last.id) return;
    lastSeenIdRef.current = last.id;
    setAnimatingId(last.id);
  }, [chat?.messages, identity]);

  const inverted = useMemo(() => {
    const msgs = chat?.messages ?? [];
    return [...msgs].reverse();
  }, [chat?.messages]);

  const send = () => {
    if (!text.trim()) return;
    tapMaterial("metal");
    sendMessage(peerKey, text);
    setText("");
  };

  return (
    <AppBackground scopeId={`chat:${peerKey}`}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            borderBottomColor: tokens.cardBorder,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            tapMaterial("matte");
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={22} color={tokens.text} />
        </Pressable>
        <Avatar hue={peerHue} letter={avatarLetter(peerName)} size={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={[styles.headerName, { color: tokens.text }]}
            numberOfLines={1}
          >
            {peerName}
          </Text>
          <View style={styles.headerSubRow}>
            <View style={[styles.encDot, { backgroundColor: tokens.accent }]} />
            <Text style={[styles.headerSub, { color: tokens.textMuted }]}>
              {ratchetFp
                ? `ratchet · ${ratchetFp} · #${peerShortId}`
                : `${t("chat.encrypt")} · #${peerShortId}`}
            </Text>
          </View>
        </View>
        <ScopeHeaderActions
          onWallpaper={() => bg.pickFor(`chat:${peerKey}`)}
          hasWallpaper={!!bg.scopes[`chat:${peerKey}`]}
          onResetWallpaper={() => bg.resetFor(`chat:${peerKey}`)}
        />
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={inverted}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View
                style={[
                  styles.lockBubble,
                  {
                    backgroundColor: tokens.accentSoft,
                    borderColor: tokens.accent,
                  },
                ]}
              >
                <Feather name="lock" size={18} color={tokens.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: tokens.text }]}>
                {t("chat.empty.title")}
              </Text>
              <Text style={[styles.emptyHint, { color: tokens.textMuted }]}>
                {t("chat.empty.hint")}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Bubble
              msg={item}
              mine={item.fromKey === identity?.publicKey}
              animateEntrance={item.id === animatingId}
              onAnimationDone={() => {
                if (item.id === animatingId) setAnimatingId(null);
              }}
            />
          )}
        />

        <KeyboardStickyView
          offset={{ closed: 0, opened: 0 }}
          style={[styles.composerWrap, { paddingBottom: insets.bottom + 10 }]}
        >
          {text.length > 0 ? (
            <View style={styles.condensationStrip}>
              <CondensationText text={text} fontSize={11} />
            </View>
          ) : null}
          <GlassCard radius={26} intensity={70}>
            <View style={styles.composer}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t("chat.composer")}
                placeholderTextColor={tokens.textFaint}
                style={[styles.input, { color: tokens.text }]}
                multiline
                maxLength={500}
              />
              <Pressable
                onPress={send}
                disabled={!text.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: tokens.accent },
                  !text.trim() && { opacity: 0.4 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Feather name="send" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </GlassCard>
        </KeyboardStickyView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}

function Bubble({
  msg,
  mine,
  animateEntrance,
  onAnimationDone,
}: {
  msg: Message;
  mine: boolean;
  animateEntrance?: boolean;
  onAnimationDone?: () => void;
}) {
  const { tokens } = useTheme();
  const a = useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;

  useEffect(() => {
    if (!animateEntrance) return;
    Animated.timing(a, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onAnimationDone?.());
  }, [animateEntrance, a, onAnimationDone]);

  // Ввод располагается ниже ленты — поэтому исходящий пузырёк
  // «вылетает» снизу с лёгким масштабированием (имитация перетекания
  // текста из поля ввода в чат).
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const scale = a.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        mine && { justifyContent: "flex-end" },
        { opacity: a, transform: [{ translateY }, { scale }] },
      ]}
    >
      <View
        style={[
          styles.bubbleWrap,
          mine && {
            shadowColor: tokens.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.55,
            shadowRadius: 14,
            elevation: 6,
          },
        ]}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: mine ? tokens.accentSoft : tokens.surface,
              borderColor: mine ? tokens.accent : tokens.cardBorder,
            },
            mine ? { borderTopRightRadius: 6 } : { borderTopLeftRadius: 6 },
          ]}
        >
          {/* Внутренний градиентный отблеск (только для своих сообщений) */}
          {mine ? (
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(168,85,247,0.55)",
                "rgba(168,85,247,0.18)",
                "rgba(168,85,247,0)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0, 0.4, 1]}
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 18,
                  borderTopRightRadius: 6,
                  opacity: 0.6,
                },
              ]}
            />
          ) : null}
          <Text style={[styles.bubbleText, { color: tokens.text }]}>
            {msg.text}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, { color: tokens.textFaint }]}>
              {new Date(msg.ts).toTimeString().slice(0, 5)}
            </Text>
            {mine ? (
              <Feather
                name={msg.delivered ? "check-circle" : "clock"}
                size={11}
                color={msg.delivered ? tokens.accent : tokens.textFaint}
              />
            ) : null}
            {mine && typeof msg.ratchetCounter === "number" ? (
              <Text style={[styles.ratchet, { color: tokens.textFaint }]}>
                ↻{msg.ratchetCounter}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  encDot: { width: 6, height: 6, borderRadius: 3 },
  headerSub: { fontFamily: "Inter_500Medium", fontSize: 11 },
  list: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    flexGrow: 1,
  },
  emptyChat: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    transform: [{ scaleY: -1 }],
  },
  lockBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 6 },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
  },
  bubbleRow: { flexDirection: "row", paddingVertical: 4 },
  bubbleWrap: { maxWidth: "78%" },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 19 },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  bubbleTime: { fontFamily: "Inter_400Regular", fontSize: 10 },
  ratchet: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 0.3,
  },
  composerWrap: { paddingHorizontal: 12, paddingTop: 6 },
  condensationStrip: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    minHeight: 18,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
