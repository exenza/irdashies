import type { FuelSharingData } from './hooks/useFuelSharing';

export const getDemoFuelSharingData = (): FuelSharingData => ({
  isSpectating: true,
  driverName: 'Alex Teammate',
  data: {
    lap: 12,
    lastLapUsage: 2.87,
    lapsWithFuel: 8.4,
    timeToEmptySeconds: 730,
    fuelLevel: 24.1,
  },
});
