import type { Tone, Platform } from '@/types';

export const FREE_TIER_LIMIT = 3;

export const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: 'professional',  label: 'Professional', desc: 'Formal & polished'     },
  { value: 'casual',        label: 'Casual',       desc: 'Relaxed & friendly'    },
  { value: 'witty',         label: 'Witty',        desc: 'Clever & humorous'     },
  { value: 'inspirational', label: 'Inspire',      desc: 'Motivating & uplifting'},
  { value: 'educational',   label: 'Educate',      desc: 'Informative & clear'   },
];

export interface PlatformMeta {
  id: Platform;
  label: string;
  charLimit: number;
  colorClass: string;
}

export const PLATFORMS: PlatformMeta[] = [
  { id: 'linkedin',  label: 'LinkedIn',  charLimit: 3000, colorClass: 'linkedin-color'  },
  { id: 'x',         label: 'X',         charLimit: 280,  colorClass: 'x-color'         },
  { id: 'instagram', label: 'Instagram', charLimit: 2200, colorClass: 'instagram-color' },
];

// Default length ranges per platform (fixed, not user-configurable)
export const PLATFORM_DEFAULT_LENGTH: Record<Platform, { min: number; max: number }> = {
  linkedin:  { min: 1200, max: 1500 },
  x:         { min: 200, max: 270 },
  instagram: { min: 300, max: 500 },
};

// Provider presets - exactly these six
export interface ProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  needsKey: boolean;
  tier: string;
  hint: string;
}

export const PROVIDERS: ProviderPreset[] = [
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    needsKey: true,
    tier: 'Free',
    hint: 'console.groq.com',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    needsKey: false,
    tier: 'Free',
    hint: 'Local - ollama.ai',
  },
  {
    id: 'lmstudio',
    label: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    needsKey: false,
    tier: 'Free',
    hint: 'Local - lmstudio.ai',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    needsKey: true,
    tier: 'Paid',
    hint: 'platform.openai.com',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    needsKey: true,
    tier: 'Paid',
    hint: 'openrouter.ai - free models available',
  },
  {
    id: 'together',
    label: 'Together',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3-70b-chat-hf',
    needsKey: true,
    tier: 'Paid',
    hint: 'api.together.ai',
  },
];

export const DEFAULT_PROVIDER   = PROVIDERS[0]; // Groq
export const DEFAULT_BASE_URL   = process.env.DEFAULT_BASE_URL  ?? PROVIDERS[0].baseUrl;
export const DEFAULT_MODEL      = process.env.DEFAULT_MODEL     ?? PROVIDERS[0].defaultModel;
export const DEFAULT_API_KEY    = process.env.DEFAULT_API_KEY   ?? '';
export const APP_NAME           = 'PostCraft';