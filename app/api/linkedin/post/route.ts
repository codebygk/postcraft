import { NextRequest, NextResponse } from 'next/server';

async function uploadImage(accessToken: string, imageBase64: string, mimeType: string): Promise<string> {
  // Step 1: Register upload
  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner:   'PLACEHOLDER', // replaced below
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier:       'urn:li:userGeneratedContent',
        }],
      },
    }),
  });

  if (!registerRes.ok) throw new Error(`Image register failed: ${registerRes.status}`);
  const registerData = await registerRes.json();
  const uploadUrl    = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  const asset        = registerData.value?.asset;
  if (!uploadUrl || !asset) throw new Error('No upload URL returned from LinkedIn');

  // Step 2: Upload binary
  const binary = Buffer.from(imageBase64, 'base64');
  const uploadRes = await fetch(uploadUrl, {
    method:  'PUT',
    headers: { 'Content-Type': mimeType },
    body:    binary,
  });
  if (!uploadRes.ok) throw new Error(`Image upload failed: ${uploadRes.status}`);

  return asset as string; // e.g. "urn:li:digitalmediaAsset:xxxx"
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { accessToken, authorUrn, content, imageBase64, imageMimeType } = body as {
    accessToken:   string;
    authorUrn:     string;
    content:       string;
    imageBase64?:  string;
    imageMimeType?: string;
  };

  if (!accessToken || !authorUrn || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    let mediaAsset: string | null = null;

    // Upload image if provided
    if (imageBase64 && imageMimeType) {
      // Fix owner in register request — re-do with correct URN
      const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner:   authorUrn,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier:       'urn:li:userGeneratedContent',
            }],
          },
        }),
      });

      if (!registerRes.ok) {
        const err = await registerRes.text();
        return NextResponse.json({ error: `Image register failed: ${err}` }, { status: 500 });
      }

      const registerData = await registerRes.json();
      const uploadUrl    = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      const asset        = registerData.value?.asset;

      if (uploadUrl && asset) {
        const binary = Buffer.from(imageBase64, 'base64');
        const uploadRes = await fetch(uploadUrl, {
          method:  'PUT',
          headers: { 'Content-Type': imageMimeType },
          body:    binary,
        });
        if (uploadRes.ok) mediaAsset = asset as string;
      }
    }

    // Build post body
    const shareContent = mediaAsset
      ? {
          shareCommentary:    { text: content },
          shareMediaCategory: 'IMAGE',
          media: [{
            status:        'READY',
            description:   { text: '' },
            media:          mediaAsset,
            title:          { text: '' },
          }],
        }
      : {
          shareCommentary:    { text: content },
          shareMediaCategory: 'NONE',
        };

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author:         authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': shareContent,
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      return NextResponse.json({ error: `LinkedIn post failed: ${err}` }, { status: postRes.status });
    }

    const postData = await postRes.json();
    return NextResponse.json({ success: true, id: postData.id });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}