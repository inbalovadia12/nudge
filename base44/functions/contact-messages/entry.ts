import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_EMAILS = ['inbalto.ovadia@gmail.com', 'inbalovadia292@gmail.com'];
const ADMIN_CODE = '12252012Io';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Public action: create a contact message (no auth required)
    if (body.action === 'create') {
      if (!body.name || !body.email || !body.message) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const created = await base44.asServiceRole.entities.ContactMessage.create({
        name: body.name,
        email: body.email,
        message: body.message,
        status: 'new'
      });
      return Response.json({ success: true, id: created.id });
    }

    // All remaining actions require admin auth + secret code (two-factor)
    const user = await base44.auth.me();
    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (body.admin_code !== ADMIN_CODE) {
      return Response.json({ error: 'Invalid access code' }, { status: 403 });
    }

    if (body.action === 'list') {
      const messages = await base44.asServiceRole.entities.ContactMessage.list('-created_date', 200);
      return Response.json({ messages });
    }

    if (body.action === 'update_status') {
      const updated = await base44.asServiceRole.entities.ContactMessage.update(body.message_id, { status: body.status });
      return Response.json({ message: updated });
    }

    if (body.action === 'delete') {
      await base44.asServiceRole.entities.ContactMessage.delete(body.message_id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('contact-messages error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});