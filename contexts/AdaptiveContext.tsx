import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAdaptiveMonitor, type AdaptiveSample } from "@/lib/adaptive";

type AdaptiveState = AdaptiveSample;

const AdaptiveCtx = createContext<AdaptiveState | null>(null);

export function AdaptiveProvider({ children }: { children: React.ReactNode }) {
  const [sample, setSample] = useState<AdaptiveSample>({
    batteryLevel: 1,
    isLowPower: false,
    fps: 60,
    blurScale: 1,
  });

  useEffect(() => {
    const mon = getAdaptiveMonitor();
    mon.start();
    const unsub = mon.subscribe(setSample);
    return () => {
      unsub();
      mon.stop();
    };
  }, []);

  const value = useMemo<AdaptiveState>(() => sample, [sample]);

  return <AdaptiveCtx.Provider value={value}>{children}</AdaptiveCtx.Provider>;
}

export function useAdaptive(): AdaptiveState {
  const ctx = useContext(AdaptiveCtx);
  if (!ctx) {
    return {
      batteryLevel: 1,
      isLowPower: false,
      fps: 60,
      blurScale: 1,
    };
  }
  return ctx;
}
