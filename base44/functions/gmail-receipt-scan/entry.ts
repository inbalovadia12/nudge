import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a50d7b48395c4ecd845b2ff';
const DAILY_LIMIT_MS = 24 * 60 * 60 * 1000;
const FEATURE_NAME = 'gmail_receipt_scan';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'scan';

    // Premium check
    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const isPremium = profile.is_premium || profile.plan_type === 'pro' || profile.plan_type === 'plus' ||
      (profile.subscription_status === 'active' && (profile.subscription_plan === 'pro' || profile.subscription_plan === 'plus')) ||
      (profile.premium_trial_end_date && new Date(profile.premium_trial_end_date) > new Date());

    if (!isPremium) return Response.json({ error: 'Premium required' }, { status: 403 });

    // Daily limit check
    const usageRecords = await base44.entities.FeatureUsage.filter({ feature_name: FEATURE_NAME }, '-last_generated_at', 1);
    const lastScan = usageRecords[0];
    const now = Date.now();

    let canScan = true;
    let nextScanAvailable = null;

    if (lastScan?.last_generated_at) {
      const lastScanTime = new Date(lastScan.last_generated_at).getTime();
      const elapsed = now - lastScanTime;
      if (elapsed < DAILY_LIMIT_MS) {
        canScan = false;
        nextScanAvailable = new Date(lastScanTime + DAILY_LIMIT_MS).toISOString();
      }
    }

    if (action === 'status') {
      let connected = false;
      try {
        await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
        connected = true;
      } catch {}

      return Response.json({ connected, can_scan: canScan, next_scan_available: nextScanAvailable });
    }

    // action === 'scan'
    if (!canScan) {
      return Response.json({ error: 'daily_limit', next_scan_available: nextScanAvailable }, { status: 429 });
    }

    // Get Gmail connection (app-user token)
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Gmail not connected' }, { status: 400 });
    }

    // Search for receipt/subscription emails from last 7 days
    const searchQuery = '(receipt OR invoice OR "order confirmation" OR "thank you for your purchase" OR "payment received" OR subscription OR renewal OR "free trial" OR billed OR renewed OR "your plan" OR "receipt from") newer_than:7d -from:facebookmail.com -from:linkedin.com -from:twitter.com -from:instagram.com -from:noreply.github.com';

    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=20`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('Gmail search failed:', errText);
      return Response.json({ error: 'Failed to search Gmail' }, { status: 502 });
    }

    const searchData = await searchRes.json();
    const messageIds = searchData.messages || [];

    if (messageIds.length === 0) {
      await base44.entities.FeatureUsage.create({
        feature_name: FEATURE_NAME,
        last_generated_at: new Date().toISOString(),
        cooldown_period: '24h'
      });

      return Response.json({
        receipts: [],
        subscriptions: [],
        summary: 'No receipt or subscription emails found in the last 7 days. Nice and quiet inbox!',
        scanned_count: 0
      });
    }

    // Fetch metadata for each message
    const messages = [];
    for (const msg of messageIds) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!msgRes.ok) continue;
        const msgData = await msgRes.json();

        const headers = msgData.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        messages.push({ id: msg.id, subject, from, date, snippet: msgData.snippet || '' });
      } catch {}
    }

    if (messages.length === 0) {
      await base44.entities.FeatureUsage.create({
        feature_name: FEATURE_NAME,
        last_generated_at: new Date().toISOString(),
        cooldown_period: '24h'
      });

      return Response.json({
        receipts: [],
        subscriptions: [],
        summary: 'Found some emails but could not read their contents. Please try again later.',
        scanned_count: 0
      });
    }

    // LLM analysis
    const emailData = messages.map(m =>
      `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\nPreview: ${m.snippet}`
    ).join('\n---\n');

    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these emails from the last 7 days and extract financial information.

Emails:
${emailData}

Extract:
1. Receipts: Purchases where money was spent. For each, identify the merchant, amount (in dollars as a number), date (YYYY-MM-DD if determinable, otherwise the date string), and a spending category (one of: dining, shopping, entertainment, transport, groceries, bills, health, travel, tech, other).
2. Subscriptions: Recurring charges, free trials, renewals, or subscription plan changes. For each, identify the service name, amount (if mentioned, as a number; null if unknown), billing cycle ("monthly" or "yearly"), any renewal/trial end date, and whether it's a free trial.
3. A brief, friendly summary (2-3 sentences) of what was found, highlighting any surprising charges, free trials about to expire, or subscriptions worth reviewing.

Only include actual purchases and subscriptions with clear payment intent. Exclude marketing emails, shipping-only notifications without prices, social media, and password resets. If an amount cannot be determined, set it to null.`,
      response_json_schema: {
        type: 'object',
        properties: {
          receipts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                merchant: { type: 'string' },
                amount: { type: 'number' },
                date: { type: 'string' },
                category: { type: 'string' },
                email_subject: { type: 'string' }
              }
            }
          },
          subscriptions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'number' },
                billing_cycle: { type: 'string' },
                renewal_date: { type: 'string' },
                email_subject: { type: 'string' },
                is_trial: { type: 'boolean' }
              }
            }
          },
          summary: { type: 'string' }
        }
      }
    });

    // Save usage record
    await base44.entities.FeatureUsage.create({
      feature_name: FEATURE_NAME,
      last_generated_at: new Date().toISOString(),
      cooldown_period: '24h'
    });

    return Response.json({
      receipts: llmResult.receipts || [],
      subscriptions: llmResult.subscriptions || [],
      summary: llmResult.summary || 'Scan complete.',
      scanned_count: messages.length
    });
  } catch (error) {
    console.error('Gmail receipt scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});