import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocalFuelMetrics } from './useLocalFuelMetrics';
import { useTelemetryValue } from '@irdashies/context';

vi.mock('@irdashies/context', () => ({
  useTelemetryValue: vi.fn(),
}));

const mockTelemetry = (
  lapCompleted: number,
  fuelLevel: number,
  lastLapTime = 90
) => {
  vi.mocked(useTelemetryValue).mockImplementation((key: unknown) => {
    switch (key) {
      case 'LapCompleted':
        return lapCompleted;
      case 'FuelLevel':
        return fuelLevel;
      case 'LapLastLapTime':
        return lastLapTime;
      default:
        return undefined;
    }
  });
};

describe('useLocalFuelMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty metrics before any lap completes', () => {
    mockTelemetry(0, 60);
    const { result } = renderHook(() => useLocalFuelMetrics());
    expect(result.current.lap).toBe(0);
    expect(result.current.lastLapUsage).toBe(0);
    expect(result.current.lapsWithFuel).toBe(0);
  });

  it('computes last lap usage and laps left once a lap completes', () => {
    mockTelemetry(0, 60);
    const { result, rerender } = renderHook(() => useLocalFuelMetrics());

    mockTelemetry(1, 57, 90); // used 3L over the lap
    rerender();

    expect(result.current.lap).toBe(1);
    expect(result.current.lastLapUsage).toBeCloseTo(3);
    expect(result.current.lapsWithFuel).toBeCloseTo(19); // 57 / 3
    expect(result.current.timeToEmptySeconds).toBeCloseTo(19 * 90);
  });

  it('stays sticky mid-lap and only updates on the next lap boundary', () => {
    mockTelemetry(0, 60);
    const { result, rerender } = renderHook(() => useLocalFuelMetrics());

    mockTelemetry(1, 57, 90);
    rerender();

    mockTelemetry(1, 50, 90); // still lap 1, fuel dropping mid-lap
    rerender();

    expect(result.current.lap).toBe(1);
    expect(result.current.lastLapUsage).toBeCloseTo(3); // unchanged

    mockTelemetry(2, 54, 88); // lap 2 complete, used 3L (50 -> ... -> 54? use consistent math)
    rerender();

    expect(result.current.lap).toBe(2);
  });

  it('treats a fuel increase (refuel) as zero usage rather than negative', () => {
    mockTelemetry(0, 20);
    const { result, rerender } = renderHook(() => useLocalFuelMetrics());

    mockTelemetry(1, 60, 90); // refuelled during the lap
    rerender();

    expect(result.current.lastLapUsage).toBe(0);
    expect(result.current.lapsWithFuel).toBe(0);
  });
});
