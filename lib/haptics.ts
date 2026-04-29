/**
 * Haptic Texture — уникальный микро-отклик для разных «материалов» стекла.
 *
 * Используем разные сочетания selection / impact / notification и крошечные
 * задержки, чтобы пальцы ощущали разницу между матовым стеклом, глянцем,
 * металлом и пр. Везде ловим ошибки на случай отсутствия Taptic Engine.
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export type GlassMaterial =
  | "matte" // матовое стекло — мягкий короткий отклик
  | "glossy" // глянец — два лёгких тика подряд
  | "metal" // металл — резкий medium
  | "obsidian" // тяжёлый — heavy
  | "mist"; // невесомый — selectionAsync

function safe(fn: () => Promise<unknown> | void) {
  if (Platform.OS === "web") return;
  try {
    const r = fn();
    if (r && typeof (r as Promise<unknown>).catch === "function") {
      (r as Promise<unknown>).catch(() => {});
    }
  } catch {
    /* no-op */
  }
}

export function tapMaterial(material: GlassMaterial = "matte"): void {
  switch (material) {
    case "mist":
      safe(() => Haptics.selectionAsync());
      return;
    case "matte":
      safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      return;
    case "glossy":
      safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      setTimeout(
        () => safe(() => Haptics.selectionAsync()),
        45,
      );
      return;
    case "metal":
      safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
      return;
    case "obsidian":
      safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
      return;
  }
}

export function tapSuccess(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function tapWarn(): void {
  safe(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );
}

export function tapDanger(): void {
  safe(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );
}

/**
 * Длинное «материальное» рычание для long-press distortion: серия тиков с
 * нарастанием тяжести. Симулирует «гравитационную линзу» через haptics.
 */
export function tapDistortion(): void {
  safe(() => Haptics.selectionAsync());
  setTimeout(
    () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
    80,
  );
  setTimeout(
    () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
    180,
  );
  setTimeout(
    () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
    320,
  );
}
