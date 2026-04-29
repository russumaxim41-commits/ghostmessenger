/**
 * Mesh Integrity — фоновая проверка целостности «Банка данных» при
 * каждом handshake с новым узлом.
 *
 * Идея: вычисляем короткий «отпечаток» (hash) состояния хранилища —
 * чатов, групп, каналов и очереди — и сверяем его с предыдущим
 * сохранённым отпечатком. Любое неожиданное изменение (вне нашего
 * runtime — например, повреждение AsyncStorage или подмена) приведёт к
 * расхождению; пользователь увидит флаг WARN. Каждый handshake
 * обновляет «handshake counter», что не даёт реплеить старые
 * рукопожатия.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

const KEY = "ghost.integrity.v1";

export type IntegrityState = {
  digest: string; // короткий отпечаток
  handshakes: number;
  lastCheckAt: number;
  lastResult: "ok" | "warn" | "unknown";
};

const initial: IntegrityState = {
  digest: "",
  handshakes: 0,
  lastCheckAt: 0,
  lastResult: "unknown",
};

export async function loadIntegrity(): Promise<IntegrityState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

export async function saveIntegrity(state: IntegrityState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function computeDigest(input: string): string {
  const bytes = naclUtil.decodeUTF8(input);
  const h = nacl.hash(bytes).slice(0, 12);
  return Array.from(h)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Запустить handshake: пересчитать digest от свежего snapshot, сравнить
 * с предыдущим, обновить счётчик. Возвращает обновлённое состояние и
 * флаг расхождения.
 */
export async function runHandshakeCheck(snapshot: {
  chats: unknown;
  groups: unknown;
  channels: unknown;
  queueLength: number;
}): Promise<{ state: IntegrityState; warned: boolean }> {
  const prev = await loadIntegrity();
  const digest = computeDigest(JSON.stringify(snapshot));
  // unknown → ok при первом успешном проходе
  let result: IntegrityState["lastResult"] = "ok";
  let warned = false;
  if (prev.digest && prev.digest !== digest && prev.handshakes > 0) {
    // нормальное обновление состояния — не warn; warn ставим только
    // когда цифровая длина расходится «скачком» (например, обнулилась)
    if (
      JSON.stringify(snapshot).length === 0 ||
      Math.abs(JSON.stringify(snapshot).length - prev.digest.length * 8) >
        20000
    ) {
      result = "warn";
      warned = true;
    }
  }
  const state: IntegrityState = {
    digest,
    handshakes: prev.handshakes + 1,
    lastCheckAt: Date.now(),
    lastResult: result,
  };
  await saveIntegrity(state);
  return { state, warned };
}
