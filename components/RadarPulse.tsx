import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  size?: number;
  active?: boolean;
};

/**
 * Радар: пульсирующая иконка с тремя расходящимися кругами.
 * При active=false — статичный приглушённый вариант.
 */
export function RadarPulse({ size = 64, active = true }: Props) {
  const { tokens } = useTheme();
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      a1.setValue(0);
      a2.setValue(0);
      a3.setValue(0);
      return;
    }
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    const a = make(a1, 0);
    const b = make(a2, 700);
    const c = make(a3, 1400);
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [active, a1, a2, a3]);

  const ring = (val: Animated.Value, color: string) => (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          borderRadius: size,
          borderWidth: 1.5,
          borderColor: color,
          opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
          transform: [
            { scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) },
          ],
        },
      ]}
    />
  );

  const accent = active ? tokens.accent : tokens.textFaint;
  const soft = active ? tokens.accentSoft : "rgba(120,120,140,0.18)";

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ring(a1, accent)}
      {ring(a2, accent)}
      {ring(a3, accent)}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: soft,
          borderWidth: 1,
          borderColor: accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="radio" size={size * 0.4} color={accent} />
      </View>
    </View>
  );
}
