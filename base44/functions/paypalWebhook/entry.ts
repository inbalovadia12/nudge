import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    console.log('PayPal webhook received:', event.event_type);

    return Response.json({ status: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('PayPal webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});