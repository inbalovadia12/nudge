import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Normalization helpers ───

function normalizeDate(input) {
  if (!input) return null;
  const s = String(input).trim();

  // ISO: YYYY-MM-DD or YYYY/MM/DD
  const iso = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  // MM/DD/YYYY or DD/MM/YYYY (slash or dot)
  const slashMatch = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
  if (slashMatch) {
    let [, p1, p2, y] = slashMatch;
    let m, d;
    if (Number(p1) > 12) { d = p1; m = p2; } else { m = p1; d = p2; }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD-MM-YYYY or MM-DD-YYYY (dash)
  const dashMatch = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dashMatch) {
    let [, p1, p2, y] = dashMatch;
    let m, d;
    if (Number(p1) > 12) { d = p1; m = p2; } else { m = p1; d = p2; }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // "15 Jan 2024" or "Jan 15, 2024"
  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  const dmy = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})/);
  if (dmy) {
    const m = months[dmy[2].toLowerCase().slice(0, 3)];
    if (m) return `${dmy[3]}-${m}-${dmy[1].padStart(2, '0')}`;
  }
  const mdy = s.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdy) {
    const m = months[mdy[1].toLowerCase().slice(0, 3)];
    if (m) return `${mdy[3]}-${m}-${mdy[2].padStart(2, '0')}`;
  }

  // Fallback: native Date
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return null;
}

function normalizeAmount(input) {
  if (typeof input === 'number') return input;
  if (!input && input !== 0) return NaN;
  let s = String(input).trim();

  // Detect negative: leading minus or parentheses
  const isNegative = /^\(.*\)$/.test(s) || s.startsWith('-');
  // Strip currency symbols, spaces, signs, parentheses
  s = s.replace(/[$€£¥₹\s()\-+]/g, '');

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Last separator is the decimal separator
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // European: 1.234,56 → 1234.56
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,234.56 → 1234.56
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal comma: 1234,56 → 1234.56
      s = parts[0] + '.' + parts[1];
    } else {
      // Thousands: 1,234 → 1234
      s = s.replace(/,/g, '');
    }
  }

  const num = parseFloat(s);
  if (isNaN(num)) return NaN;
  return isNegative ? -Math.abs(num) : num;
}

function normalizeMerchant(name) {
  if (!name) return '';
  let m = String(name).trim();
  // Remove leading transaction type prefixes
  m = m.replace(/^(POS\s+|PURCHASE\s+|PAYMENT\s+|DEBIT\s+|CREDIT\s+|CARD\s+|ACH\s+)/i, '');
  // Remove card reference numbers (*1234)
  m = m.replace(/\*+\s*\d+/g, '');
  // Remove standalone long numbers
  m = m.replace(/\b\d{4,}\b/g, '');
  // Remove store/branch numbers
  m = m.replace(/\s+#\s*\d+/gi, '');
  m = m.replace(/\s+(STORE|ST|BR)\s*\d+/gi, '');
  // Remove legal suffixes
  m = m.replace(/\s+(LLC|INC|LTD|CO|CORP|CORPORATION)\.?$/i, '');
  // Collapse whitespace
  m = m.replace(/\s+/g, ' ').trim();
  // Title case
  m = m.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
  return m || String(name).trim();
}

function autoCategorize(merchant) {
  const m = (merchant || '').toLowerCase();
  if (!m) return 'other';
  if (/netflix|spotify|hulu|disney|youtube premium|apple\.com\/bill|google play|amazon prime| audible|pandora/.test(m)) return 'entertainment';
  if (/uber|lyft|shell|chevron|exxon|\bbp\b|gasoline|fuel|transit|metro|parking|toll/.test(m)) return 'transport';
  if (/whole foods|trader joe|kroger|safeway|costco|aldi|grocery|market|food ?mart|publix|wegmans/.test(m)) return 'groceries';
  if (/restaurant|cafe|coffee|starbucks|mcdonald|chipotle|doordash|grubhub|uber ?eats|pizza|bar |grill|bakery|diner/.test(m)) return 'dining';
  if (/electric|water |gas company|comcast|xfinity|verizon|at&t|t-mobile|insurance|rent|mortgage|utility|sprint/.test(m)) return 'bills';
  if (/amazon|ebay|etsy|best buy|macy|nike|zara|h&m|target|walmart/.test(m)) return 'shopping';
  if (/salary|payroll|deposit|wages|paycheck|direct deposit|venmo|zelle|transfer from/.test(m)) return 'income';
  if (/doctor|dental|pharmacy|hospital|medical|cvs|walgreens|clinic/.test(m)) return 'health';
  if (/delta|united|airbnb|hotel|marriott|hilton|expedia|booking|flight|uber ride/.test(m)) return 'travel';
  if (/apple|microsoft|google|bestbuy|tech|software|app store|subscription/.test(m)) return 'tech';
  return 'other';
}

function makeHash(date, merchant, amount, currency) {
  const key = [date, (merchant || '').toLowerCase().trim(), String(amount), (currency || '').toUpperCase().trim()].join('|');
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// ─── Handler ───

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { action, transactions } = payload;

    if (action === 'process_csv') {
      if (!Array.isArray(transactions)) {
        return Response.json({ error: 'transactions array is required' }, { status: 400 });
      }

      // Fetch existing CSV transactions for dedup
      const existing = await base44.entities.UnifiedTransaction.filter({ source: 'csv' });
      const existingHashes = new Set(existing.map(t => t.source_hash).filter(Boolean));

      const batchId = crypto.randomUUID();
      const toCreate = [];
      let duplicateCount = 0;
      let invalidCount = 0;

      for (const t of transactions) {
        const date = normalizeDate(t.date);
        const amount = normalizeAmount(t.amount);
        if (!date || isNaN(amount)) { invalidCount++; continue; }

        const rawDesc = String(t.description || '').trim();
        const merchant = normalizeMerchant(rawDesc) || rawDesc || 'Unknown';
        const currency = String(t.currency || 'USD').toUpperCase().trim();
        const hash = makeHash(date, merchant, amount, currency);

        if (existingHashes.has(hash)) { duplicateCount++; continue; }
        existingHashes.add(hash);

        toCreate.push({
          date,
          description: rawDesc || merchant,
          normalized_merchant: merchant,
          amount,
          currency,
          category: autoCategorize(merchant),
          source: 'csv',
          source_hash: hash,
          is_income: amount < 0,
          import_batch_id: batchId,
        });
      }

      let created = [];
      if (toCreate.length > 0) {
        created = await base44.entities.UnifiedTransaction.bulkCreate(toCreate);
      }

      return Response.json({
        success: true,
        created_count: toCreate.length,
        duplicate_count: duplicateCount,
        invalid_count: invalidCount,
        total: transactions.length,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('CSV import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});