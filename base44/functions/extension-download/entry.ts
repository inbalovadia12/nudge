import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const EXTENSION_ZIP_URL = 'https://media.base44.com/files/public/6a3ae5c0253dd0bc3229da04/a0768eb4a_nudigo-extension-v16.zip';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles[0];

    if (!profile || !['plus', 'pro'].includes(profile.plan_type)) {
      return Response.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    // Fetch the pre-built extension ZIP
    const zipResponse = await fetch(EXTENSION_ZIP_URL);
    if (!zipResponse.ok) {
      console.error(`Failed to fetch extension ZIP: ${zipResponse.status}`);
      return Response.json({ error: 'Failed to download extension package' }, { status: 500 });
    }
    const zipBuffer = await zipResponse.arrayBuffer();
    const zipBytes = new Uint8Array(zipBuffer);

    // Convert to base64
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < zipBytes.length; i += chunkSize) {
      const chunk = zipBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const zipBase64 = btoa(binary);

    return Response.json({ zip_base64: zipBase64, filename: 'nudigo-extension-v16.zip' });
  } catch (error) {
    console.error('extension-download error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});