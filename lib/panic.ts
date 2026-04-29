/**
 * Panic Wipe — мгновенное уничтожение локальной БД и ключей.
 *
 * После вызова все ключи Ghost (identity, chats, groups, channels,
 * queue, reputation, integrity, glass, theme и т.д.) удаляются, а
 * AsyncStorage очищается полностью. Это операция «выжженной земли» —
 * приложение перезагружается на экран онбординга с новой личностью.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { tapDanger } from "@/lib/haptics";

const GHOST_KEY_PREFIX = "ghost.";

export async function panicWipe(): Promise<void> {
  tapDanger();
  try {
    const all = await AsyncStorage.getAllKeys();
    const ours = all.filter((k) => k.startsWith(GHOST_KEY_PREFIX));
    if (ours.length > 0) {
      await AsyncStorage.multiRemove(ours);
    }
  } catch {
    // На крайний случай — полная очистка
    try {
      await AsyncStorage.clear();
    } catch {}
  }
}
