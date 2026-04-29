import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "@/components/AppBackground";
import { Avatar } from "@/components/Avatar";
import { EditableList } from "@/components/EditableList";
import { GlassCard } from "@/components/GlassCard";
import { GravitationalLens } from "@/components/GravitationalLens";
import { QuickGlassSheet } from "@/components/QuickGlassSheet";
import { useIdentity } from "@/contexts/IdentityContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useMesh, type Chat } from "@/contexts/MeshContext";
import { useTheme } from "@/contexts/ThemeContext";
import { avatarLetter } from "@/lib/ghost";
import { tapMaterial } from "@/lib/haptics";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
}

export default function ChatsScreen() {
  const { chats, queueLength, reorderChats } = useMesh();
  const { identity } = useIdentity();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { t } = useLocale();
  const top = Platform.OS === "web" ? Math.max(insets.top, 64) : insets.top;
  const bottom = (Platform.OS === "web" ? 84 : insets.bottom + 88) + 16;

  const [editing, setEditing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // В edit-mode позволяем перетаскивать. В обычном — оставляем стандартную
  // сортировку по времени последнего сообщения.
  const ordered = editing
    ? chats
    : [...chats].sort((a, b) => b.lastTs - a.lastTs);

  return (
    <AppBackground scopeId="tab.chats">
      <GravitationalLens onActivate={() => setSheetOpen(true)}>
        <View style={styles.headerRow}>
          <View style={{ paddingTop: top + 14 }}>
            <View style={styles.headerLine}>
              <View style={styles.headerAvatar}>
                <Avatar
                  hue={identity?.avatarHue ?? 270}
                  letter={avatarLetter(identity?.name ?? "Ghost")}
                  uri={identity?.avatarUri ?? null}
                  size={40}
                  square
                />
              </View>
              <Text style={[styles.title, { color: tokens.text }]}>Ghost</Text>
            </View>
            <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
              {t("chats.subtitle", { n: queueLength })}
            </Text>
          </View>
        </View>

        {ordered.length === 0 ? (
          <View
            style={[styles.list, styles.listEmpty, { paddingBottom: bottom }]}
          >
            <EmptyChats />
          </View>
        ) : editing ? (
          <View style={[styles.list, { paddingBottom: bottom }]}>
            <EditableList<Chat & { key: string }>
              data={ordered.map((c) => ({ ...c, key: c.peerKey }))}
              editing={editing}
              onToggleEdit={() => setEditing((v) => !v)}
              onReorder={(next) => reorderChats(next)}
              renderItem={(item) => (
                <View style={{ paddingBottom: 10 }}>
                  <ChatRow chat={item} editing />
                </View>
              )}
            />
          </View>
        ) : (
          <FlatList
            data={ordered}
            keyExtractor={(c) => c.peerKey}
            contentContainerStyle={[styles.list, { paddingBottom: bottom }]}
            ListHeaderComponent={
              ordered.length > 1 ? (
                <View style={styles.editToolbar}>
                  <Pressable
                    onPress={() => {
                      tapMaterial("matte");
                      setEditing(true);
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.editToggle,
                      {
                        borderColor: tokens.cardBorder,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Feather name="edit-2" size={11} color={tokens.textMuted} />
                    <Text
                      style={[styles.editToggleText, { color: tokens.textMuted }]}
                    >
                      {t("chats.reorder")}
                    </Text>
                  </Pressable>
                </View>
              ) : null
            }
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => <ChatRow chat={item} />}
          />
        )}
      </GravitationalLens>
      <QuickGlassSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppBackground>
  );
}

function ChatRow({ chat, editing }: { chat: Chat; editing?: boolean }) {
  const { tokens } = useTheme();
  const { t } = useLocale();
  const last = chat.messages[chat.messages.length - 1];
  return (
    <Pressable
      disabled={editing}
      onPress={() => {
        tapMaterial("glossy");
        router.push(`/chat/${chat.peerKey}`);
      }}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <GlassCard radius={20} intensity={45}>
        <View style={styles.row}>
          <Avatar
            hue={chat.avatarHue}
            letter={avatarLetter(chat.peerName)}
            size={46}
            square
          />
          <View style={styles.rowMid}>
            <View style={styles.rowTop}>
              <Text
                style={[styles.name, { color: tokens.text }]}
                numberOfLines={1}
              >
                {chat.peerName}
              </Text>
              {last ? (
                <Text style={[styles.time, { color: tokens.textFaint }]}>
                  {formatTime(last.ts)}
                </Text>
              ) : null}
            </View>
            <Text
              style={[styles.preview, { color: tokens.textMuted }]}
              numberOfLines={1}
            >
              {last ? last.text : t("chats.lastEmpty")}
            </Text>
          </View>
          {editing ? (
            <Feather name="menu" size={18} color={tokens.textMuted} />
          ) : chat.unread > 0 ? (
            <View style={[styles.unread, { backgroundColor: tokens.accent }]}>
              <Text style={styles.unreadText}>{chat.unread}</Text>
            </View>
          ) : null}
        </View>
      </GlassCard>
    </Pressable>
  );
}

function EmptyChats() {
  const { tokens } = useTheme();
  const { t } = useLocale();
  return (
    <View style={styles.empty}>
      <View
        style={[
          styles.emptyOrb,
          {
            backgroundColor: tokens.accentSoft,
            borderColor: tokens.accent,
          },
        ]}
      >
        <Feather name="message-circle" size={26} color={tokens.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: tokens.text }]}>
        {t("chats.empty.title")}
      </Text>
      <Text style={[styles.emptyHint, { color: tokens.textMuted }]}>
        {t("chats.empty.hint")}
      </Text>
      <Pressable
        onPress={() => {
          tapMaterial("metal");
          router.push("/(tabs)/nearby");
        }}
        style={[
          styles.emptyBtn,
          {
            backgroundColor: tokens.accent,
          },
        ]}
      >
        <Text style={styles.emptyBtnText}>{t("chats.empty.cta")}</Text>
        <Feather name="arrow-right" size={15} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 22 },
  headerLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    borderRadius: 12,
    overflow: "hidden",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 52,
    letterSpacing: 0.2,
  },
  list: { paddingHorizontal: 16, paddingTop: 18 },
  listEmpty: { flexGrow: 1, justifyContent: "center" },
  editToolbar: {
    alignItems: "flex-end",
    paddingBottom: 8,
  },
  editToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editToggleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  rowMid: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  time: { fontFamily: "Inter_400Regular", fontSize: 11 },
  preview: { fontFamily: "Inter_400Regular", fontSize: 13 },
  unread: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  empty: { alignItems: "center", paddingHorizontal: 32 },
  emptyOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    marginBottom: 8,
  },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
});
