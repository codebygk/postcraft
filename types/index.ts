export type Platform = 'linkedin' | 'x' | 'instagram';
export type Tone = 'professional' | 'casual' | 'witty' | 'inspirational' | 'educational';

export interface PlatformSettings {
  enabled: boolean;
}

export interface GenerateRequest {
  topic: string;
  tone: Tone;
  persona?: string;
  platformSettings: Record<Platform, PlatformSettings>;
  includeHashtags: boolean;
  includeEmoji: boolean;
}

export interface GeneratedPost {
  platform: Platform;
  content: string;
  characterCount: number;
  hashtagCount: number;
}

export type GeneratedResults = Partial<Record<Platform, GeneratedPost>>;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  request: GenerateRequest;
  results: GeneratedResults;
}

export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface LinkedInToken {
  accessToken: string;
  expiresAt: number;   // ms timestamp
  sub: string;         // LinkedIn person URN like "urn:li:person:xxxx"
  name: string;
}

export type PostStatus = 'idle' | 'uploading' | 'posting' | 'done' | 'error';