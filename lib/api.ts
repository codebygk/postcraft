import type { GenerateRequest, GeneratedPost, GeneratedResults, Settings, Platform } from '@/types';
import { buildPrompt, countHashtags } from './utils';
import { PLATFORMS } from './constants';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function callGenerate(prompt: string, settings: Settings): Promise<string> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.model,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(err.error ?? 'Generation failed', res.status);
  }
  return (await res.json()).content ?? '';
}

function makePost(platform: Platform, content: string): GeneratedPost {
  const trimmed = content.trim();
  return { platform, content: trimmed, characterCount: trimmed.length, hashtagCount: countHashtags(trimmed) };
}

export async function generatePosts(req: GenerateRequest, settings: Settings): Promise<GeneratedResults> {
  const activePlatforms = PLATFORMS
    .map(p => p.id)
    .filter(id => req.platformSettings[id]?.enabled);

  if (activePlatforms.length === 0) throw new ApiError('No platforms enabled.');

  const entries = await Promise.all(
    activePlatforms.map(async (platform) => {
      const content = await callGenerate(buildPrompt(req, platform), settings);
      return [platform, makePost(platform, content)] as [Platform, GeneratedPost];
    })
  );

  return Object.fromEntries(entries) as GeneratedResults;
}