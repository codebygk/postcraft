import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID     = process.env.LINKEDIN_CLIENT_ID     ?? '';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET ?? '';
const REDIRECT_URI  = process.env.LINKEDIN_REDIRECT_URI  ?? '';
const APP_URL       = process.env.NEXT_PUBLIC_APP_URL    ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}?linkedin_error=${error ?? 'no_code'}`);
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  REDIRECT_URI,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}?linkedin_error=token_exchange_failed`);
  }

  const tokenData = await tokenRes.json();
  const accessToken: string = tokenData.access_token;
  const expiresIn: number   = tokenData.expires_in ?? 5184000; // 60 days default

  // Fetch profile (sub + name) via OpenID userinfo
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let sub  = '';
  let name = 'LinkedIn User';

  if (profileRes.ok) {
    const profile = await profileRes.json();
    sub  = profile.sub  ?? '';
    name = profile.name ?? profile.given_name ?? 'LinkedIn User';
  }

  const payload = encodeURIComponent(JSON.stringify({
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
    sub:  `urn:li:person:${sub}`,
    name,
  }));

  // Pass token back to client via redirect with fragment — never in URL param
  return NextResponse.redirect(`${APP_URL}?linkedin_token=${payload}`);
}