import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { QuickGlassSheet } from "@/components/QuickGlassSheet";
import { useTheme } from "@/contexts/ThemeContext";

export function FloatingDrop() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const bottom = (Platform.OS === "web" ? 84 : insets.bottom + 84) + 12;

  return (
    <>
      <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
            }
            setOpen((v) => !v);
          }}
          style={({ pressed }) => [pressed && { transform: [{ scale: 0.95 }] }]}
        >
          <GlassCard radius={28} intensity={50}>
            <View style={styles.btn}>
              <Feather
                name="droplet"
                size={20}
                color={tokens.text}
              />
            </View>
          </GlassCard>
        </Pressable>
      </View>
      <QuickGlassSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    zIndex: 50,
  },
  btn: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
