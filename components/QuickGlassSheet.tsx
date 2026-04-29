import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { GlassSlider } from "@/components/GlassSlider";
import { useGlass } from "@/contexts/GlassContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function tap() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

/**
 * Быстрая всплывающая панель из «капли» в правом нижнем углу.
 * Внешний вид — вертикальная стеклянная колонка иконок (как в эталоне),
 * раскрывающая под собой компактный слайдер прозрачности.
 */
export function QuickGlassSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const glass = useGlass();
  const { tokens, mode, setMode } = useTheme();
  const { t } = useLocale();
  const bottom = (Platform.OS === "web" ? 84 : insets.bottom + 84) + 80;

  const isDark = mode === "dark" || mode === "auto";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      {/* Вертикальная колонка иконок — справа над «каплей» */}
      <View
        pointerEvents="box-none"
        style={[styles.colWrap, { bottom: bottom + 110, right: 20 }]}
      >
        <GlassCard radius={26} intensity={70}>
          <View style={styles.col}>
            <ColIcon
              icon="more-horizontal"
              onPress={() => {
                tap();
              }}
              tint={tokens.text}
            />
            <ColIcon
              icon="music"
              onPress={() => {
                tap();
              }}
              tint={tokens.text}
            />
            <ColIcon
              icon="eye-off"
              onPress={() => {
                tap();
              }}
              tint={tokens.text}
            />
          </View>
        </GlassCard>
      </View>

      {/* Два отдельных кружка чуть ниже */}
      <View
        pointerEvents="box-none"
        style={[styles.dualWrap, { bottom: bottom + 30, right: 20 }]}
      >
        <GlassCard radius={22} intensity={70}>
          <Pressable
            onPress={() => {
              tap();
            }}
            style={styles.dualBtn}
          >
            <Feather name="volume-x" size={18} color="#5DA8FF" />
          </Pressable>
        </GlassCard>
        <View style={{ height: 10 }} />
        <GlassCard radius={22} intensity={70}>
          <Pressable
            onPress={() => {
              tap();
              setMode(isDark ? "light" : "dark");
            }}
            style={styles.dualBtn}
          >
            <Feather
              name={isDark ? "moon" : "sun"}
              size={18}
              color={tokens.text}
            />
          </Pressable>
        </GlassCard>
      </View>

      {/* Основная панель — слайдер прозрачности */}
      <View
        pointerEvents="box-none"
        style={[styles.sheetWrap, { bottom, left: 16, right: 96 }]}
      >
        <GlassCard radius={26} intensity={70}>
          <View style={styles.sheet}>
            <Text style={[styles.title, { color: tokens.text }]}>
              {t("quick.title")}
            </Text>
            <View style={{ height: 8 }} />
            <GlassSlider
              value={glass.opacity}
              onChange={glass.setOpacity}
              min={0}
              max={1}
              showValue
              format={(v) => `${Math.round(v * 100)}%`}
              leftLabel={t("settings.glass.left")}
              rightLabel={t("settings.glass.right")}
            />
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

function ColIcon({
  icon,
  onPress,
  tint,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  tint: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.colItem} hitSlop={6}>
      <Feather name={icon} size={18} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetWrap: { position: "absolute" },
  sheet: { padding: 16 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 13, letterSpacing: 0.3 },

  colWrap: { position: "absolute", width: 56 },
  col: { paddingVertical: 8 },
  colItem: {
    width: 56,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  dualWrap: { position: "absolute", width: 56, alignItems: "center" },
  dualBtn: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
