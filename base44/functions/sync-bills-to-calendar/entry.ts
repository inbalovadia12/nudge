import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CALENDAR_ID = 'primary';
const CONNECTOR_ID = '6a3e1b2f6c2cf1b67f3cebd0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync';

    // Get the app user's Google Calendar connection
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    if (action === 'status') {
      // Just checking if connected
      return Response.json({ connected: true });
    }

    if (action === 'sync') {
      // Get all upcoming bills
      const bills = await base44.entities.Bill.filter({ status: 'upcoming' });

      if (!bills || bills.length === 0) {
        return Response.json({ synced: 0, message: 'No upcoming bills to sync' });
      }

      const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
      let synced = 0;
      let skipped = 0;

      for (const bill of bills) {
        if (!bill.due_date) { skipped++; continue; }

        const dueDate = new Date(bill.due_date);
        const eventStart = new Date(dueDate);
        eventStart.setHours(9, 0, 0, 0);
        const eventEnd = new Date(eventStart);
        eventEnd.setHours(10, 0, 0, 0);

        // Check if event already exists by searching for it
        const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?q=${encodeURIComponent('Bill: ' + bill.name)}&timeMin=${new Date().toISOString()}&maxResults=1`;
        try {
          const searchRes = await fetch(searchUrl, { headers: authHeader });
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.items && searchData.items.length > 0) {
              skipped++;
              continue;
            }
          }
        } catch (e) {
          console.error('Search error for bill:', bill.name, e);
        }

        const event = {
          summary: `Bill Due: ${bill.name}`,
          description: `Amount: $${bill.amount}\nCategory: ${bill.category || 'other'}\nStatus: ${bill.status}\n\nSynced from Nudge.`,
          start: { dateTime: eventStart.toISOString(), timeZone: 'UTC' },
          end: { dateTime: eventEnd.toISOString(), timeZone: 'UTC' },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }, { method: 'popup', minutes: 60 }] },
          colorId: bill.status === 'overdue' ? '11' : '5',
        };

        try {
          const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify(event),
          });
          if (res.ok) synced++;
          else { console.error('Create event failed:', await res.text()); skipped++; }
        } catch (e) {
          console.error('Create event error for bill:', bill.name, e);
          skipped++;
        }
      }

      return Response.json({ synced, skipped, total: bills.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});