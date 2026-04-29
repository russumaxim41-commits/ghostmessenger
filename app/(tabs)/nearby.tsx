import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { GlassCard } from "@/components/GlassCard";
import { SonarRadar } from "@/components/SonarRadar";
import { useLocale } from "@/contexts/LocaleContext";
import { useMesh, type Peer } from "@/contexts/MeshContext";
import { useTheme } from "@/contexts/ThemeContext";
import { avatarLetter } from "@/lib/ghost";
import { tapMaterial } from "@/lib/haptics";
import {
  getCachedReputationScore,
  getCachedTrusted,
  loadReputation,
  setTrusted,
} from "@/lib/reputation";

function rssiToBars(rssi: number): number {
  if (rssi > -50) return 4;
  if (rssi > -65) return 3;
  if (rssi > -78) return 2;
  return 1;
}

export default function NearbyScreen() {
  const {
    peers,
    bleOn,
    wifiOn,
    setBleOn,
    setWifiOn,
    transportAvailable,
    transportReason,
    refreshScan,
    openChatWith,
  } = useMesh();
  const { tokens } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? Math.max(insets.top, 64) : insets.top;
  const bottom = (Platform.OS === "web" ? 84 : insets.bottom + 88) + 16;

  const [repTick, setRepTick] = useState(0);
  useEffect(() => {
    loadReputation()
      .then(() => setRepTick((t) => t + 1))
      .catch(() => {});
  }, []);

  // Сортируем «по полезности» (reputation score), а при равенстве — по
  // силе сигнала. Доверенные узлы получают сильный буст.
  const ordered = useMemo(() => {
    void repTick; // зависимость на пересчёт после загрузки
    return [...peers].sort((a, b) => {
      const sa =
        getCachedReputationScore(a.publicKey) +
        (getCachedTrusted(a.publicKey) ? 50 : 0);
      const sb =
        getCachedReputationScore(b.publicKey) +
        (getCachedTrusted(b.publicKey) ? 50 : 0);
      if (Math.abs(sa - sb) > 0.01) return sb - sa;
      return b.rssi - a.rssi;
    });
  }, [peers, repTick]);

  const isOn = bleOn || wifiOn;
  const headline = isOn
    ? transportAvailable
      ? t("nearby.head.searching")
      : t("nearby.head.unavailable")
    : t("nearby.head.off");
  const sub =
    isOn && !transportAvailable && transportReason
      ? transportReason
      : t("nearby.subline", {
          wifi: wifiOn ? t("common.on") : t("common.off"),
          ble: bleOn ? t("common.on") : t("common.off"),
        });

  const toggleAll = () => {
    tapMaterial("metal");
    const next = !isOn;
    setBleOn(next);
    setWifiOn(next);
  };

  const onToggleTrust = async (publicKey: string) => {
    tapMaterial("glossy");
    const cur = getCachedTrusted(publicKey);
    await setTrusted(publicKey, !cur);
    setRepTick((t) => t + 1);
  };

  return (
    <AppBackground scopeId="tab.nearby">
      <View style={{ paddingTop: top + 16, paddingHorizontal: 22 }}>
        <Text style={[styles.title, { color: tokens.text }]}>
          {t("nearby.title")}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <GlassCard radius={20} intensity={50}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isOn && transportAvailable
                    ? tokens.accent
                    : tokens.textFaint,
                },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusHead, { color: tokens.text }]}>
                {headline}
              </Text>
              <Text style={[styles.statusSub, { color: tokens.textMuted }]}>
                {sub}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                tapMaterial("matte");
                if (isOn) refreshScan();
                else toggleAll();
              }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.refreshBtn,
                {
                  backgroundColor: tokens.accent,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather
                name={isOn ? "refresh-cw" : "power"}
                size={14}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </GlassCard>
      </View>

      <FlatList
        data={ordered}
        keyExtractor={(p) => p.publicKey}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottom },
          ordered.length === 0 && { flexGrow: 1, justifyContent: "flex-start" },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <GlassCard radius={22} intensity={50}>
              <View style={styles.empty}>
                <SonarRadar size={96} active={isOn && transportAvailable} />
                <Text style={[styles.emptyTitle, { color: tokens.text }]}>
                  {t("nearby.empty.title")}
                </Text>
                <Text style={[styles.emptyHint, { color: tokens.textMuted }]}>
                  {t("nearby.empty.hint")}
                </Text>
                {!isOn ? (
                  <Pressable
                    onPress={toggleAll}
                    style={({ pressed }) => [
                      styles.emptyCta,
                      {
                        backgroundColor: tokens.accent,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Feather name="power" size={14} color="#FFF" />
                    <Text style={styles.emptyCtaText}>
                      {t("nearby.empty.cta")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </GlassCard>
          </View>
        }
        renderItem={({ item }) => (
          <PeerRow
            peer={item}
            trusted={getCachedTrusted(item.publicKey)}
            score={getCachedReputationScore(item.publicKey)}
            onPress={() => {
              tapMaterial("glossy");
              openChatWith(item);
              router.push(`/chat/${item.publicKey}`);
            }}
            onToggleTrust={() => onToggleTrust(item.publicKey)}
          />
        )}
      />
    </AppBackground>
  );
}

function PeerRow({
  peer,
  trusted,
  score,
  onPress,
  onToggleTrust,
}: {
  peer: Peer;
  trusted: boolean;
  score: number;
  onPress: () => void;
  onToggleTrust: () => void;
}) {
  const { tokens } = useTheme();
  const bars = rssiToBars(peer.rssi);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onToggleTrust}
      delayLongPress={420}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <GlassCard radius={18} intensity={45} accentEdge={trusted}>
        <View style={styles.peerRow}>
          <Avatar
            hue={peer.avatarHue}
            letter={avatarLetter(peer.name)}
            size={42}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.nameLine}>
              <Text
                style={[styles.peerName, { color: tokens.text }]}
                numberOfLines={1}
              >
                {peer.name}
              </Text>
              {trusted ? (
                <Feather name="shield" size={11} color={tokens.accent} />
              ) : null}
              {score > 5 ? (
                <View
                  style={[
                    styles.repPip,
                    { backgroundColor: tokens.accentSoft, borderColor: tokens.accent },
                  ]}
                >
                  <Feather name="zap" size={9} color={tokens.accent} />
                </View>
              ) : null}
            </View>
            <Text style={[styles.peerId, { color: tokens.textMuted }]} numberOfLines={1}>
              ID: {peer.shortId}  ·  {peer.via}  ·  {peer.rssi} dBm
            </Text>
          </View>
          <View style={styles.bars}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: 4 + i * 3,
                    backgroundColor:
                      i <= bars ? tokens.accent : tokens.cardBorder,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: "Inter_700Bold", fontSize: 32, letterSpacing: -1 },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusHead: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  statusSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 3,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  list: { paddingHorizontal: 16, paddingTop: 12 },
  peerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  peerName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  peerId: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  repPip: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 18 },
  bar: { width: 3, borderRadius: 2 },

  empty: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 26,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    marginTop: 18,
    marginBottom: 8,
  },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 16,
  },
  emptyCtaText: {
    color: "#FFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
