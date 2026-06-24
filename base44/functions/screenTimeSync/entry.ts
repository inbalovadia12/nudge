import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const method = req.method;

    // GET — returns the user's block list configuration
    // A native iOS companion app calls this to sync with Apple Screen Time
    if (method === 'GET') {
      const blockedApps = await base44.asServiceRole.entities.BlockedApp.filter({ is_active: true });

      const config = blockedApps.map(app => ({
        app_name: app.app_name,
        block_url: app.block_url,
        app_type: app.app_type,
        category: app.category,
        gate_mode: app.gate_mode || 'block',
        screen_time_blocked: app.screen_time_blocked || false,
      }));

      // Also get the user's Screen Time connection status
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by_id: user.id });
      const screenTimeConnected = profiles[0]?.connected_apple_screen_time || false;

      return Response.json({
        user_id: user.id,
        screen_time_enabled: screenTimeConnected,
        blocked_apps: config,
        total_blocked: config.length,
        instructions: screenTimeConnected
          ? 'Screen Time is enabled. The companion app should apply these restrictions via the Family Controls framework.'
          : 'Screen Time is not enabled. User needs to connect in the app first.',
      });
    }

    // POST — called by the native iOS app to update blocking status
    // Body: { apps: [{ block_url, screen_time_blocked }] }
    if (method === 'POST') {
      const body = await req.json();
      if (!body.apps || !Array.isArray(body.apps)) {
        return Response.json({ error: 'apps array required' }, { status: 400 });
      }

      const results = [];
      for (const update of body.apps) {
        const apps = await base44.asServiceRole.entities.BlockedApp.filter({
          block_url: update.block_url,
          is_active: true
        });
        if (apps.length > 0) {
          const updated = await base44.asServiceRole.entities.BlockedApp.update(apps[0].id, {
            screen_time_blocked: update.screen_time_blocked
          });
          results.push({ block_url: update.block_url, status: 'updated', screen_time_blocked: updated.screen_time_blocked });
        }
      }

      return Response.json({ updated: results.length, results });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});