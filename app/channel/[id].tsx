import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Animated,
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
import { RenameModal } from "@/components/RenameModal";
import { ScopeHeaderActions } from "@/components/ScopeHeaderActions";
import { useBackground } from "@/contexts/BackgroundContext";
import { useIdentity } from "@/contexts/IdentityContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useMesh, type ChannelPost } from "@/contexts/MeshContext";
import { useTheme } from "@/contexts/ThemeContext";
import { avatarLetter } from "@/lib/ghost";

function tap() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const channelId = String(id);
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { t } = useLocale();
  const bg = useBackground();
  const { channels, postToChannel, reactToPost, renameChannel } = useMesh();
  const { identity } = useIdentity();
  const [text, setText] = useState<string>("");
  const [renameOpen, setRenameOpen] = useState(false);

  // Скорость скролла → лёгкий 3D-наклон карточек на оси X.
  // Используем onScroll + Animated.event с useNativeDriver=true,
  // вычисляя дельту через interpolated diffClamp.
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const lastY = React.useRef(0);
  const velocity = React.useRef(new Animated.Value(0)).current;
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const dy = y - lastY.current;
        lastY.current = y;
        // нормализуем дельту в диапазон [-1..1]
        const v = Math.max(-1, Math.min(1, dy / 18));
        velocity.setValue(v);
      },
    },
  );

  // плавно возвращаем к нулю
  React.useEffect(() => {
    const id = setInterval(() => {
      // @ts-ignore — приватный, но работает для мягкого затухания
      const cur = velocity._value as number | undefined;
      if (typeof cur === "number" && Math.abs(cur) > 0.001) {
        velocity.setValue(cur * 0.7);
      }
    }, 60);
    return () => clearInterval(id);
  }, [velocity]);

  const channel = useMemo(
    () => channels.find((c) => c.id === channelId),
    [channels, channelId],
  );

  const isOwner = channel?.ownerKey === identity?.publicKey;

  const send = () => {
    if (!text.trim()) return;
    tap();
    postToChannel(channelId, text);
    setText("");
  };

  if (!channel)
    return (
      <AppBackground scopeId={`channel:${channelId}`}>
        <View />
      </AppBackground>
    );

  return (
    <AppBackground scopeId={`channel:${channelId}`}>
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
            tap();
            router.back();
          }}
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
          <Feather name="hash" size={18} color={tokens.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerName, { color: tokens.text }]}>
            {channel.name}
          </Text>
          <Text style={[styles.headerSub, { color: tokens.accent }]}>
            {t("channel.subtitle", { n: channel.posts.length })}
          </Text>
        </View>
        <ScopeHeaderActions
          onRename={isOwner ? () => setRenameOpen(true) : undefined}
          onWallpaper={() => bg.pickFor(`channel:${channelId}`)}
          hasWallpaper={!!bg.scopes[`channel:${channelId}`]}
          onResetWallpaper={() => bg.resetFor(`channel:${channelId}`)}
        />
      </View>
      <RenameModal
        visible={renameOpen}
        initial={channel.name}
        title={t("channel.rename")}
        onClose={() => setRenameOpen(false)}
        onSubmit={(name) => renameChannel(channelId, name)}
      />

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <Animated.FlatList
          data={channel.posts}
          keyExtractor={(p: ChannelPost) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          ListHeaderComponent={
            channel.description ? (
              <View style={{ marginBottom: 14 }}>
                <GlassCard radius={20} intensity={45} padded>
                  <Text style={[styles.descText, { color: tokens.textMuted }]}>
                    {channel.description}
                  </Text>
                </GlassCard>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather
                name="hash"
                size={28}
                color={tokens.textMuted}
                style={{ marginBottom: 14 }}
              />
              <Text style={[styles.emptyTitle, { color: tokens.text }]}>
                {t("channel.empty.title")}
              </Text>
              <Text style={[styles.emptyHint, { color: tokens.textMuted }]}>
                {isOwner
                  ? t("channel.empty.hintOwner")
                  : t("channel.empty.hintMember")}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: ChannelPost }) => (
            <TiltedPost
              post={item}
              velocity={velocity}
              onReact={(k) => {
                tap();
                reactToPost(channelId, item.id, k);
              }}
            />
          )}
        />

        {isOwner ? (
          <KeyboardStickyView
            offset={{ closed: 0, opened: 0 }}
            style={[
              styles.composerWrap,
              { paddingBottom: insets.bottom + 10 },
            ]}
          >
            <GlassCard radius={26} intensity={70}>
              <View style={styles.composer}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={t("channel.composer")}
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
        ) : null}
      </KeyboardAvoidingView>
    </AppBackground>
  );
}

function TiltedPost({
  post,
  velocity,
  onReact,
}: {
  post: ChannelPost;
  velocity: Animated.Value;
  onReact: (kind: "fire" | "ghost" | "bolt") => void;
}) {
  // 3D-наклон по оси X в зависимости от скорости скролла.
  // Лёгкая инерция: max ~6°.
  const rotateX = velocity.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["6deg", "0deg", "-6deg"],
  });
  const translateY = velocity.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-3, 0, 3],
  });
  return (
    <Animated.View
      style={{
        transform: [{ perspective: 800 }, { rotateX }, { translateY }],
      }}
    >
      <PostCard post={post} onReact={onReact} />
    </Animated.View>
  );
}

function PostCard({
  post,
  onReact,
}: {
  post: ChannelPost;
  onReact: (kind: "fire" | "ghost" | "bolt") => void;
}) {
  const { tokens } = useTheme();
  return (
    <GlassCard radius={22} intensity={50}>
      <View style={styles.post}>
        <View style={styles.postHead}>
          <Avatar
            hue={post.authorHue}
            letter={avatarLetter(post.authorName)}
            size={36}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.author, { color: tokens.text }]}>
              {post.authorName}
            </Text>
            <Text style={[styles.meta, { color: tokens.textMuted }]}>
              {formatTime(post.ts)}
            </Text>
          </View>
        </View>
        <Text style={[styles.body, { color: tokens.text }]}>{post.text}</Text>
        <View style={styles.reactRow}>
          <ReactBtn
            icon="zap"
            count={post.reactions.bolt}
            onPress={() => onReact("bolt")}
          />
          <ReactBtn
            icon="moon"
            count={post.reactions.ghost}
            onPress={() => onReact("ghost")}
          />
          <ReactBtn
            icon="cloud-lightning"
            count={post.reactions.fire}
            onPress={() => onReact("fire")}
          />
        </View>
      </View>
    </GlassCard>
  );
}

function ReactBtn({
  icon,
  count,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  count: number;
  onPress: () => void;
}) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.reactBtn,
        {
          backgroundColor: tokens.accentSoft,
          borderColor: tokens.accent,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Feather name={icon} size={13} color={tokens.accent} />
      <Text style={[styles.reactCount, { color: tokens.text }]}>{count}</Text>
    </Pressable>
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
  headerName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  headerSub: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: 2 },
  list: { padding: 14 },
  descText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  post: { padding: 16 },
  postHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  author: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  reactRow: { flexDirection: "row", gap: 8 },
  reactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  reactCount: { fontFamily: "Inter_600SemiBold", fontSize: 11 },

  empty: { alignItems: "center", paddingHorizontal: 40, paddingTop: 60 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 6 },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
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
