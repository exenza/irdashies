import type { Meta, StoryObj } from '@storybook/react-vite';
import { FuelSharingDisplay } from './FuelSharing';
import type { FuelSharingConfig } from './types';
import { TelemetryDecorator } from '@irdashies/storybook';

const meta: Meta<typeof FuelSharingDisplay> = {
  title: 'widgets/FuelSharing',
  component: FuelSharingDisplay,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    TelemetryDecorator(),
    (Story) => (
      <div style={{ width: '250px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof FuelSharingDisplay>;

const mockConfig = (
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

export const Spectating: Story = {
  name: 'Spectating a Teammate',
  args: {
    settings: mockConfig(),
    isSpectating: true,
    driverName: 'Alex Teammate',
    data: {
      lap: 12,
      lastLapUsage: 2.87,
      lapsWithFuel: 8.4,
      timeToEmptySeconds: 730,
      fuelLevel: 24.1,
    },
  },
};

export const Driving: Story = {
  name: 'Driving Your Own Car',
  args: {
    settings: mockConfig(),
    isSpectating: false,
    driverName: 'You',
    data: {
      lap: 5,
      lastLapUsage: 3.12,
      lapsWithFuel: 6.1,
      timeToEmptySeconds: 540,
      fuelLevel: 19.0,
    },
  },
};

export const WaitingForData: Story = {
  name: 'Spectating - No Data Yet',
  args: {
    settings: mockConfig(),
    isSpectating: true,
    driverName: 'Alex Teammate',
    data: undefined,
  },
};

export const GallonsUnits: Story = {
  args: {
    settings: mockConfig({ fuelUnits: 'gal' }),
    isSpectating: true,
    driverName: 'Alex Teammate',
    data: {
      lap: 12,
      lastLapUsage: 0.76,
      lapsWithFuel: 8.4,
      timeToEmptySeconds: 730,
      fuelLevel: 6.4,
    },
  },
};
