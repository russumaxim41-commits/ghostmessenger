import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "@/components/AppBackground";
import { GlassCard } from "@/components/GlassCard";
import { useLocale } from "@/contexts/LocaleContext";
import {
  useMesh,
  type Channel,
  type Group,
} from "@/contexts/MeshContext";
import { useTheme } from "@/contexts/ThemeContext";
import { copyToClipboard } from "@/lib/ghost";

type Mode = "group" | "channel" | "link";

export default function GroupsScreen() {
  const { groups, channels, createGroup, createChannel, joinByLink, shareLink } =
    useMesh();
  const { tokens } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? Math.max(insets.top, 64) : insets.top;
  const bottom = (Platform.OS === "web" ? 84 : insets.bottom + 88) + 16;

  const [modalMode, setModalMode] = useState<Mode | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");

  const closeModal = () => {
    setModalMode(null);
    setName("");
    setDesc("");
    setLink("");
  };

  const submit = async () => {
    if (!modalMode) return;
    if (modalMode === "group") {
      const id = createGroup(name);
      closeModal();
      router.push(`/group/${id}`);
    } else if (modalMode === "channel") {
      const id = createChannel(name, desc);
      closeModal();
      router.push(`/channel/${id}`);
    } else if (modalMode === "link") {
      const res = await joinByLink(link.trim());
      closeModal();
      if (!res.ok) {
        if (Platform.OS === "web") {
          // eslint-disable-next-line no-alert
          window.alert(res.reason ?? t("groups.modal.failTitle"));
        } else {
          Alert.alert(
            t("groups.modal.failTitle"),
            res.reason ?? t("groups.modal.failBody"),
          );
        }
      }
    }
  };

  const data: Array<
    | { kind: "group"; item: Group }
    | { kind: "channel"; item: Channel }
  > = [
    ...groups.map((item) => ({ kind: "group" as const, item })),
    ...channels.map((item) => ({ kind: "channel" as const, item })),
  ];

  return (
    <AppBackground scopeId="tab.groups">
      <View style={{ paddingTop: top + 16, paddingHorizontal: 22 }}>
        <Text style={[styles.title, { color: tokens.text }]}>
          {t("groups.title")}
        </Text>
        <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
          {t("groups.subtitle")}
        </Text>
      </View>

      <View style={styles.pillsWrap}>
        <PillBtn
          icon="users"
          label={t("groups.btn.group")}
          onPress={() => setModalMode("group")}
        />
        <PillBtn
          icon="hash"
          label={t("groups.btn.channel")}
          onPress={() => setModalMode("channel")}
        />
        <PillBtn
          icon="link"
          label={t("groups.btn.link")}
          onPress={() => setModalMode("link")}
        />
      </View>

      <FlatList
        data={data}
        keyExtractor={(d) => `${d.kind}:${d.item.id}`}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottom },
          data.length === 0 && { flexGrow: 1, justifyContent: "center" },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<EmptyGroups />}
        renderItem={({ item }) =>
          item.kind === "group" ? (
            <GroupRow group={item.item} shareLink={shareLink} />
          ) : (
            <ChannelRow channel={item.item} shareLink={shareLink} />
          )
        }
      />

      <CreateModal
        mode={modalMode}
        name={name}
        desc={desc}
        link={link}
        setName={setName}
        setDesc={setDesc}
        setLink={setLink}
        onClose={closeModal}
        onSubmit={submit}
      />
    </AppBackground>
  );
}

function PillBtn({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.75 }]}
    >
      <GlassCard radius={18} intensity={45}>
        <View style={styles.pill}>
          <Feather name={icon} size={15} color={tokens.accent} />
          <Text style={[styles.pillText, { color: tokens.text }]}>{label}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function GroupRow({
  group,
  shareLink,
}: {
  group: Group;
  shareLink: (k: "group" | "channel", id: string) => string;
}) {
  const { tokens } = useTheme();
  const { t } = useLocale();
  const last = group.messages[group.messages.length - 1];
  return (
    <Pressable
      onPress={() => router.push(`/group/${group.id}`)}
      onLongPress={() => copyToClipboard(shareLink("group", group.id))}
      style={({ pressed }) => [pressed && { opacity: 0.75 }]}
    >
      <GlassCard radius={20} intensity={45}>
        <View style={styles.itemRow}>
          <View
            style={[
              styles.itemIcon,
              {
                backgroundColor: tokens.accentSoft,
                borderColor: tokens.accent,
              },
            ]}
          >
            <Feather name="users" size={18} color={tokens.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: tokens.text }]} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={[styles.itemSub, { color: tokens.textMuted }]} numberOfLines={1}>
              {t("groups.row.members", { n: group.members.length })}
              {last ? ` · ${last.text}` : ""}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={tokens.textFaint} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

function ChannelRow({
  channel,
  shareLink,
}: {
  channel: Channel;
  shareLink: (k: "group" | "channel", id: string) => string;
}) {
  const { tokens } = useTheme();
  const { t } = useLocale();
  return (
    <Pressable
      onPress={() => router.push(`/channel/${channel.id}`)}
      onLongPress={() => copyToClipboard(shareLink("channel", channel.id))}
      style={({ pressed }) => [pressed && { opacity: 0.75 }]}
    >
      <GlassCard radius={20} intensity={45}>
        <View style={styles.itemRow}>
          <View
            style={[
              styles.itemIcon,
              {
                backgroundColor: tokens.accentSoft,
                borderColor: tokens.accent,
              },
            ]}
          >
            <Feather name="hash" size={18} color={tokens.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: tokens.text }]} numberOfLines={1}>
              {channel.name}
            </Text>
            <Text style={[styles.itemSub, { color: tokens.textMuted }]} numberOfLines={1}>
              {t("groups.row.channel", { n: channel.posts.length })}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={tokens.textFaint} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

function EmptyGroups() {
  const { tokens } = useTheme();
  const { t } = useLocale();
  return (
    <View style={styles.empty}>
      <Feather
        name="users"
        size={28}
        color={tokens.textMuted}
        style={{ marginBottom: 14 }}
      />
      <Text style={[styles.emptyTitle, { color: tokens.text }]}>
        {t("groups.empty.title")}
      </Text>
      <Text style={[styles.emptyHint, { color: tokens.textMuted }]}>
        {t("groups.empty.hint")}
      </Text>
    </View>
  );
}

function CreateModal({
  mode,
  name,
  desc,
  link,
  setName,
  setDesc,
  setLink,
  onClose,
  onSubmit,
}: {
  mode: Mode | null;
  name: string;
  desc: string;
  link: string;
  setName: (v: string) => void;
  setDesc: (v: string) => void;
  setLink: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { tokens } = useTheme();
  const { t } = useLocale();
  const visible = mode !== null;
  const titleMap: Record<Mode, string> = {
    group: t("groups.modal.newGroup"),
    channel: t("groups.modal.newChannel"),
    link: t("groups.modal.joinLink"),
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalWrap} pointerEvents="box-none">
        <GlassCard radius={26} intensity={70}>
          <View style={{ padding: 20 }}>
            <Text style={[styles.modalTitle, { color: tokens.text }]}>
              {mode ? titleMap[mode] : ""}
            </Text>
            <View style={{ height: 14 }} />
            {mode === "link" ? (
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder="ghost://group/..."
                placeholderTextColor={tokens.textFaint}
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    color: tokens.text,
                    borderColor: tokens.cardBorder,
                    backgroundColor: tokens.surface,
                  },
                ]}
              />
            ) : (
              <>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t("groups.modal.namePlaceholder")}
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
                {mode === "channel" ? (
                  <>
                    <View style={{ height: 10 }} />
                    <TextInput
                      value={desc}
                      onChangeText={setDesc}
                      placeholder={t("groups.modal.descPlaceholder")}
                      placeholderTextColor={tokens.textFaint}
                      multiline
                      style={[
                        styles.input,
                        {
                          color: tokens.text,
                          borderColor: tokens.cardBorder,
                          backgroundColor: tokens.surface,
                          minHeight: 70,
                          textAlignVertical: "top",
                        },
                      ]}
                    />
                  </>
                ) : null}
              </>
            )}
            <View style={{ height: 16 }} />
            <View style={styles.modalActions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.modalBtn,
                  {
                    backgroundColor: "transparent",
                    borderColor: tokens.cardBorder,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: tokens.text }]}>
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={onSubmit}
                style={({ pressed }) => [
                  styles.modalBtn,
                  {
                    backgroundColor: tokens.accent,
                    borderColor: tokens.accent,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: "#FFF" }]}>
                  {mode === "link" ? t("groups.modal.join") : t("common.create")}
                </Text>
              </Pressable>
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1 },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 6,
  },
  pillsWrap: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
  },
  pillText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  list: { paddingHorizontal: 16, paddingTop: 18 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  itemName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  itemSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3 },

  empty: { alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 6 },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "30%",
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
