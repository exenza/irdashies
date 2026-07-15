import { useDashboard, useSessionVisibility } from '@irdashies/context';
import { formatTime } from '@irdashies/utils/time';
import { GasPumpIcon, BinocularsIcon } from '@phosphor-icons/react';
import { useFuelSharing } from './hooks/useFuelSharing';
import { getDemoFuelSharingData } from './demoData';
import type { FuelSharingConfig, FuelShareStats } from './types';

export const FuelSharing = () => {
  const { isDemoMode, currentDashboard } = useDashboard();
  const dashboardConfig = currentDashboard?.widgets.find(
    (w) => w.id === 'fuelsharing'
  )?.config as FuelSharingConfig | undefined;

  const isSessionVisible = useSessionVisibility(
    dashboardConfig?.sessionVisibility
  );

  const live = useFuelSharing(dashboardConfig);
  const { isSpectating, driverName, data } = isDemoMode
    ? getDemoFuelSharingData()
    : live;

  if (!dashboardConfig || !isSessionVisible) return null;

  return (
    <FuelSharingDisplay
      settings={dashboardConfig}
      isSpectating={isSpectating}
      driverName={driverName}
      data={data}
    />
  );
};

export const FuelSharingDisplay = ({
  settings,
  isSpectating,
  driverName,
  data,
}: {
  settings: FuelSharingConfig;
  isSpectating: boolean;
  driverName?: string;
  data?: FuelShareStats;
}) => {
  const units = settings.fuelUnits ?? 'L';

  return (
    <div className="h-full flex items-start">
      <div
        className="w-full text-sm bg-slate-800/[var(--bg-opacity)] rounded-md text-white p-2"
        style={
          {
            '--bg-opacity': `${settings.background.opacity}%`,
            fontSize: `${settings.scale}%`,
          } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-1 text-[0.8em] text-zinc-400 uppercase mb-1">
          {isSpectating ? (
            <>
              <BinocularsIcon weight="bold" />
              <span className="truncate">{driverName ?? 'Spectating'}</span>
            </>
          ) : (
            <>
              <GasPumpIcon weight="bold" />
              <span>Fuel Sharing</span>
            </>
          )}
        </div>

        {!data ? (
          <div className="text-center text-zinc-500 py-1">
            {isSpectating ? 'Waiting for data...' : 'No laps completed yet'}
          </div>
        ) : (
          <div
            className="flex w-full gap-1 bg-slate-900/[var(--fg-alpha)] rounded-sm"
            style={
              {
                '--fg-alpha': `${settings.foreground.opacity / 3}%`,
              } as React.CSSProperties
            }
          >
            <Stat
              label="Last Lap"
              value={`${data.lastLapUsage.toFixed(2)}${units}`}
            />
            <Stat
              label="Laps Left"
              value={data.lapsWithFuel.toFixed(1)}
            />
            <Stat
              label="Time Empty"
              value={formatTime(data.timeToEmptySeconds, 'duration-hh:mm:ss')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-1">
    <span className="text-[0.7em] text-zinc-400 uppercase">{label}</span>
    <span className="text-[1.1em] tabular-nums">{value}</span>
  </div>
);
