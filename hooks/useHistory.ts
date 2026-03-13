'use client';
import { useState, useEffect } from 'react';
import type { HistoryEntry, GeneratedResults } from '@/types';

const STORAGE_KEY = 'postcraft_history';
const MAX_ENTRIES = 20;

/** Migrate entries that were saved under old GeneratedPair shape */
function migrateEntry(raw: Record<string, unknown>): HistoryEntry | null {
  try {
    // New shape already has `results`
    if (raw.results && typeof raw.results === 'object') {
      return raw as unknown as HistoryEntry;
    }
    // Old shape had `result` with { linkedin, x } directly
    const oldResult = (raw.result ?? raw.results) as Record<string, unknown> | undefined;
    if (!oldResult) return null;

    const results: GeneratedResults = {};
    for (const platform of ['linkedin', 'x', 'instagram'] as const) {
      const p = oldResult[platform] as Record<string, unknown> | undefined;
      if (p && p.content) {
        const content = String(p.content);
        results[platform] = {
          platform,
          content,
          characterCount: content.length,
          hashtagCount: (content.match(/#\w+/g) || []).length,
        };
      }
    }
    if (Object.keys(results).length === 0) return null;

    return {
      id:        String(raw.id ?? Date.now()),
      timestamp: Number(raw.timestamp ?? Date.now()),
      request:   (raw.request ?? {
        topic: 'Imported',
        platformSettings: {},
        includeHashtags: false,
        includeEmoji: false,
      }) as HistoryEntry['request'],
      results,
    };
  } catch {
    return null;
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown[] = JSON.parse(raw);
        const migrated = parsed
          .map(e => migrateEntry(e as Record<string, unknown>))
          .filter((e): e is HistoryEntry => e !== null);
        setHistory(migrated);
      }
    } catch {}
  }, []);

  function addEntry(entry: HistoryEntry) {
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return { history, addEntry, clearHistory };
}