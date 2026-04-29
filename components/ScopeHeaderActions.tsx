import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

function tap() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

type Props = {
  onWallpaper: () => void;
  hasWallpaper?: boolean;
  onResetWallpaper?: () => void;
  onRename?: () => void;
};

export function ScopeHeaderActions({
  onWallpaper,
  hasWallpaper,
  onResetWallpaper,
  onRename,
}: Props) {
  const { tokens } = useTheme();
  return (
    <View style={styles.row}>
      {onRename ? (
        <Pressable
          onPress={() => {
            tap();
            onRename();
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.btn,
            { borderColor: tokens.cardBorder, backgroundColor: tokens.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="edit-2" size={14} color={tokens.text} />
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => {
          tap();
          onWallpaper();
        }}
        hitSlop={6}
        style={({ pressed }) => [
          styles.btn,
          { borderColor: tokens.cardBorder, backgroundColor: tokens.surface },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Feather name="image" size={14} color={tokens.text} />
      </Pressable>
      {hasWallpaper && onResetWallpaper ? (
        <Pressable
          onPress={() => {
            tap();
            onResetWallpaper();
          }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.btn,
            { borderColor: tokens.cardBorder, backgroundColor: tokens.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="x" size={14} color={tokens.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
