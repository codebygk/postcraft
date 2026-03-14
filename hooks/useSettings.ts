'use client';
import { useState, useEffect } from 'react';
import type { Settings } from '@/types';
import { DEFAULT_BASE_URL, DEFAULT_MODEL, DEFAULT_API_KEY } from '@/lib/constants';

const STORAGE_KEY = 'postgenerate_settings';

const defaults: Settings = {
  apiKey:  DEFAULT_API_KEY,
  baseUrl: DEFAULT_BASE_URL,
  model:   DEFAULT_MODEL,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...defaults, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  function saveSettings(next: Settings) {
    setSettings(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  return { settings, saveSettings, loaded };
}