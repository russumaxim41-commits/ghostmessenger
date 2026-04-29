/**
 * Node Reputation System.
 *
 * Скрытая логика приоритизации. Каждый раз, когда узел действительно
 * помог сети (был в радиусе и через него удалось довести пакет /
 * отметился в окне фонового relay), мы увеличиваем его счётчик. При
 * сортировке списков «рядом» и при выборе следующего hop мы предпочитаем
 * узлы с большим score. Пользователю это не показывается напрямую —
 * только эффект: «полезные» призраки всплывают наверх.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ghost.reputation.v1";

export type ReputationEntry = {
  publicKey: string;
  score: number; // безразмерный, нелинейно растёт
  encounters: number; // сколько раз встречали
  forwarded: number; // сколько пакетов донесли
  lastSeen: number;
  trusted: boolean; // явно отмечен пользователем
};

export type ReputationMap = Record<string, ReputationEntry>;

let cache: ReputationMap | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

export async function loadReputation(): Promise<ReputationMap> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ReputationMap) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function flushSoon() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    if (!cache) return;
    AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
  }, 800);
}

export async function bumpEncounter(publicKey: string): Promise<void> {
  const map = await loadReputation();
  const cur =
    map[publicKey] ?? makeEmpty(publicKey);
  const next: ReputationEntry = {
    ...cur,
    encounters: cur.encounters + 1,
    lastSeen: Date.now(),
    score: cur.score + 0.4,
  };
  map[publicKey] = next;
  flushSoon();
}

export async function bumpForward(publicKey: string): Promise<void> {
  const map = await loadReputation();
  const cur = map[publicKey] ?? makeEmpty(publicKey);
  const next: ReputationEntry = {
    ...cur,
    forwarded: cur.forwarded + 1,
    lastSeen: Date.now(),
    // нелинейно: каждый успешный проброс ценнее предыдущего
    score: cur.score + 1 + Math.log10(cur.forwarded + 2),
  };
  map[publicKey] = next;
  flushSoon();
}

export async function setTrusted(
  publicKey: string,
  trusted: boolean,
): Promise<void> {
  const map = await loadReputation();
  const cur = map[publicKey] ?? makeEmpty(publicKey);
  map[publicKey] = { ...cur, trusted };
  flushSoon();
}

export async function getReputationScore(publicKey: string): Promise<number> {
  const map = await loadReputation();
  return map[publicKey]?.score ?? 0;
}

export function getCachedReputationScore(publicKey: string): number {
  return cache?.[publicKey]?.score ?? 0;
}

export function getCachedTrusted(publicKey: string): boolean {
  return !!cache?.[publicKey]?.trusted;
}

export async function purgeReputation(): Promise<void> {
  cache = {};
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}

function makeEmpty(publicKey: string): ReputationEntry {
  return {
    publicKey,
    score: 0,
    encounters: 0,
    forwarded: 0,
    lastSeen: 0,
    trusted: false,
  };
}
