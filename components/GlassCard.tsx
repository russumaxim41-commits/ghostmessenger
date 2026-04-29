import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";

import { useAdaptive } from "@/contexts/AdaptiveContext";
import { useGlass } from "@/contexts/GlassContext";
import { useTheme } from "@/contexts/ThemeContext";

type Props = ViewProps & {
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
  padded?: boolean;
  /** показать едва заметную верхнюю грань (отблеск света) */
  edge?: boolean;
  /** усилить акцентную рамку (для активных элементов) */
  accentEdge?: boolean;
  /** игнорировать adaptive scale (если важна максимальная плотность) */
  fixedIntensity?: boolean;
  children?: React.ReactNode;
};

/**
 * Стеклянная карточка с blur, тинтом и тонкой градиентной гранью сверху,
 * имитирующей отблеск света на ребре стекла (0.5px / hairline).
 *
 * Адаптивный движок снижает интенсивность blur и убирает тяжёлые
 * specular-полосы, когда система просаживает FPS, низкий заряд батареи
 * или включён режим энергосбережения.
 */
export function GlassCard({
  style,
  intensity = 35,
  radius = 24,
  padded,
  edge = true,
  accentEdge,
  fixedIntensity,
  children,
  ...rest
}: Props) {
  const { opacity } = useGlass();
  const { tokens, resolved } = useTheme();
  const { blurScale } = useAdaptive();

  const isWeb = Platform.OS === "web";
  const scale = fixedIntensity ? 1 : blurScale;
  const blurAmount = Math.max(0, Math.min(100, Math.round(intensity * scale)));
  // когда blur сильно урезан, добавляем чуть-чуть плотности, чтобы карточка
  // не «исчезала» визуально
  const lowPowerBoost = scale < 0.7 ? (0.7 - scale) * 0.25 : 0;
  const baseAlpha = resolved === "light" ? 0.35 : 0.42;
  const overlayAlpha = baseAlpha + opacity * 0.5 + lowPowerBoost;
  const overlayColor =
    resolved === "light"
      ? `rgba(255,255,255,${overlayAlpha.toFixed(3)})`
      : `rgba(20,20,26,${overlayAlpha.toFixed(3)})`;

  const edgeColors = accentEdge
    ? ([
        "rgba(168,85,247,0.65)",
        "rgba(168,85,247,0.18)",
        "rgba(255,255,255,0.04)",
      ] as const)
    : resolved === "light"
      ? ([
          "rgba(255,255,255,0.85)",
          "rgba(255,255,255,0.25)",
          "rgba(255,255,255,0.02)",
        ] as const)
      : ([
          "rgba(255,255,255,0.22)",
          "rgba(255,255,255,0.07)",
          "rgba(255,255,255,0)",
        ] as const);

  // 0.5px specular line — тонкая полоска света по верхней грани, как блик
  // от источника сверху. Видна только когда blur не сильно урезан.
  const showSpecular = edge && scale > 0.55;

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: accentEdge
            ? "rgba(168,85,247,0.35)"
            : tokens.cardBorder,
        },
        style,
      ]}
      {...rest}
    >
      {isWeb ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              // @ts-ignore web only
              backdropFilter: `blur(${blurAmount * 0.4}px)`,
              // @ts-ignore web only
              WebkitBackdropFilter: `blur(${blurAmount * 0.4}px)`,
            },
          ]}
        />
      ) : (
        <BlurView
          tint={resolved === "light" ? "light" : "dark"}
          intensity={blurAmount}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
      />

      {/* Грань стекла — вертикальный градиент сверху вниз */}
      {edge ? (
        <LinearGradient
          pointerEvents="none"
          colors={edgeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.06, 0.5]}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      ) : null}

      {/* 0.5px specular — самый верхний микро-блик */}
      {showSpecular ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: accentEdge
              ? "rgba(255,255,255,0.85)"
              : resolved === "light"
                ? "rgba(255,255,255,0.95)"
                : "rgba(255,255,255,0.55)",
            opacity: 0.9,
          }}
        />
      ) : null}

      <View style={padded ? styles.padded : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: 16 },
});
