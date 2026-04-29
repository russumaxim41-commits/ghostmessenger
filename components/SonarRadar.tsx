import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  size?: number;
  active?: boolean;
};

/**
 * Stealth Discovery — Sonar.
 *
 * Минималистичный радар: круговая «развёртка» (sweep beam) вращается по
 * часовой, поверх — расходящиеся импульсы. Когда активен, ловит
 * взгляд; когда выключен — приглушённое статичное состояние.
 *
 * Никаких Skia-зависимостей: только Animated + чистые View с conic-style
 * градиентом, эмулированным через несколько «лучей».
 */
export function SonarRadar({ size = 96, active = true }: Props) {
  const { tokens } = useTheme();
  const sweep = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      sweep.setValue(0);
      pulse.setValue(0);
      return;
    }
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    sweepLoop.start();
    pulseLoop.start();
    return () => {
      sweepLoop.stop();
      pulseLoop.stop();
    };
  }, [active, sweep, pulse]);

  const accent = active ? tokens.accent : tokens.textFaint;
  const soft = active ? tokens.accentSoft : "rgba(120,120,140,0.18)";

  const rotate = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // концентрические «кольца» сетки радара
  const rings = [0.35, 0.6, 0.85].map((r, i) => (
    <View
      key={i}
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          margin: (size * (1 - r)) / 2,
          borderRadius: size,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: active ? "rgba(168,85,247,0.35)" : tokens.cardBorder,
        },
      ]}
    />
  ));

  // sweep beam — длинный «луч», поворачивающийся вокруг центра
  const beam = (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          transform: [{ rotate }],
        },
      ]}
    >
      <View
        style={{
          position: "absolute",
          left: size / 2,
          top: size / 2,
          width: size / 2,
          height: 2,
          backgroundColor: accent,
          opacity: active ? 0.7 : 0.2,
          shadowColor: accent,
          shadowOpacity: 0.8,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
      {/* затухающий «след» луча — три фрагмента под разным углом */}
      {[0.85, 0.6, 0.35].map((alpha, idx) => (
        <View
          key={idx}
          style={{
            position: "absolute",
            left: size / 2,
            top: size / 2,
            width: size / 2,
            height: 1,
            backgroundColor: accent,
            opacity: active ? 0.18 * alpha : 0,
            transform: [{ rotate: `${-(idx + 1) * 6}deg` }],
          }}
        />
      ))}
    </Animated.View>
  );

  // пульс
  const pulseRing = (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: size,
          borderWidth: 1,
          borderColor: accent,
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 0],
          }),
          transform: [
            {
              scale: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1.1],
              }),
            },
          ],
        },
      ]}
    />
  );

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* фон-«стекло» радара */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: soft,
          borderWidth: 1,
          borderColor: accent,
        }}
      />
      {rings}
      {/* центральная иконка */}
      <View
        style={{
          width: size * 0.32,
          height: size * 0.32,
          borderRadius: size,
          backgroundColor: soft,
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
        }}
      >
        <Feather name="radio" size={size * 0.18} color={accent} />
      </View>
      {beam}
      {pulseRing}
    </View>
  );
}
