/**
 * Реальный транспорт обнаружения узлов через Bluetooth LE.
 *
 * Используется `react-native-ble-plx` (нативный модуль). Работает только
 * в development build / standalone сборке. В Expo Go и в веб-превью
 * нативный модуль отсутствует — транспорт сообщает доступность=false
 * и сканирование честно возвращает 0 узлов.
 *
 * Передача сообщений: BLE-сканер находит другие телефоны, у которых в
 * рекламе (manufacturer data) присутствует service UUID Ghost. Полная
 * двусторонняя GATT-доставка реализуется поверх найденного устройства;
 * этот слой даёт обнаружение.
 */

import { Platform } from "react-native";

export const GHOST_SERVICE_UUID = "7gh057ff-1234-4abc-8def-c0ffee5e7ee5";

export type DiscoveredPeer = {
  deviceId: string;
  publicKey: string;
  name: string;
  rssi: number;
  via: "BLE" | "WIFI";
  lastSeen: number;
};

export type TransportEvent =
  | { type: "peer"; peer: DiscoveredPeer }
  | { type: "lost"; deviceId: string }
  | { type: "state"; available: boolean; reason?: string };

export type Transport = {
  available: boolean;
  reason: string | null;
  start: (
    myPublicKey: string,
    onEvent: (e: TransportEvent) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
};

let bleManagerRef: any = null;
let bleSubscription: any = null;
let bleStateSubscription: any = null;

function tryLoadBlePlx(): any | null {
  if (Platform.OS === "web") return null;
  try {
    // Динамический require — на Expo Go выкинет, ловим.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-ble-plx");
  } catch {
    return null;
  }
}

function makeUnavailableTransport(reason: string): Transport {
  return {
    available: false,
    reason,
    async start(_pk, onEvent) {
      onEvent({ type: "state", available: false, reason });
    },
    async stop() {},
  };
}

export function makeTransport(): Transport {
  const mod = tryLoadBlePlx();
  if (!mod) {
    return makeUnavailableTransport(
      Platform.OS === "web"
        ? "BLE недоступен в веб-превью"
        : "BLE-модуль не подключён. Соберите development build.",
    );
  }
  const BleManager = mod.BleManager;
  const State = mod.State;

  return {
    available: true,
    reason: null,
    async start(myPublicKey, onEvent) {
      try {
        if (!bleManagerRef) bleManagerRef = new BleManager();
        const state = await bleManagerRef.state();
        if (state !== State.PoweredOn) {
          onEvent({
            type: "state",
            available: false,
            reason: "Bluetooth выключен",
          });
          bleStateSubscription = bleManagerRef.onStateChange((s: string) => {
            if (s === State.PoweredOn) {
              onEvent({ type: "state", available: true });
              startScanning(myPublicKey, onEvent);
            }
          }, true);
          return;
        }
        onEvent({ type: "state", available: true });
        startScanning(myPublicKey, onEvent);
      } catch (e: any) {
        onEvent({
          type: "state",
          available: false,
          reason: e?.message ?? "Ошибка BLE",
        });
      }
    },
    async stop() {
      try {
        bleManagerRef?.stopDeviceScan?.();
      } catch {}
      try {
        bleStateSubscription?.remove?.();
        bleStateSubscription = null;
      } catch {}
      try {
        bleSubscription?.remove?.();
        bleSubscription = null;
      } catch {}
    },
  };
}

function startScanning(
  _myPublicKey: string,
  onEvent: (e: TransportEvent) => void,
) {
  if (!bleManagerRef) return;
  bleManagerRef.startDeviceScan(
    [GHOST_SERVICE_UUID],
    { allowDuplicates: false },
    (error: any, device: any) => {
      if (error || !device) return;
      const md = device.manufacturerData ?? null;
      const peer: DiscoveredPeer = {
        deviceId: device.id,
        publicKey: md ?? device.id,
        name: device.localName ?? device.name ?? "Призрак",
        rssi: device.rssi ?? -100,
        via: "BLE",
        lastSeen: Date.now(),
      };
      onEvent({ type: "peer", peer });
    },
  );
}
