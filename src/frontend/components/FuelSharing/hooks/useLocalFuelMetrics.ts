import { useState } from 'react';
import { useTelemetryValue } from '@irdashies/context';
import type { FuelShareStats } from '../types';

export type LocalFuelMetrics = FuelShareStats;

const EMPTY_METRICS: LocalFuelMetrics = {
  lap: 0,
  lastLapUsage: 0,
  lapsWithFuel: 0,
  timeToEmptySeconds: 0,
  fuelLevel: 0,
};

/**
 * Minimal, self-contained fuel-per-lap tracker for the local player.
 *
 * Deliberately simpler than FuelCalculator's useFuelCalculation (no
 * refuel/green-flag/qualifying handling) - this widget only needs a
 * once-per-lap snapshot to display and publish to teammates, not a full
 * strategy breakdown. Kept independent per architecture rule N3 (widget
 * folders don't import from other widget folders).
 */
export const useLocalFuelMetrics = (): LocalFuelMetrics => {
  const lapCompleted = useTelemetryValue<number>('LapCompleted') ?? 0;
  const fuelLevel = useTelemetryValue<number>('FuelLevel') ?? 0;
  const lastLapTime = useTelemetryValue<number>('LapLastLapTime') ?? 0;

  const [lapStartFuel, setLapStartFuel] = useState<number>(fuelLevel);
  const [lastLoggedLap, setLastLoggedLap] = useState<number>(lapCompleted);
  const [metrics, setMetrics] = useState<LocalFuelMetrics>(EMPTY_METRICS);

  // Guarded setState during render (not in an effect, no refs) - this is the
  // React-recommended way to derive "sticky until the next lap" state from a
  // changing value without an extra render pass. Same pattern already used
  // in BaseSettingsSection.tsx.
  if (lapCompleted > 0 && lapCompleted !== lastLoggedLap) {
    const used = lapStartFuel - fuelLevel;
    const lastLapUsage = used > 0 ? used : 0;
    const lapsWithFuel = lastLapUsage > 0 ? fuelLevel / lastLapUsage : 0;
    const timeToEmptySeconds =
      lapsWithFuel * (lastLapTime > 0 ? lastLapTime : 0);

    setMetrics({
      lap: lapCompleted,
      lastLapUsage,
      lapsWithFuel,
      timeToEmptySeconds,
      fuelLevel,
    });
    setLastLoggedLap(lapCompleted);
    setLapStartFuel(fuelLevel);
  }

  return metrics;
};
