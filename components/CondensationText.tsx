import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  text: string;
  /** ms на проявление одного символа */
  perChar?: number;
  /** размер шрифта */
  fontSize?: number;
  /** цвет (по умолчанию tokens.text) */
  color?: string;
  /** подсказка-плейсхолдер, когда text пустой */
  placeholder?: string;
};

/**
 * Organic Typography — Condensation effect.
 *
 * Каждый новый символ «проявляется из тумана»: blur → 0, opacity → 1,
 * translateY → 0. Используется как декоративный «зеркальный» дисплей
 * над полем ввода, не подменяя сам TextInput.
 */
export function CondensationText({
  text,
  perChar = 60,
  fontSize = 14,
  color,
  placeholder,
}: Props) {
  const { tokens } = useTheme();
  const display = text.length > 0 ? text : placeholder ?? "";
  const isPlaceholder = text.length === 0;

  // Фиксируем массив анимированных значений длиной max(40, length)
  const animsRef = useRef<Animated.Value[]>([]);
  if (animsRef.current.length < display.length) {
    while (animsRef.current.length < display.length) {
      animsRef.current.push(new Animated.Value(0));
    }
  }

  // На каждое изменение text запускаем «проявление» новых символов
  useEffect(() => {
    const len = display.length;
    for (let i = 0; i < len; i++) {
      const a = animsRef.current[i]!;
      // если уже проявлен — не трогаем
      // @ts-ignore — _value private, но стабильный API в RN
      if (a._value < 1) {
        Animated.timing(a, {
          toValue: 1,
          duration: 320,
          delay: i * perChar,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    }
    // если пользователь стёр символы — сбросим хвост
    for (let i = len; i < animsRef.current.length; i++) {
      animsRef.current[i]!.setValue(0);
    }
  }, [display, perChar]);

  const chars = useMemo(() => display.split(""), [display]);

  return (
    <View style={styles.row} pointerEvents="none">
      {chars.map((ch, i) => {
        const a = animsRef.current[i] ?? new Animated.Value(1);
        return (
          <Animated.Text
            key={`${i}-${ch}`}
            style={{
              fontFamily: "Inter_400Regular",
              fontSize,
              color: isPlaceholder ? tokens.textFaint : (color ?? tokens.text),
              opacity: a.interpolate({
                inputRange: [0, 1],
                outputRange: [0, isPlaceholder ? 0.55 : 1],
              }),
              transform: [
                {
                  translateY: a.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, 0],
                  }),
                },
                {
                  scale: a.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
              // имитация blur через текстовую тень (RN не имеет text-blur)
              textShadowColor: a.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  "rgba(168,85,247,0.85)",
                  "rgba(168,85,247,0.0)",
                ],
              }) as unknown as string,
              textShadowRadius: 6,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
});
