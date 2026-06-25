import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const emails = [
      'inbalto.ovadia@gmail.com',
      'inbalovadia292@gmail.com',
    ];

    const results = [];

    for (const email of emails) {
      try {
        const inviteResult = await base44.asServiceRole.users.inviteUser(email, 'admin');
        results.push({ email, invited: true, inviteResult });
      } catch (e) {
        results.push({ email, invited: false, error: e.message });
      }
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});