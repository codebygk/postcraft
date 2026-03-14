import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, incrementRateLimit } from '@/lib/rateLimit';
import { FREE_TIER_LIMIT, DEFAULT_API_KEY, DEFAULT_BASE_URL, DEFAULT_MODEL } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

  const { prompt, apiKey: userKey, baseUrl: userBaseUrl, model: userModel } = body;

  const apiKey  = userKey    || DEFAULT_API_KEY;
  const baseUrl = (userBaseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
  const model   = userModel  || DEFAULT_MODEL;

  // Rate-limit only when using the server's default key
  if (!userKey && DEFAULT_API_KEY) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { allowed } = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: `Free limit of ${FREE_TIER_LIMIT} reached. Add your API key in settings.` },
        { status: 429 }
      );
    }
    await incrementRateLimit(ip);
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured. Add one in Settings.' }, { status: 401 });
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://postgenerate.app',
        'X-Title': 'PostGenerate',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message ?? `API error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? '' });
  } catch {
    return NextResponse.json({ error: 'Failed to reach AI provider.' }, { status: 500 });
  }
}