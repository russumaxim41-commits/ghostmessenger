import { router } from "expo-router";
import React, { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { panicWipe } from "@/lib/panic";

type Props = {
  /** ширина невидимой триггерной зоны сверху */
  height?: number;
  /** сколько тапов подряд за окно для срабатывания */
  taps?: number;
  /** окно регистрации тапов в ms */
  windowMs?: number;
};

/**
 * Невидимая зона над статус-баром: 5 быстрых тапов подряд → Panic Wipe.
 * Жест намеренно скрыт от посторонних глаз — это «аварийный» механизм.
 */
export function PanicGate({
  height = 28,
  taps = 5,
  windowMs = 1500,
}: Props) {
  const stamps = useRef<number[]>([]);

  const onTap = () => {
    const now = Date.now();
    stamps.current = stamps.current.filter((t) => now - t < windowMs);
    stamps.current.push(now);
    if (stamps.current.length >= taps) {
      stamps.current = [];
      panicWipe().finally(() => {
        // мягко перевозим на онбординг — все данные уже стёрты
        router.replace("/onboarding");
      });
    }
  };

  return (
    <View style={[styles.zone, { height }]} pointerEvents="box-none">
      <Pressable
        onPress={onTap}
        style={StyleSheet.absoluteFill}
        // не показываем визуальный отклик — жест должен быть незаметным
        android_disableSound
        hitSlop={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
