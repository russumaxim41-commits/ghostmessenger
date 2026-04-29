/**
 * Adaptive Blur Engine.
 *
 * Возвращает множитель `blurScale` в диапазоне [0..1], которым GlassCard
 * домножает базовую интенсивность blur. Чем ниже заряд батареи или чем
 * выше нагрузка на главный поток (просадка FPS) — тем меньше blur, чтобы
 * сэкономить ресурсы и не ронять кадры.
 *
 * Сэмплирование батареи делается через expo-battery (мягкий импорт —
 * если модуль не установлен, считаем заряд = 1.0). Нагрузка считается
 * через окно 30 кадров: ожидаемый интервал 16.67ms, отклонение наружу
 * сигнализирует о пропусках.
 */

import { Platform } from "react-native";

export type AdaptiveSample = {
  batteryLevel: number; // 0..1
  isLowPower: boolean;
  fps: number; // оценочный
  blurScale: number; // 0..1
};

let monitor: AdaptiveMonitor | null = null;

class AdaptiveMonitor {
  private listeners = new Set<(s: AdaptiveSample) => void>();
  private sample: AdaptiveSample = {
    batteryLevel: 1,
    isLowPower: false,
    fps: 60,
    blurScale: 1,
  };
  private rafId: number | null = null;
  private lastFrame = 0;
  private window: number[] = [];
  private batteryUnsub: (() => void) | null = null;
  private powerUnsub: (() => void) | null = null;

  start() {
    if (this.rafId != null) return;
    this.bindBattery();
    const tick = (t: number) => {
      if (this.lastFrame > 0) {
        const dt = t - this.lastFrame;
        this.window.push(dt);
        if (this.window.length > 30) this.window.shift();
        const avg =
          this.window.reduce((a, b) => a + b, 0) / Math.max(1, this.window.length);
        const fps = Math.max(15, Math.min(120, 1000 / Math.max(1, avg)));
        if (Math.abs(fps - this.sample.fps) > 2) {
          this.sample = { ...this.sample, fps, blurScale: this.compute(fps) };
          this.notify();
        }
      }
      this.lastFrame = t;
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.batteryUnsub?.();
    this.powerUnsub?.();
    this.batteryUnsub = null;
    this.powerUnsub = null;
  }

  private compute(fps: number): number {
    const { batteryLevel, isLowPower } = this.sample;
    let scale = 1;
    if (isLowPower) scale *= 0.55;
    if (batteryLevel < 0.2) scale *= 0.6;
    else if (batteryLevel < 0.4) scale *= 0.85;
    if (fps < 45) scale *= 0.6;
    else if (fps < 55) scale *= 0.85;
    return Math.max(0.25, Math.min(1, scale));
  }

  private notify() {
    for (const fn of this.listeners) fn(this.sample);
  }

  subscribe(fn: (s: AdaptiveSample) => void): () => void {
    this.listeners.add(fn);
    fn(this.sample);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private bindBattery() {
    if (Platform.OS === "web") return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Battery = require("expo-battery");
      Battery.getBatteryLevelAsync?.()
        .then((lvl: number) => {
          this.sample = {
            ...this.sample,
            batteryLevel: typeof lvl === "number" && lvl >= 0 ? lvl : 1,
            blurScale: this.compute(this.sample.fps),
          };
          this.notify();
        })
        .catch(() => {});
      Battery.isLowPowerModeEnabledAsync?.()
        .then((low: boolean) => {
          this.sample = {
            ...this.sample,
            isLowPower: !!low,
            blurScale: this.compute(this.sample.fps),
          };
          this.notify();
        })
        .catch(() => {});
      const sub1 = Battery.addBatteryLevelListener?.(({ batteryLevel }: any) => {
        this.sample = {
          ...this.sample,
          batteryLevel: typeof batteryLevel === "number" ? batteryLevel : 1,
          blurScale: this.compute(this.sample.fps),
        };
        this.notify();
      });
      const sub2 = Battery.addLowPowerModeListener?.(
        ({ lowPowerMode }: any) => {
          this.sample = {
            ...this.sample,
            isLowPower: !!lowPowerMode,
            blurScale: this.compute(this.sample.fps),
          };
          this.notify();
        },
      );
      this.batteryUnsub = () => sub1?.remove?.();
      this.powerUnsub = () => sub2?.remove?.();
    } catch {
      // expo-battery не установлен — игнорируем
    }
  }
}

export function getAdaptiveMonitor(): AdaptiveMonitor {
  if (!monitor) monitor = new AdaptiveMonitor();
  return monitor;
}
