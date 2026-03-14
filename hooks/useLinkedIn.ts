'use client';
import { useState, useEffect, useCallback } from 'react';
import type { LinkedInToken } from '@/types';

const STORAGE_KEY = 'postcraft_linkedin_token';

export function useLinkedIn() {
  const [token, setToken] = useState<LinkedInToken | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const t: LinkedInToken = JSON.parse(raw);
        // Drop if expired
        if (t.expiresAt > Date.now()) setToken(t);
        else localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, []);

  const saveToken = useCallback((t: LinkedInToken) => {
    setToken(t);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch {}
  }, []);

  const disconnect = useCallback(() => {
    setToken(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const isConnected = token !== null && token.expiresAt > Date.now();

  return { token, isConnected, saveToken, disconnect };
}