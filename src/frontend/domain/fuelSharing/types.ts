/** The three per-lap stats the Fuel Sharing widget displays, regardless of source. */
export interface FuelShareStats {
  lap: number;
  /** Fuel used on the most recently completed lap (liters) */
  lastLapUsage: number;
  /** Estimated number of laps possible with current fuel */
  lapsWithFuel: number;
  timeToEmptySeconds: number;
  fuelLevel: number;
}

/**
 * Payload published to / received from a driver's Ably fuel channel.
 * Kept intentionally small - published once per lap, not per telemetry tick.
 */
export interface FuelShareMessage extends FuelShareStats {
  driverUserId: number;
  driverName: string;
  fuelUnits: 'L' | 'gal';
  updatedAt: number;
}
