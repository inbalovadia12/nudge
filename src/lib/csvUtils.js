// ─── CSV Parsing ───

export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else { current += char; }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

// ─── Auto column mapping (rules-based, Tier 2+) ───

export function autoMapColumns(headers) {
  const mapping = {};
  const used = new Set();

  const findMatch = (patterns) => {
    for (const h of headers) {
      if (used.has(h)) continue;
      if (patterns.some(p => p.test(h.toLowerCase().trim()))) { used.add(h); return h; }
    }
    return null;
  };

  const dateCol = findMatch([/^date$/, /^trans.*date/, /^posted/, /^txn.*date/, /^value.*date/, /^date.*trans/]);
  if (dateCol) mapping[dateCol] = 'date';

  const descCol = findMatch([/^desc/, /^name$/, /^merchant/, /^memo/, /^narration/, /^details/, /^payee/, /^particular/]);
  if (descCol) mapping[descCol] = 'description';

  const amtCol = findMatch([/^amount$/, /^amt$/, /^value$/, /^transaction.*amount/, /^amount.*transaction/]);
  if (amtCol) {
    mapping[amtCol] = 'amount';
  } else {
    const debitCol = findMatch([/^debit$/, /^withdrawal/, /^money.*out/]);
    const creditCol = findMatch([/^credit$/, /^deposit/, /^money.*in/]);
    if (debitCol) mapping[debitCol] = 'amount';
    if (creditCol && !debitCol) mapping[creditCol] = 'amount';
  }

  const curCol = findMatch([/^currency$/, /^ccy$/, /^curr$/]);
  if (curCol) mapping[curCol] = 'currency';

  return mapping;
}

export const SYSTEM_FIELDS = [
  { value: 'ignore', label: 'Ignore' },
  { value: 'date', label: 'Date' },
  { value: 'description', label: 'Description' },
  { value: 'amount', label: 'Amount' },
  { value: 'currency', label: 'Currency' },
];

// ─── Tier helpers ───

export function getUserTier(profile) {
  if (!profile) return 'free';
  if (profile.is_premium || profile.plan_type === 'pro') return 'pro';
  if (profile.plan_type === 'plus') return 'plus';
  if (profile.subscription_status === 'active' && profile.subscription_plan === 'pro') return 'pro';
  if (profile.subscription_status === 'active' && profile.subscription_plan === 'plus') return 'plus';
  if (profile.premium_trial_end_date && new Date(profile.premium_trial_end_date) > new Date()) return 'pro';
  return 'free';
}

export const TIER_LABELS = {
  free: 'Free',
  plus: 'Basic',
  pro: 'Premium',
};

export const TIER_DESCRIPTIONS = {
  free: 'Manual control with CSV import',
  plus: 'Smarter insights and auto-mapping',
  pro: 'Full automation with bank sync',
};

export const CATEGORIES = [
  { value: 'dining', label: 'Dining' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'transport', label: 'Transport' },
  { value: 'bills', label: 'Bills' },
  { value: 'health', label: 'Health' },
  { value: 'travel', label: 'Travel' },
  { value: 'tech', label: 'Tech' },
  { value: 'income', label: 'Income' },
  { value: 'other', label: 'Other' },
];