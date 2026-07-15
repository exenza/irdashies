import { useEffect, useState } from 'react';
import type { InboundMessage } from 'ably';
import {
  useDriverCarIdx,
  useFocusCarIdx,
  useSessionStore,
} from '@irdashies/context';
import logger from '@irdashies/utils/logger';
import { useLocalFuelMetrics } from './useLocalFuelMetrics';
import {
  FUEL_SHARE_EVENT,
  fuelShareChannelName,
  getFuelShareClient,
} from '../../../domain/fuelSharing/ablyClient';
import type {
  FuelShareMessage,
  FuelShareStats,
  FuelSharingConfig,
} from '../types';

export interface FuelSharingData {
  /** True when focused on a car other than the local player's own */
  isSpectating: boolean;
  driverName?: string;
  /** Own live data when driving, or the last message received for the spectated driver */
  data?: FuelShareStats;
}

export const useFuelSharing = (
  settings: FuelSharingConfig | undefined
): FuelSharingData => {
  const apiKey = settings?.ably?.apiKey;
  const fuelUnits = settings?.fuelUnits ?? 'L';
  const enabled = !!apiKey;

  const session = useSessionStore((state) => state.session);
  const drivers = session?.DriverInfo?.Drivers ?? [];
  const ownUserId = session?.DriverInfo?.DriverUserID;

  const driverCarIdx = useDriverCarIdx();
  const focusCarIdx = useFocusCarIdx();
  const isSpectating =
    focusCarIdx !== undefined &&
    driverCarIdx !== undefined &&
    focusCarIdx !== driverCarIdx;

  const ownDriver =
    driverCarIdx !== undefined ? drivers[driverCarIdx] : undefined;
  const focusDriver =
    focusCarIdx !== undefined ? drivers[focusCarIdx] : undefined;

  const localMetrics = useLocalFuelMetrics();

  // Publish own metrics once per lap while driving
  useEffect(() => {
    if (!enabled || !apiKey || !ownUserId || isSpectating) return;
    if (localMetrics.lap <= 0) return;

    const channel = getFuelShareClient(apiKey).channels.get(
      fuelShareChannelName(ownUserId)
    );
    const message: FuelShareMessage = {
      driverUserId: ownUserId,
      driverName: ownDriver?.UserName ?? 'Unknown',
      lap: localMetrics.lap,
      lastLapUsage: localMetrics.lastLapUsage,
      lapsWithFuel: localMetrics.lapsWithFuel,
      timeToEmptySeconds: localMetrics.timeToEmptySeconds,
      fuelLevel: localMetrics.fuelLevel,
      fuelUnits,
      updatedAt: Date.now(),
    };

    channel.publish(FUEL_SHARE_EVENT, message).catch((err: unknown) => {
      logger.warn('[FuelSharing] Failed to publish fuel update', err);
    });
  }, [
    enabled,
    apiKey,
    ownUserId,
    ownDriver?.UserName,
    isSpectating,
    localMetrics,
    fuelUnits,
  ]);

  // Subscribe to the spectated driver's channel
  const targetUserId = isSpectating ? focusDriver?.UserID : undefined;

  const [remoteMessage, setRemoteMessage] = useState<
    FuelShareStats | undefined
  >();
  const [subscribedUserId, setSubscribedUserId] = useState<
    number | undefined
  >();

  // Clear stale data as soon as the spectate target changes, during render
  // (guarded, no effect) - the effect below only ever calls setState from
  // inside its subscribe/history callbacks.
  if (targetUserId !== subscribedUserId) {
    setSubscribedUserId(targetUserId);
    setRemoteMessage(undefined);
  }

  useEffect(() => {
    if (!enabled || !apiKey || !targetUserId) return;

    const channel = getFuelShareClient(apiKey).channels.get(
      fuelShareChannelName(targetUserId)
    );

    const onMessage = (msg: InboundMessage) => {
      setRemoteMessage(msg.data as FuelShareStats);
    };

    channel.subscribe(FUEL_SHARE_EVENT, onMessage);

    // Fetch the last published value so a late-joining spectator isn't left blank
    channel
      .history({ limit: 1, direction: 'backwards' })
      .then((page) => {
        const last = page.items[0];
        if (last) setRemoteMessage(last.data as FuelShareStats);
      })
      .catch((err: unknown) => {
        logger.warn('[FuelSharing] Failed to fetch fuel history', err);
      });

    return () => {
      channel.unsubscribe(FUEL_SHARE_EVENT, onMessage);
    };
  }, [enabled, apiKey, targetUserId]);

  if (isSpectating) {
    return {
      isSpectating: true,
      driverName: focusDriver?.UserName,
      data: remoteMessage,
    };
  }

  return {
    isSpectating: false,
    driverName: ownDriver?.UserName,
    data: localMetrics.lap > 0 ? localMetrics : undefined,
  };
};
