import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const EXTENSION_FILE_URL = 'https://media.base44.com/files/public/6a3ae5c0253dd0bc3229da04/27e87cfe8_nudigo-extension-v16.zip';

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

    return Response.json({ download_url: EXTENSION_FILE_URL, version: '1.6' });
  } catch (error) {
    console.error('extension-download error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});