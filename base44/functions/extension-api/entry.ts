import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'get_data': {
        const [blocklist, profiles, purchases] = await Promise.all([
          base44.entities.BlockedApp.filter({ is_active: true }),
          base44.entities.UserProfile.list(),
          base44.entities.Purchase.list('-date', 50),
        ]);

        const profile = profiles[0] || {};
        const totalSpent = purchases.reduce((s, p) => s + (p.amount || 0), 0);
        const balance = (profile.monthly_income || 0) - totalSpent;

        return Response.json({
          blocklist,
          profile: {
            first_name: profile.first_name,
            monthly_income: profile.monthly_income,
            balance: Math.round(balance),
            total_spent: Math.round(totalSpent),
            strictness: profile.strictness
          },
          settings: { defaultGateMode: 'block' }
        });
      }

      case 'add_block': {
        const created = await base44.entities.BlockedApp.create({
          app_name: body.app_name,
          block_url: body.block_url,
          app_type: body.app_type || 'website',
          category: body.category || 'shopping',
          gate_mode: body.gate_mode || 'block',
          is_active: true,
          screen_time_blocked: false
        });
        return Response.json({ success: true, block: created });
      }

      case 'remove_block': {
        await base44.entities.BlockedApp.delete(body.block_id);
        return Response.json({ success: true });
      }

      case 'update_block': {
        const updated = await base44.entities.BlockedApp.update(body.block_id, {
          gate_mode: body.gate_mode
        });
        return Response.json({ success: true, block: updated });
      }

      case 'ai_query': {
        // Build financial context
        const [profiles, goals, purchases, bills, subscriptions] = await Promise.all([
          base44.entities.UserProfile.list(),
          base44.entities.SavingsGoal.filter({ status: 'active' }),
          base44.entities.Purchase.list('-date', 50),
          base44.entities.Bill.filter({ status: 'upcoming' }).catch(() => []),
          base44.entities.Subscription.filter({ status: 'active' }).catch(() => []),
        ]);

        const profile = profiles[0] || {};
        const primaryGoal = goals.find(g => g.is_primary) || goals[0] || null;
        const totalSpent = purchases.reduce((s, p) => s + (p.amount || 0), 0);
        const balance = (profile.monthly_income || 0) - totalSpent;

        let contextStr = `User name: ${profile.first_name}. Monthly income: $${profile.monthly_income || 0}. Current balance: $${Math.round(balance)}. Recent spending: $${Math.round(totalSpent)}. Coaching strictness: ${profile.strictness || 'moderate'}.`;
        if (primaryGoal) {
          const pct = Math.round((primaryGoal.current_amount / primaryGoal.target_amount) * 100);
          contextStr += ` Primary savings goal: "${primaryGoal.name}" target $${primaryGoal.target_amount} saved $${primaryGoal.current_amount} (${pct}% complete).`;
        }
        if (purchases.length > 0) {
          contextStr += ` Recent purchases: ${purchases.slice(0, 5).map(p => `${p.merchant} $${p.amount}`).join(', ')}.`;
        }
        if (subscriptions.length > 0) {
          contextStr += ` Active subscriptions: ${subscriptions.map(s => `${s.name} $${s.monthly_cost}/mo`).join(', ')}.`;
        }

        // Handle screenshot upload
        let fileUrls = undefined;
        if (body.screenshot) {
          try {
            const base64Data = body.screenshot.includes(',') ? body.screenshot.split(',')[1] : body.screenshot;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'image/png' });
            const file = new File([blob], 'screenshot.png', { type: 'image/png' });
            const uploadResult = await base44.integrations.Core.UploadFile({ file });
            fileUrls = [uploadResult.file_url];
          } catch (err) {
            console.error('Screenshot upload failed:', err);
          }
        }

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `You are Nudigo, a personal financial AI assistant embedded in a Chrome extension. The user is browsing a shopping website and asking a question.${body.screenshot ? ' They have shared a screenshot of what they are looking at — analyze the product and price if visible.' : ''}

FINANCIAL CONTEXT:
${contextStr}

USER QUESTION: "${body.question}"

INSTRUCTIONS:
- Answer directly and helpfully in 2-4 sentences
- Use their actual financial data to give specific advice
- If they're looking at a product (from screenshot), consider the price and whether they can afford it based on their balance
- Be encouraging but honest — if they can't afford it, say so kindly
- Reference their savings goals when relevant
- Never use the word "budget" — say "spending" instead`,
          file_urls: fileUrls,
        });

        const responseText = typeof llmResponse === 'string' ? llmResponse : String(llmResponse);
        return Response.json({ response: responseText });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('extension-api error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});