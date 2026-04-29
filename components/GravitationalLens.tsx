import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { tapDistortion } from "@/lib/haptics";

type Props = {
  onActivate: () => void;
  children: React.ReactNode;
  /** ms удержания до активации */
  holdMs?: number;
  /** размер «линзы» в пикселях */
  size?: number;
};

/**
 * Long-Press Distortion: при удержании пальца под пальцем рисуется
 * радиальное «гравитационное искажение» — мягкая линза с увеличением и
 * тонкими хроматическими аберрациями. Когда удержание выдерживает
 * holdMs, вызывается onActivate (например, открыть панель кастомизации).
 *
 * Реализовано без Skia: на чистом RN (Animated + LinearGradient + View
 * с overflow: hidden), что работает в Expo Go и в нативных сборках.
 */
export function GravitationalLens({
  onActivate,
  children,
  holdMs = 480,
  size = 180,
}: Props) {
  const { tokens } = useTheme();
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const start = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    setCenter({ x: locationX, y: locationY });
    Animated.timing(progress, {
      toValue: 1,
      duration: holdMs,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    timerRef.current = setTimeout(() => {
      tapDistortion();
      Animated.sequence([
        Animated.timing(ripple, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ripple, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCenter(null);
        progress.setValue(0);
        onActivate();
      });
    }, holdMs);
  };

  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setCenter(null));
  };

  const lensScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  const rippleScale = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.0, 0.7],
  });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      delayLongPress={9999}
      style={{ flex: 1 }}
    >
      {children}
      {center && Platform.OS !== "web" ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* Внешний halo (chromatic aberration via two soft gradients) */}
          <Animated.View
            style={[
              styles.lens,
              {
                left: center.x - size / 2,
                top: center.y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity,
                transform: [{ scale: lensScale }],
                shadowColor: tokens.accent,
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(168,85,247,0.45)",
                "rgba(168,85,247,0.18)",
                "rgba(168,85,247,0.0)",
              ]}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: size / 2,
                  borderWidth: 1,
                  borderColor: "rgba(168,85,247,0.45)",
                },
              ]}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: size / 2,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: "rgba(255,255,255,0.45)",
                  transform: [{ scale: 0.94 }],
                },
              ]}
            />
          </Animated.View>
          {/* Финальный ripple при срабатывании */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ripple,
              {
                left: center.x - size / 2,
                top: center.y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity: ripple.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.55],
                }),
                transform: [{ scale: rippleScale }],
                borderColor: tokens.accent,
              },
            ]}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lens: {
    position: "absolute",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
  },
  ripple: {
    position: "absolute",
    borderWidth: 1.2,
  },
});
