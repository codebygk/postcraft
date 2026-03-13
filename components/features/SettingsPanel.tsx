'use client';
import { useState } from 'react';
import type { Settings } from '@/types';
import { PROVIDERS } from '@/lib/constants';
import { KeyIcon } from '@/components/icons';

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  freeUsed: number;
  freeLimit: number;
}

export function SettingsPanel({ settings, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);

  // Detect active provider by baseUrl
  const activeProvider = PROVIDERS.find(
    p => draft.baseUrl.replace(/\/$/, '') === p.baseUrl.replace(/\/$/, '')
  );

  function selectProvider(id: string) {
    const p = PROVIDERS.find(pr => pr.id === id);
    if (!p) return;
    setDraft(d => ({ ...d, baseUrl: p.baseUrl, model: p.defaultModel, apiKey: p.needsKey ? d.apiKey : '' }));
  }

  function handleSave() {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-panel">
      <div className="settings-card">
        <div className="settings-card-header">
          <KeyIcon className="settings-icon" />
          <span className="settings-card-title">Provider &amp; Model</span>
        </div>

        {/* Provider picker */}
        <div className="provider-grid">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              className={`provider-chip ${activeProvider?.id === p.id ? 'provider-chip-on' : ''}`}
              onClick={() => selectProvider(p.id)}
              title={p.hint}
            >
              <span className="provider-chip-label">{p.label}</span>
              {p.tier?.toLowerCase() == 'free' && <span className="provider-chip-free-tier">{p.tier}</span>}
              {p.tier?.toLowerCase() == 'paid' && <span className="provider-chip-paid-tier">{p.tier}</span>}
            </button>
          ))}
        </div>

        {activeProvider && (
          <p className="provider-hint">{activeProvider.hint}</p>
        )}

        <div className="settings-divider" />

        {/* Base URL */}
        <div className="settings-field">
          <label className="settings-field-label">Base URL</label>
          <input
            className="settings-input mono"
            value={draft.baseUrl}
            onChange={e => setDraft(d => ({ ...d, baseUrl: e.target.value }))}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {/* Model */}
        <div className="settings-field">
          <label className="settings-field-label">Model</label>
          <input
            className="settings-input mono"
            value={draft.model}
            onChange={e => setDraft(d => ({ ...d, model: e.target.value }))}
            placeholder={activeProvider?.defaultModel ?? 'model-name'}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {/* API Key — hide for local providers */}
        {(activeProvider?.needsKey ?? true) && (
          <div className="settings-field">
            <label className="settings-field-label">API Key</label>
            <input
              type="password"
              className="settings-input"
              placeholder="Your provider API key"
              value={draft.apiKey}
              onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))}
              autoComplete="new-password"
            />
            <span className="settings-field-hint">Stored locally — never sent to our servers.</span>
          </div>
        )}

        {!activeProvider?.needsKey && (
          <p className="settings-field-hint" style={{ marginTop: '0.25rem' }}>
            No API key needed — {activeProvider?.label} runs locally.
          </p>
        )}

        <button className="save-btn" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}