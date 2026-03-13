'use client';
import { useState, useEffect } from 'react';
import type { GenerateRequest, GeneratedResults, Platform } from '@/types';
import { generatePosts } from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import { useTheme } from '@/hooks/useTheme';
import { APP_NAME, PLATFORMS } from '@/lib/constants';
import { PostForm } from '@/components/features/PostForm';
import { PostResult } from '@/components/features/PostResult';
import { HistoryPanel } from '@/components/features/HistoryPanel';
import { SettingsPanel } from '@/components/features/SettingsPanel';
import { NavBtn } from '@/components/ui/NavBtn';
import { SparkleIcon, HistoryIcon, SettingsIcon, SunIcon, MoonIcon } from '@/components/icons';

type Tab = 'generate' | 'history' | 'settings';

export default function Home() {
  const { settings, saveSettings, loaded } = useSettings();
  const { history, addEntry, clearHistory } = useHistory();
  const { dark, toggle: toggleTheme }       = useTheme();

  const [tab,              setTab]             = useState<Tab>('generate');
  const [loading,          setLoading]         = useState(false);
  const [error,            setError]           = useState('');
  const [results,          setResults]         = useState<GeneratedResults | null>(null);
  const [enabledPlatforms, setEnabledPlatforms]= useState<Platform[]>(['linkedin', 'x', 'instagram']);

  useEffect(() => { /* no free-tier usage check needed */ }, []);

  async function handleGenerate(req: GenerateRequest) {
    const active = PLATFORMS.map(p => p.id).filter(id => req.platformSettings[id]?.enabled);
    setEnabledPlatforms(active);
    setError('');
    setLoading(true);
    setResults(null);
    try {
      const res = await generatePosts(req, settings);
      setResults(res);
      addEntry({ id: Date.now().toString(), timestamp: Date.now(), request: req, results: res });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <SparkleIcon className="brand-icon" />
          <span className="brand-name">{APP_NAME}</span>
          <span className="brand-tagline">AI-powered social posts</span>
        </div>
        <nav className="header-nav">
          <NavBtn icon={<SparkleIcon className="nav-icon" />} label="Generate" onClick={() => setTab('generate')} active={tab === 'generate'} />
          <NavBtn icon={<HistoryIcon className="nav-icon" />} label="History"  onClick={() => setTab('history')}  active={tab === 'history'}  />
          <NavBtn icon={<SettingsIcon className="nav-icon" />} label="Settings" onClick={() => setTab('settings')} active={tab === 'settings'} />
          <button className="theme-toggle" onClick={toggleTheme}>
            {dark ? <SunIcon className="nav-icon" /> : <MoonIcon className="nav-icon" />}
          </button>
        </nav>
      </header>

      <div className="app-body">
        {/* Generate panel — always mounted to preserve form state */}
        <div className={`generate-layout${tab === 'generate' ? '' : ' generate-layout-hidden'}`}>
          <PostForm onGenerate={handleGenerate} loading={loading} limitReached={false} />
          <main className="results-area">
            {error && <div className="error-banner">{error}</div>}
            {(loading || results) ? (
              <PostResult results={results ?? {}} loading={loading} enabledPlatforms={enabledPlatforms} />
            ) : (
              <div className="empty-state">
                <SparkleIcon className="empty-icon" />
                <p className="empty-title">Your posts will appear here</p>
                <p className="empty-sub">Pick a tone, set a persona, choose platforms, and hit Generate.</p>
              </div>
            )}
          </main>
        </div>

        {tab === 'history' && (
          <main className="full-panel">
            <HistoryPanel history={history} onClear={clearHistory} />
          </main>
        )}
        {tab === 'settings' && (
          <main className="full-panel">
            <SettingsPanel
              settings={settings}
              onSave={s => { saveSettings(s); setError(''); }}
              freeUsed={0}
              freeLimit={0}
            />
          </main>
        )}
      </div>
    </div>
  );
}