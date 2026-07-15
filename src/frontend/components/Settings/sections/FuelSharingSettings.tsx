import { useState, useEffect } from 'react';
import { BaseSettingsSection } from '../components/BaseSettingsSection';
import {
  FuelSharingWidgetSettings,
  SettingsTabType,
  getWidgetDefaultConfig,
} from '@irdashies/types';
import { useDashboard } from '@irdashies/context';
import { SessionVisibility } from '../components/SessionVisibility';
import { TabButton } from '../components/TabButton';
import { SettingsSection } from '../components/SettingSection';
import { SettingSliderRow } from '../components/SettingSliderRow';
import { SettingButtonGroupRow } from '../components/SettingButtonGroupRow';
import {
  FUEL_SHARE_EVENT,
  TEST_DRIVER_USER_ID,
  fuelShareChannelName,
  getFuelShareClient,
} from '../../../domain/fuelSharing/ablyClient';
import type { FuelShareMessage } from '../../../domain/fuelSharing/types';

const SETTING_ID = 'fuelsharing';

const defaultConfig = getWidgetDefaultConfig('fuelsharing');

export const FuelSharingSettings = () => {
  const { currentDashboard } = useDashboard();
  const savedSettings = currentDashboard?.widgets.find(
    (w) => w.id === SETTING_ID
  ) as FuelSharingWidgetSettings | undefined;
  const [settings, setSettings] = useState<FuelSharingWidgetSettings>({
    enabled: savedSettings?.enabled ?? false,
    config:
      (savedSettings?.config as FuelSharingWidgetSettings['config']) ??
      defaultConfig,
  });

  const [activeTab, setActiveTab] = useState<SettingsTabType>(
    () =>
      (localStorage.getItem('fuelSharingTab') as SettingsTabType) ||
      'options'
  );

  const [testStatus, setTestStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [testError, setTestError] = useState<string | undefined>();

  const handleSendTestUpdate = () => {
    const apiKey = settings.config.ably?.apiKey;
    if (!apiKey) {
      setTestStatus('error');
      setTestError('Enter an API key first.');
      return;
    }

    setTestStatus('sending');
    setTestError(undefined);

    const message: FuelShareMessage = {
      driverUserId: TEST_DRIVER_USER_ID,
      driverName: 'Test',
      lap: 1,
      lastLapUsage: 3.2,
      lapsWithFuel: 10,
      timeToEmptySeconds: 900,
      fuelLevel: 32,
      fuelUnits: settings.config.fuelUnits ?? 'L',
      updatedAt: Date.now(),
    };

    const channel = getFuelShareClient(apiKey).channels.get(
      fuelShareChannelName(TEST_DRIVER_USER_ID)
    );

    channel
      .publish(FUEL_SHARE_EVENT, message)
      .then(() => setTestStatus('success'))
      .catch((err: unknown) => {
        setTestStatus('error');
        setTestError(err instanceof Error ? err.message : 'Failed to publish');
      });
  };

  useEffect(() => {
    localStorage.setItem('fuelSharingTab', activeTab);
  }, [activeTab]);

  if (!currentDashboard) {
    return <>Loading...</>;
  }

  return (
    <BaseSettingsSection
      title="Fuel Sharing"
      description="Share your fuel data with teammates over a team Ably channel, and see a spectated teammate's fuel data while watching them."
      settings={settings}
      onSettingsChange={setSettings}
      widgetId={SETTING_ID}
    >
      {(handleConfigChange) => (
        <div className="space-y-4">
          <div className="flex border-b border-slate-700/50">
            <TabButton
              id="options"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              Connection
            </TabButton>
            <TabButton
              id="display"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              Display
            </TabButton>
            <TabButton
              id="visibility"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              Visibility
            </TabButton>
          </div>

          <div>
            {activeTab === 'options' && (
              <SettingsSection title="Team Ably Key">
                <div className="flex items-center justify-between">
                  <div className="max-w-[70%]">
                    <h4 className="text-md font-medium text-slate-300">
                      Ably API Key
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Paste your team&apos;s Ably API key (Publish + Subscribe
                      + History capabilities). Every teammate uses the same
                      key - it stays on this machine and is only sent to
                      Ably.
                    </p>
                  </div>
                  <input
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-48 rounded-md bg-slate-700 text-white px-2 py-1"
                    value={settings.config.ably?.apiKey ?? ''}
                    onChange={(e) =>
                      handleConfigChange({
                        ably: { apiKey: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="max-w-[70%]">
                    <p className="text-sm text-slate-500">
                      Send one test message to verify the key works - check
                      Ably&apos;s Dev Console for the{' '}
                      <code className="text-slate-400">
                        fuel-share:driver-{TEST_DRIVER_USER_ID}
                      </code>{' '}
                      channel.
                    </p>
                    {testStatus === 'success' && (
                      <p className="text-sm text-green-400 mt-1">
                        Sent - check the Ably dashboard.
                      </p>
                    )}
                    {testStatus === 'error' && (
                      <p className="text-sm text-red-400 mt-1">{testError}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSendTestUpdate}
                    disabled={testStatus === 'sending'}
                    className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-slate-200 rounded-md transition-colors shrink-0"
                  >
                    {testStatus === 'sending' ? 'Sending...' : 'Send Test Update'}
                  </button>
                </div>

                <SettingButtonGroupRow<'L' | 'gal'>
                  title="Fuel Units"
                  value={settings.config.fuelUnits ?? 'L'}
                  options={[
                    { label: 'Liters', value: 'L' },
                    { label: 'Gallons', value: 'gal' },
                  ]}
                  onChange={(v) =>
                    handleConfigChange({
                      fuelUnits: v,
                    })
                  }
                />
              </SettingsSection>
            )}

            {activeTab === 'display' && (
              <SettingsSection title="Display">
                <SettingSliderRow
                  title="Background Opacity"
                  value={settings.config.background?.opacity ?? 80}
                  units="%"
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) =>
                    handleConfigChange({
                      background: { opacity: v },
                    })
                  }
                />

                <SettingSliderRow
                  title="Foreground Opacity"
                  value={settings.config.foreground?.opacity ?? 70}
                  units="%"
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) =>
                    handleConfigChange({
                      foreground: { opacity: v },
                    })
                  }
                />

                <SettingSliderRow
                  title="Scale"
                  description="Adjust the size of the widget's text"
                  value={settings.config.scale ?? 100}
                  units="%"
                  min={50}
                  max={150}
                  step={1}
                  onChange={(v) =>
                    handleConfigChange({
                      scale: v,
                    })
                  }
                />
              </SettingsSection>
            )}

            {activeTab === 'visibility' && (
              <SettingsSection title="Session Visibility">
                <SessionVisibility
                  sessionVisibility={settings.config.sessionVisibility}
                  handleConfigChange={handleConfigChange}
                />
              </SettingsSection>
            )}
          </div>
        </div>
      )}
    </BaseSettingsSection>
  );
};
