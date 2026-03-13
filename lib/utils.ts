import type { GenerateRequest, Platform } from '@/types';
import { PLATFORM_DEFAULT_LENGTH } from './constants';

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function buildPrompt(req: GenerateRequest, platform: Platform): string {
  const range = PLATFORM_DEFAULT_LENGTH[platform];

  const platformCtx: Record<Platform, string> = {
    linkedin:  'LinkedIn (professional network, max 3000 chars)',
    x:         'X / Twitter (max 280 chars total - hashtags count toward this limit)',
    instagram: 'Instagram (max 2200 chars; first line is the hook shown before "more")',
  };

  const formattingCtx: Record<Platform, string> = {
    linkedin:  'Short paragraphs of 2–3 sentences. Strong opening line. Blank line between sections.',
    x:         'Single tight paragraph. No line breaks. Every character counts.',
    instagram: 'Hook in the very first line. Short paragraphs separated by blank lines.',
  };

  const emojiInstr = req.includeEmoji
    ? platform === 'x' ? 'You may use 1 emoji if it fits naturally.'
      : 'Use 3–5 relevant emojis for visual rhythm.'
    : 'Do NOT use any emojis.';

  const hashtagInstr = req.includeHashtags
    ? platform === 'x'         ? 'End with 1–2 hashtags (they count toward the 280-char limit).'
    : platform === 'instagram' ? 'Add 5–10 relevant hashtags on a new line at the very end.'
    :                            'Add 3–5 professional hashtags at the end.'
    : 'Do NOT include any hashtags.';

  const personaLine = req.persona?.trim()
    ? `Write as: ${req.persona.trim()}`
    : '';

  return `You are writing a ${req.tone} post for ${platformCtx[platform]}.

Topic: "${req.topic}"
${personaLine}

STRICT LENGTH REQUIREMENT:
- Your response MUST be between ${range.min} and ${range.max} characters.
- Count every character including spaces, punctuation, and hashtags.
- Do not go under ${range.min} or exceed ${range.max} characters.

Formatting: ${formattingCtx[platform]}
${emojiInstr}
${hashtagInstr}

Return ONLY the final post text. No labels, no quotes, no explanations.`;
}

export function countHashtags(text: string): number {
  return (text.match(/#\w+/g) || []).length;
}

export function formatTimestamp(ts: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}