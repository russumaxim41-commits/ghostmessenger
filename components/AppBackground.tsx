import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

import { useBackground } from "@/contexts/BackgroundContext";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  scopeId?: string;
  children: React.ReactNode;
};

export function AppBackground({ scopeId, children }: Props) {
  const { uriFor } = useBackground();
  const { tokens, resolved } = useTheme();
  const uri = uriFor(scopeId);

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          fadeDuration={0}
        />
      ) : (
        <LinearGradient
          colors={
            resolved === "light"
              ? ["#EAE3FA", "#D8D0F2", "#C4BBE5"]
              : ["#0a0a12", "#101018", "#1a1623"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* Уровень читаемости поверх фото */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              resolved === "light"
                ? "rgba(244,241,250,0.35)"
                : "rgba(0,0,0,0.45)",
          },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
