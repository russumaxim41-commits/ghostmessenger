import React, { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  showValue?: boolean;
  format?: (v: number) => string;
  leftLabel?: string;
  rightLabel?: string;
};

export function GlassSlider({
  value,
  min = 0,
  max = 1,
  onChange,
  showValue,
  format,
  leftLabel,
  rightLabel,
}: Props) {
  const { tokens } = useTheme();
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const pct = (value - min) / (max - min);
  const clampedPct = Math.max(0, Math.min(1, pct));

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const w = widthRef.current;
        if (!w) return;
        const x = evt.nativeEvent.locationX ?? 0;
        const p = Math.max(0, Math.min(1, x / w));
        onChange(min + p * (max - min));
      },
      onPanResponderMove: (evt) => {
        const w = widthRef.current;
        if (!w) return;
        const x = evt.nativeEvent.locationX ?? 0;
        const p = Math.max(0, Math.min(1, x / w));
        onChange(min + p * (max - min));
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  };

  return (
    <View style={styles.wrap}>
      {showValue ? (
        <View style={styles.valueRow}>
          <Text style={[styles.valueText, { color: tokens.text }]}>
            {format ? format(value) : Math.round(value * 100) + "%"}
          </Text>
        </View>
      ) : null}
      <View
        onLayout={onLayout}
        style={styles.track}
        {...responder.panHandlers}
      >
        <View
          style={[styles.trackBg, { backgroundColor: tokens.cardBorder }]}
        />
        {width > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                left: clampedPct * (width - 18),
                backgroundColor: tokens.accent,
                shadowColor: tokens.accent,
              },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: tokens.textFaint }]}>
          {leftLabel ?? ""}
        </Text>
        <Text style={[styles.label, { color: tokens.textFaint }]}>
          {rightLabel ?? ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  valueRow: { alignItems: "flex-end", marginBottom: 6 },
  valueText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  track: {
    height: 26,
    justifyContent: "center",
  },
  trackBg: {
    height: 2,
    borderRadius: 1,
  },
  thumb: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  label: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
