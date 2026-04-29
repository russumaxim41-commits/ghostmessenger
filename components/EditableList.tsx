import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { tapMaterial } from "@/lib/haptics";

export type EditableItem = {
  key: string;
};

type Props<T extends EditableItem> = {
  data: T[];
  editing: boolean;
  onReorder: (next: T[]) => void;
  onToggleEdit: () => void;
  renderItem: (item: T) => React.ReactNode;
  itemHeight?: number;
  /** надпись справа от тоггла редактирования */
  toggleLabel?: string;
};

/**
 * Edit Mode — модульная перестановка элементов с пружинной физикой.
 *
 * При editing=true каждая строка дрожит (idle wobble) и отвечает
 * перетаскиванием long-press → drop. Используем PanResponder + Animated
 * spring для физики, без зависимостей от gesture-handler в этом
 * компоненте, чтобы он работал и в Expo Go.
 */
export function EditableList<T extends EditableItem>({
  data,
  editing,
  onReorder,
  onToggleEdit,
  renderItem,
  itemHeight = 72,
  toggleLabel,
}: Props<T>) {
  const { tokens } = useTheme();

  return (
    <View>
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => {
            tapMaterial(editing ? "metal" : "matte");
            onToggleEdit();
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.editBtn,
            {
              backgroundColor: editing ? tokens.accent : "transparent",
              borderColor: editing ? tokens.accent : tokens.cardBorder,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text
            style={[
              styles.editText,
              { color: editing ? "#FFFFFF" : tokens.text },
            ]}
          >
            {editing ? "Готово" : (toggleLabel ?? "Изменить")}
          </Text>
        </Pressable>
      </View>
      <View>
        {data.map((item, index) => (
          <DraggableRow
            key={item.key}
            index={index}
            count={data.length}
            editing={editing}
            itemHeight={itemHeight}
            onSwap={(from, to) => {
              if (from === to) return;
              const next = [...data];
              const [m] = next.splice(from, 1);
              if (!m) return;
              next.splice(to, 0, m);
              onReorder(next);
              tapMaterial("glossy");
            }}
          >
            {renderItem(item)}
          </DraggableRow>
        ))}
      </View>
    </View>
  );
}

function DraggableRow({
  index,
  count,
  editing,
  itemHeight,
  onSwap,
  children,
}: {
  index: number;
  count: number;
  editing: boolean;
  itemHeight: number;
  onSwap: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  const translate = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const dy = useRef(0);

  // idle wobble в edit-mode
  useEffect(() => {
    if (!editing) {
      wobble.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {
          toValue: 1,
          duration: 110,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: -1,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: 0,
          duration: 110,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [editing, wobble]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editing,
      onMoveShouldSetPanResponder: (_e, g) =>
        editing && Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        Animated.spring(lift, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 140,
        }).start();
      },
      onPanResponderMove: (_e: GestureResponderEvent, g) => {
        dy.current = g.dy;
        translate.setValue(g.dy);
      },
      onPanResponderRelease: () => {
        const slot = Math.round(dy.current / itemHeight);
        const target = Math.max(0, Math.min(count - 1, index + slot));
        Animated.parallel([
          Animated.spring(translate, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 110,
          }),
          Animated.spring(lift, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 140,
          }),
        ]).start();
        onSwap(index, target);
      },
      onPanResponderTerminate: () => {
        Animated.spring(translate, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 110,
        }).start();
        Animated.spring(lift, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
          tension: 140,
        }).start();
      },
    }),
  ).current;

  const rotate = wobble.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-1.2deg", "0deg", "1.2deg"],
  });
  const scale = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const elev = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });
  const opacity = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });

  return (
    <Animated.View
      {...(editing ? responder.panHandlers : {})}
      style={{
        transform: [{ translateY: translate }, { scale }, { rotate }],
        opacity,
        zIndex: lift.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 10],
        }) as unknown as number,
        // shadow only when lifted
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: elev as unknown as number,
        elevation: elev as unknown as number,
      }}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  editText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});
