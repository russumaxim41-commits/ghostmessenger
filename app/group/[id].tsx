import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { GlassCard } from "@/components/GlassCard";
import { MeshActivityGlow } from "@/components/MeshActivityGlow";
import { RenameModal } from "@/components/RenameModal";
import { ScopeHeaderActions } from "@/components/ScopeHeaderActions";
import { useBackground } from "@/contexts/BackgroundContext";
import { useIdentity } from "@/contexts/IdentityContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useMesh, type Message } from "@/contexts/MeshContext";
import { useTheme } from "@/contexts/ThemeContext";
import { avatarLetter } from "@/lib/ghost";
import { hueFromString } from "@/lib/ghost";

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = String(id);
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { t } = useLocale();
  const bg = useBackground();
  const { groups, sendGroupMessage, peers, renameGroup } = useMesh();
  const { identity } = useIdentity();
  const [text, setText] = useState<string>("");
  const [renameOpen, setRenameOpen] = useState(false);

  // Сколько участников группы прямо сейчас рядом — управляет силой
  // mesh-activity glow на заголовке.
  const membersNearby = useMemo(() => {
    const g = groups.find((x) => x.id === groupId);
    if (!g) return 0;
    const memberKeys = new Set(g.members.map((m) => m.publicKey));
    return peers.filter((p) => memberKeys.has(p.publicKey)).length;
  }, [groups, peers, groupId]);
  const meshActive = membersNearby > 0;
  const meshLevel = Math.min(1, membersNearby / 4);

  const group = useMemo(
    () => groups.find((g) => g.id === groupId),
    [groups, groupId],
  );

  const inverted = useMemo(
    () => [...(group?.messages ?? [])].reverse(),
    [group?.messages],
  );

  const send = () => {
    if (!text.trim()) return;
    sendGroupMessage(groupId, text);
    setText("");
  };

  if (!group)
    return (
      <AppBackground scopeId={`group:${groupId}`}>
        <View />
      </AppBackground>
    );

  return (
    <AppBackground scopeId={`group:${groupId}`}>
      <MeshActivityGlow active={meshActive} level={meshLevel} radius={0}>
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
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Feather name="chevron-left" size={22} color={tokens.text} />
          </Pressable>
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: tokens.accentSoft,
                borderColor: tokens.accent,
              },
            ]}
          >
            <Feather name="users" size={18} color={tokens.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={[styles.headerName, { color: tokens.text }]}
              numberOfLines={1}
            >
              {group.name}
            </Text>
            <Text style={[styles.headerSub, { color: tokens.accent }]}>
              {t("group.subtitle", { n: group.members.length })}
              {meshActive
                ? ` · ${t("group.inAir", { n: membersNearby })}`
                : ""}
            </Text>
          </View>
          <ScopeHeaderActions
            onRename={() => setRenameOpen(true)}
            onWallpaper={() => bg.pickFor(`group:${groupId}`)}
            hasWallpaper={!!bg.scopes[`group:${groupId}`]}
            onResetWallpaper={() => bg.resetFor(`group:${groupId}`)}
          />
        </View>
      </MeshActivityGlow>
      <RenameModal
        visible={renameOpen}
        initial={group.name}
        title={t("group.rename")}
        onClose={() => setRenameOpen(false)}
        onSubmit={(name) => renameGroup(groupId, name)}
      />

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
          renderItem={({ item }) => {
            const author =
              group.members.find((m) => m.publicKey === item.fromKey) ?? null;
            const mine = item.fromKey === identity?.publicKey;
            const authorName =
              author?.name ?? item.fromKey.slice(0, 6).toLowerCase();
            const authorHue =
              author?.avatarHue ?? hueFromString(item.fromKey);
            return (
              <GroupBubble
                msg={item}
                mine={mine}
                authorName={authorName}
                authorHue={authorHue}
              />
            );
          }}
        />

        <KeyboardStickyView
          offset={{ closed: 0, opened: 0 }}
          style={[styles.composerWrap, { paddingBottom: insets.bottom + 10 }]}
        >
          <GlassCard radius={26} intensity={70}>
            <View style={styles.composer}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t("group.composer")}
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

function GroupBubble({
  msg,
  mine,
  authorName,
  authorHue,
}: {
  msg: Message;
  mine: boolean;
  authorName: string;
  authorHue: number;
}) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.bubbleRow, mine && { justifyContent: "flex-end" }]}>
      {!mine ? (
        <Avatar hue={authorHue} letter={avatarLetter(authorName)} size={28} />
      ) : null}
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
        {!mine ? (
          <Text style={[styles.author, { color: `hsl(${authorHue},70%,72%)` }]}>
            {authorName}
          </Text>
        ) : null}
        <Text style={[styles.bubbleText, { color: tokens.text }]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, { color: tokens.textFaint }]}>
          {new Date(msg.ts).toTimeString().slice(0, 5)}
        </Text>
      </View>
    </View>
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
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  headerSub: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 },
  list: { paddingHorizontal: 12, paddingTop: 12, flexGrow: 1 },
  bubbleRow: {
    flexDirection: "row",
    paddingVertical: 4,
    alignItems: "flex-end",
    gap: 8,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  author: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginBottom: 4 },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 19 },
  bubbleTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  composerWrap: { paddingHorizontal: 12, paddingTop: 6 },
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
    paddingHorizontal: 10,
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
