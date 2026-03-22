import { useState, useCallback } from 'react';
import type { Settings, Period } from '../types';
import { getSettings, saveSettings } from '../lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(getSettings);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((period: Period, budgetAmount: number, monthStartDay?: number) => {
    updateSettings({ period, budgetAmount, onboardingComplete: true, ...(monthStartDay != null && { monthStartDay }) });
  }, [updateSettings]);

  return { settings, updateSettings, completeOnboarding };
}
