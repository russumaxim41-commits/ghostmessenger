import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  active: boolean;
  /** интенсивность 0..1 — связано с активностью узлов */
  level?: number;
  radius?: number;
  style?: ViewStyle;
  children: React.ReactNode;
};

/**
 * Mesh Activity Glow — мягкое внешнее свечение под групповым/канальным
 * заголовком, появляющееся, когда рядом есть активные mesh-узлы.
 * Уровень `level` управляет амплитудой пульсации.
 */
export function MeshActivityGlow({
  active,
  level = 0.5,
  radius = 24,
  style,
  children,
}: Props) {
  const { tokens } = useTheme();
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      a.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(a, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, a]);

  const intensity = Math.max(0, Math.min(1, level));

  return (
    <View style={[styles.wrap, style]}>
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              backgroundColor: tokens.accentSoft,
              opacity: a.interpolate({
                inputRange: [0, 1],
                outputRange: [0.18 * intensity, 0.55 * intensity],
              }),
              transform: [
                {
                  scale: a.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.04],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderWidth: 1,
              borderColor: tokens.accent,
              opacity: a.interpolate({
                inputRange: [0, 1],
                outputRange: [0.25 * intensity, 0.7 * intensity],
              }),
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
});
