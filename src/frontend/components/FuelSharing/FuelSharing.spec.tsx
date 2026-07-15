import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FuelSharingDisplay } from './FuelSharing';
import type { FuelSharingConfig } from './types';

const mockSettings = (
  overrides: Partial<FuelSharingConfig> = {}
): FuelSharingConfig => ({
  ably: { apiKey: '' },
  fuelUnits: 'L',
  scale: 100,
  background: { opacity: 80 },
  foreground: { opacity: 70 },
  sessionVisibility: {
    race: true,
    loneQualify: true,
    openQualify: true,
    practice: true,
    offlineTesting: true,
  },
  ...overrides,
});

describe('FuelSharingDisplay', () => {
  it('shows a waiting message when spectating with no data yet', () => {
    render(
      <FuelSharingDisplay
        settings={mockSettings()}
        isSpectating
        driverName="Alex"
        data={undefined}
      />
    );
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Waiting for data...')).toBeInTheDocument();
  });

  it('shows the spectated driver name and stats', () => {
    render(
      <FuelSharingDisplay
        settings={mockSettings()}
        isSpectating
        driverName="Alex"
        data={{
          lap: 12,
          lastLapUsage: 2.87,
          lapsWithFuel: 8.4,
          timeToEmptySeconds: 730,
          fuelLevel: 24.1,
        }}
      />
    );
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('2.87L')).toBeInTheDocument();
    expect(screen.getByText('8.4')).toBeInTheDocument();
    expect(screen.getByText('00:12:10')).toBeInTheDocument();
  });

  it('shows own data under the "Fuel Sharing" label when not spectating', () => {
    render(
      <FuelSharingDisplay
        settings={mockSettings()}
        isSpectating={false}
        data={{
          lap: 5,
          lastLapUsage: 3.12,
          lapsWithFuel: 6.1,
          timeToEmptySeconds: 540,
          fuelLevel: 19.0,
        }}
      />
    );
    expect(screen.getByText('Fuel Sharing')).toBeInTheDocument();
    expect(screen.getByText('3.12L')).toBeInTheDocument();
  });

  it('shows the no-laps message when driving with no completed lap yet', () => {
    render(
      <FuelSharingDisplay
        settings={mockSettings()}
        isSpectating={false}
        data={undefined}
      />
    );
    expect(screen.getByText('No laps completed yet')).toBeInTheDocument();
  });

  it('uses the configured fuel units', () => {
    render(
      <FuelSharingDisplay
        settings={mockSettings({ fuelUnits: 'gal' })}
        isSpectating={false}
        data={{
          lap: 5,
          lastLapUsage: 0.76,
          lapsWithFuel: 6.1,
          timeToEmptySeconds: 540,
          fuelLevel: 19.0,
        }}
      />
    );
    expect(screen.getByText('0.76gal')).toBeInTheDocument();
  });
});
