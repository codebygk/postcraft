'use client';
import { useState } from 'react';
import type { GenerateRequest, Tone, Platform, PlatformSettings } from '@/types';
import { TONES, PLATFORMS } from '@/lib/constants';
import { LinkedInIcon, XIcon, InstagramIcon, SparkleIcon } from '@/components/icons';
import { FormField } from '@/components/ui/FormField';

const PLATFORM_ICONS: Record<Platform, React.FC<{ className?: string }>> = {
  linkedin:  LinkedInIcon,
  x:         XIcon,
  instagram: InstagramIcon,
};

type AllPlatformSettings = Record<Platform, PlatformSettings>;

const defaults: AllPlatformSettings = {
  linkedin:  { enabled: true  },
  x:         { enabled: true  },
  instagram: { enabled: true  },
};

interface Props {
  onGenerate: (req: GenerateRequest) => void;
  loading: boolean;
  limitReached: boolean;
}

export function PostForm({ onGenerate, loading, limitReached }: Props) {
  const [topic,           setTopic]          = useState('');
  const [tone,            setTone]           = useState<Tone>('professional');
  const [persona,         setPersona]        = useState('');
  const [ps,              setPs]             = useState<AllPlatformSettings>(defaults);
  const [includeHashtags, setIncludeHashtags]= useState(true);
  const [includeEmoji,    setIncludeEmoji]   = useState(true);

  function togglePlatform(id: Platform) {
    setPs(prev => {
      const willDisable = prev[id].enabled;
      if (willDisable) {
        const otherOn = PLATFORMS.some(p => p.id !== id && prev[p.id].enabled);
        if (!otherOn) return prev;
      }
      return { ...prev, [id]: { enabled: !prev[id].enabled } };
    });
  }

  const enabledCount = PLATFORMS.filter(p => ps[p.id].enabled).length;
  const canSubmit    = !!topic.trim() && !loading && !limitReached && enabledCount > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onGenerate({ topic, tone, persona, platformSettings: ps, includeHashtags, includeEmoji });
  }

  return (
    <aside className="input-panel">
      <div className="input-panel-inner">

        {/* Topic */}
        <FormField label="Topic">
          <textarea
            className="topic-input"
            placeholder="What do you want to post about?"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            rows={4}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
          />
        </FormField>

        {/* Tone */}
        <div className="ip-section">
          <span className="ip-section-label">Tone</span>
          <div className="tone-grid">
            {TONES.map(t => (
              <button
                key={t.value}
                className={`tone-chip ${tone === t.value ? 'tone-chip-on' : ''}`}
                onClick={() => setTone(t.value)}
                title={t.desc}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Persona */}
        <FormField label="Persona">
          <input
            className="text-input"
            placeholder="e.g. Startup founder, Tech lead…"
            value={persona}
            onChange={e => setPersona(e.target.value)}
          />
        </FormField>

        {/* Platforms */}
        <div className="ip-section">
          <span className="ip-section-label">Platforms</span>
          <div className="platform-list">
            {PLATFORMS.map(p => {
              const on   = ps[p.id].enabled;
              const Icon = PLATFORM_ICONS[p.id];
              return (
                <button
                  key={p.id}
                  className={`pcard ${on ? `pcard-on pcard-${p.id}` : 'pcard-off'}`}
                  onClick={() => togglePlatform(p.id)}
                >
                  <Icon className={`pcard-icon ${p.colorClass}`} />
                  <span className="pcard-name">{p.label}</span>
                  <span className={`toggle-switch ${on ? 'toggle-switch-on' : ''}`}>
                    <span className="toggle-switch-knob" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="ip-section">
          <span className="ip-section-label">Options</span>
          <div className="toggle-row">
            <label className="toggle-label">
              <input type="checkbox" checked={includeHashtags}
                onChange={e => setIncludeHashtags(e.target.checked)} className="toggle-checkbox" />
              <span className="toggle-track" />
              <span className="toggle-text">Hashtags</span>
            </label>
            <label className="toggle-label">
              <input type="checkbox" checked={includeEmoji}
                onChange={e => setIncludeEmoji(e.target.checked)} className="toggle-checkbox" />
              <span className="toggle-track" />
              <span className="toggle-text">Emojis</span>
            </label>
          </div>
        </div>

        {/* Generate */}
        <button className="generate-btn" onClick={handleSubmit} disabled={!canSubmit}>
          {loading
            ? <span className="btn-loading"><span className="spinner" />Generating…</span>
            : <span className="btn-content"><SparkleIcon className="btn-icon" />Generate {enabledCount} Post{enabledCount !== 1 ? 's' : ''}</span>
          }
        </button>

        {limitReached && <p className="limit-msg">Add your API key in Settings to continue.</p>}
      </div>
    </aside>
  );
}