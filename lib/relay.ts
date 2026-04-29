/**
 * Призрачный узел (Ghost Relay).
 *
 * Фоновая служба, которая периодически (когда ОС разрешает) запускает
 * BLE-сканирование и пробует "переслать" зашифрованные пакеты из локальной
 * очереди в адрес обнаруженных устройств. Сами пакеты остаются end-to-end
 * зашифрованы — узел-ретранслятор только переносит шифротекст и не имеет
 * ключа для расшифровки.
 *
 * Реальная отдача пакета по GATT здесь оставлена точкой расширения
 * (помечено TODO_RELAY_WRITE) — на этом уровне мы:
 *   1) безопасно регистрируем фоновую задачу;
 *   2) считаем "встречи" (encounter) с другими Ghost-узлами;
 *   3) если задача успела сработать в окне фона ОС — обновляем lastRelayAt.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { GHOST_SERVICE_UUID } from "@/lib/transport";

export const RELAY_TASK_NAME = "ghost-relay-task";
const RELAY_STATE_KEY = "ghost.relay.state.v1";

export type RelayStats = {
  enabled: boolean;
  lastRelayAt: number | null;
  encounters: number;
  forwarded: number;
};

const initialStats: RelayStats = {
  enabled: false,
  lastRelayAt: null,
  encounters: 0,
  forwarded: 0,
};

export async function loadRelayStats(): Promise<RelayStats> {
  try {
    const raw = await AsyncStorage.getItem(RELAY_STATE_KEY);
    if (!raw) return initialStats;
    return { ...initialStats, ...JSON.parse(raw) };
  } catch {
    return initialStats;
  }
}

export async function saveRelayStats(stats: RelayStats): Promise<void> {
  try {
    await AsyncStorage.setItem(RELAY_STATE_KEY, JSON.stringify(stats));
  } catch {}
}

let registered = false;

function tryLoadModules(): {
  TaskManager: any;
  BackgroundFetch: any;
  BleModule: any;
} | null {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TaskManager = require("expo-task-manager");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BackgroundFetch = require("expo-background-fetch");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BleModule = require("react-native-ble-plx");
    return { TaskManager, BackgroundFetch, BleModule };
  } catch {
    return null;
  }
}

/**
 * Регистрирует фоновую задачу один раз за процесс. Идемпотентно.
 */
export function ensureRelayTaskRegistered(): boolean {
  if (registered) return true;
  const mods = tryLoadModules();
  if (!mods) return false;
  try {
    const { TaskManager, BleModule } = mods;
    if (TaskManager.isTaskDefined(RELAY_TASK_NAME)) {
      registered = true;
      return true;
    }
    TaskManager.defineTask(RELAY_TASK_NAME, async () => {
      const stats = await loadRelayStats();
      if (!stats.enabled) {
        return 1; // BackgroundFetchResult.NoData
      }
      try {
        const manager = new BleModule.BleManager();
        const state = await manager.state();
        if (state !== BleModule.State.PoweredOn) {
          await manager.destroy();
          return 1;
        }
        let encounters = 0;
        await new Promise<void>((resolve) => {
          const stop = setTimeout(() => resolve(), 8000);
          manager.startDeviceScan(
            [GHOST_SERVICE_UUID],
            { allowDuplicates: false },
            (_err: any, device: any) => {
              if (!device) return;
              encounters += 1;
              // TODO_RELAY_WRITE: connect & GATT-write queued ciphertext
            },
          );
          setTimeout(() => {
            try {
              manager.stopDeviceScan();
            } catch {}
            clearTimeout(stop);
            resolve();
          }, 8000);
        });
        await manager.destroy();
        await saveRelayStats({
          ...stats,
          lastRelayAt: Date.now(),
          encounters: stats.encounters + encounters,
        });
        return encounters > 0 ? 2 : 1; // 2 = NewData, 1 = NoData
      } catch {
        return 3; // Failed
      }
    });
    registered = true;
    return true;
  } catch {
    return false;
  }
}

export async function startRelay(): Promise<{ ok: boolean; reason?: string }> {
  const mods = tryLoadModules();
  if (!mods) {
    return {
      ok: false,
      reason: Platform.OS === "web"
        ? "Relay недоступен в веб-превью"
        : "Соберите development build, чтобы включить фоновый relay",
    };
  }
  if (!ensureRelayTaskRegistered()) {
    return { ok: false, reason: "Не удалось зарегистрировать задачу" };
  }
  try {
    const { BackgroundFetch } = mods;
    await BackgroundFetch.registerTaskAsync(RELAY_TASK_NAME, {
      minimumInterval: 15 * 60, // ОС определяет реальное окно
      stopOnTerminate: false,
      startOnBoot: true,
    });
    const stats = await loadRelayStats();
    await saveRelayStats({ ...stats, enabled: true });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "Ошибка регистрации" };
  }
}

export async function stopRelay(): Promise<void> {
  const mods = tryLoadModules();
  const stats = await loadRelayStats();
  await saveRelayStats({ ...stats, enabled: false });
  if (!mods) return;
  try {
    await mods.BackgroundFetch.unregisterTaskAsync(RELAY_TASK_NAME);
  } catch {}
}

export function relayAvailable(): boolean {
  return Platform.OS !== "web" && tryLoadModules() !== null;
}
