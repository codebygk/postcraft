import { NextResponse } from 'next/server';

const CLIENT_ID     = process.env.LINKEDIN_CLIENT_ID ?? '';
const REDIRECT_URI  = process.env.LINKEDIN_REDIRECT_URI ?? '';
const SCOPES        = ['openid', 'profile', 'w_member_social'].join(' ');

export async function GET() {
  if (!CLIENT_ID || !REDIRECT_URI) {
    return NextResponse.json(
      { error: 'LinkedIn OAuth not configured. Add LINKEDIN_CLIENT_ID and LINKEDIN_REDIRECT_URI to .env.local' },
      { status: 500 }
    );
  }

  const state  = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    state,
    scope:         SCOPES,
  });

  const url = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  return NextResponse.redirect(url);
}