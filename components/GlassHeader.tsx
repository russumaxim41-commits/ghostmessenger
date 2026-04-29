import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function GlassHeader({ title, subtitle, right }: Props) {
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  return (
    <View style={[styles.wrap, { paddingTop: top + 8 }]}>
      <GlassCard
        style={styles.card}
        radius={28}
        intensity={70}
      >
        <View style={styles.row}>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textWrap: {
    flexShrink: 1,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
