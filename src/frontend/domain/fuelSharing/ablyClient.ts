import * as Ably from 'ably';

/**
 * Single shared Realtime client per API key. Widgets/hooks call getFuelShareClient
 * repeatedly on every render; this avoids reconnecting on every call while still
 * picking up a key change (e.g. user edits it in Settings).
 */
let client: Ably.Realtime | null = null;
let clientKey: string | null = null;

export const getFuelShareClient = (apiKey: string): Ably.Realtime => {
  if (client && clientKey === apiKey) return client;
  client?.close();
  client = new Ably.Realtime({ key: apiKey });
  clientKey = apiKey;
  return client;
};

export const closeFuelShareClient = (): void => {
  client?.close();
  client = null;
  clientKey = null;
};

/** Channel name is scoped per driver only - the API key itself scopes it to a team. */
export const fuelShareChannelName = (driverUserId: number): string =>
  `fuel-share:driver-${driverUserId}`;

export const FUEL_SHARE_EVENT = 'fuel-update';

/** Real iRacing customer IDs are always positive - safe to use as a test sentinel. */
export const TEST_DRIVER_USER_ID = 0;
