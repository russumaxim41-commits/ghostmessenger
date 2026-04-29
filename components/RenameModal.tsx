import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  visible: boolean;
  initial: string;
  title: string;
  onClose: () => void;
  onSubmit: (next: string) => void;
};

export function RenameModal({
  visible,
  initial,
  title,
  onClose,
  onSubmit,
}: Props) {
  const { tokens } = useTheme();
  const { t } = useLocale();
  const [val, setVal] = useState(initial);

  useEffect(() => {
    if (visible) setVal(initial);
  }, [visible, initial]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}}>
          <GlassCard radius={22} intensity={70}>
            <View style={styles.inner}>
              <Text style={[styles.title, { color: tokens.text }]}>
                {title}
              </Text>
              <TextInput
                value={val}
                onChangeText={setVal}
                autoFocus
                placeholder={t("rename.placeholder")}
                placeholderTextColor={tokens.textFaint}
                style={[
                  styles.input,
                  {
                    color: tokens.text,
                    borderColor: tokens.cardBorder,
                    backgroundColor: tokens.surface,
                  },
                ]}
              />
              <View style={styles.row}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.btn,
                    { borderColor: tokens.cardBorder },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.btnText, { color: tokens.text }]}>
                    {t("common.cancel")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (val.trim()) {
                      onSubmit(val.trim());
                      onClose();
                    }
                  }}
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      backgroundColor: tokens.accent,
                      borderColor: tokens.accent,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[styles.btnText, { color: "#FFF" }]}>
                    {t("common.save")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  inner: { padding: 18, width: 320 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  row: { flexDirection: "row", gap: 8, marginTop: 14 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
  },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
