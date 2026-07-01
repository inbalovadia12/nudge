import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ═══════════════════════════════════════════════════════════════
// PLAID WEBHOOK HANDLER
// Verifies Plaid webhook signatures, processes events idempotently.
// Handles: INITIAL_UPDATE, DEFAULT_UPDATE, HISTORICAL_UPDATE,
// TRANSACTIONS_REMOVED, ITEM_LOGIN_REQUIRED, ITEM_ERROR,
// NEW_ACCOUNTS_AVAILABLE
// ═══════════════════════════════════════════════════════════════

const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";
const PLAID_URL = `https://${PLAID_ENV}.plaid.com`;
const CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
const SECRET = Deno.env.get("PLAID_SECRET");

// ═══════════════════════════════════════════════════════════════
// WEBHOOK SIGNATURE VERIFICATION (JWT via Plaid JWKS)
// ═══════════════════════════════════════════════════════════════

const enc = new TextEncoder();
const dec = new TextDecoder();

// Cache JWKS to avoid fetching on every webhook
let jwksCache: any = null;
let jwksCacheTime = 0;
const JWKS_CACHE_MS = 60 * 60 * 1000; // 1 hour

async function fetchJwks() {
  const now = Date.now();
  if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_MS) {
    return jwksCache;
  }
  const res = await fetch(`${PLAID_URL}/.well-known/plaid-verification.jwks`);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
  jwksCache = await res.json();
  jwksCacheTime = now;
  return jwksCache;
}

function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function verifyPlaidWebhook(req: Request): Promise<boolean> {
  const token = req.headers.get('Plaid-Verification');
  if (!token) throw new Error('Missing Plaid-Verification header');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header and payload
  const header = JSON.parse(dec.decode(b64urlDecode(headerB64)));
  const payload = JSON.parse(dec.decode(b64urlDecode(payloadB64)));

  if (header.alg !== 'ES256') throw new Error('Unexpected algorithm: ' + header.alg);

  // Fetch JWKS and find matching key
  const jwks = await fetchJwks();
  const key = jwks.keys?.find((k: any) => k.kid === header.kid);
  if (!key) throw new Error('No matching verification key found');

  // Import EC public key
  const cryptoKey = await crypto.subtle.importKey(
    'jwk', key,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['verify']
  );

  // Verify JWT signature
  const data = enc.encode(`${headerB64}.${payloadB64}`);
  const signature = b64urlDecode(signatureB64);
  const valid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, signature, data
  );

  if (!valid) throw new Error('Invalid webhook signature');

  // Check iat is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (payload.iat && Math.abs(now - payload.iat) > 300) {
    throw new Error('Webhook token expired');
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════
// AES-256-GCM TOKEN DECRYPTION (same key derivation as main function)
// ═══════════════════════════════════════════════════════════════

async function getEncryptionKey() {
  if (!SECRET) throw new Error('PLAID_SECRET not configured');
  const salt = enc.encode('nudigo-plaid-token-encryption-v1');
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(SECRET), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  );
}

async function decryptToken(encryptedB64: string, ivB64: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, ciphertext
  );
  return dec.decode(plaintext);
}

// ═══════════════════════════════════════════════════════════════
// PLAID API
// ═══════════════════════════════════════════════════════════════

async function plaidRequest(endpoint: string, body: Record<string, any>) {
  const res = await fetch(`${PLAID_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, secret: SECRET, ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_message || `Plaid API error: ${res.status}`);
  return data;
}

async function plaidRequestWithRetry(endpoint: string, body: Record<string, any>, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await plaidRequest(endpoint, body);
    } catch (err: any) {
      lastErr = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ═══════════════════════════════════════════════════════════════
// WEBHOOK PROCESSOR
// ═══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  let webhookType = 'unknown';
  let webhookCode = 'unknown';
  let itemId = 'unknown';

  try {
    // ─── Verify webhook signature ───
    await verifyPlaidWebhook(req);

    const body = await req.json();
    webhookType = body.webhook_type || 'unknown';
    webhookCode = body.webhook_code || 'unknown';
    itemId = body.item_id || 'unknown';

    console.log(`Plaid webhook: ${webhookType}/${webhookCode} for item ${itemId}`);

    const base44 = createClientFromRequest(req);

    // ─── Find the PlaidItem (service role — no user context in webhooks) ───
    const items = await base44.asServiceRole.entities.PlaidItem.filter({ item_id: itemId });
    if (!items.length) {
      console.log(`No PlaidItem found for item_id: ${itemId}`);
      await logWebhook(base44, webhookType, webhookCode, itemId, 'skipped', 'Item not found');
      return Response.json({ success: true, message: 'Item not found, skipped' });
    }
    const plaidItem = items[0];

    let status = 'processed';
    let errorMessage: string | null = null;

    try {
      switch (webhookCode) {
        // ─── Transaction sync webhooks ───
        case 'INITIAL_UPDATE':
        case 'DEFAULT_UPDATE':
        case 'HISTORICAL_UPDATE': {
          const accessToken = await decryptToken(plaidItem.encrypted_access_token, plaidItem.encryption_iv);
          let cursor = plaidItem.sync_cursor || '';
          let hasMore = true;
          let totalProcessed = 0;

          while (hasMore) {
            const syncRes = await plaidRequestWithRetry('/transactions/sync', {
              access_token: accessToken, cursor,
            });

            // Upsert added/modified (dedup by transaction_id)
            const txns = [...(syncRes.added || []), ...(syncRes.modified || [])];
            if (txns.length > 0) {
              const existing = await base44.asServiceRole.entities.BankTransaction.filter({});
              const txnMap = new Map(existing.map((e: any) => [e.transaction_id, e]));
              const toCreate: any[] = [], toUpdate: any[] = [];
              for (const t of txns) {
                const txnData = {
                  transaction_id: t.transaction_id,
                  name: t.name,
                  merchant_name: t.merchant_name,
                  amount: t.amount,
                  date: t.date,
                  category: t.category ? t.category[0] : null,
                  account_id: t.account_id,
                };
                if (txnMap.has(t.transaction_id)) {
                  toUpdate.push({ id: txnMap.get(t.transaction_id).id, ...txnData });
                } else {
                  toCreate.push(txnData);
                }
              }
              if (toCreate.length > 0) await base44.asServiceRole.entities.BankTransaction.bulkCreate(toCreate);
              if (toUpdate.length > 0) await base44.asServiceRole.entities.BankTransaction.bulkUpdate(toUpdate);

              // Also sync into UnifiedTransaction (dedup by hash)
              const unifiedExisting = await base44.asServiceRole.entities.UnifiedTransaction.filter({ source: 'plaid' });
              const unifiedMap = new Map(unifiedExisting.map((e: any) => [e.source_hash, e]));
              const unifiedToCreate: any[] = [];
              for (const t of txns) {
                const merchant = t.merchant_name || t.name || 'Unknown';
                const key = [t.date, merchant.toLowerCase().trim(), String(t.amount), 'USD'].join('|');
                let hash = 5381;
                for (let i = 0; i < key.length; i++) {
                  hash = ((hash << 5) + hash) + key.charCodeAt(i);
                }
                const hashStr = (hash >>> 0).toString(16);
                if (unifiedMap.has(hashStr)) continue;
                unifiedMap.set(hashStr, true);
                unifiedToCreate.push({
                  date: t.date,
                  description: t.name,
                  normalized_merchant: merchant,
                  amount: t.amount,
                  currency: 'USD',
                  category: t.category ? t.category[0] : 'other',
                  source: 'plaid',
                  source_hash: hashStr,
                  is_income: t.amount < 0,
                  account_id: t.account_id,
                });
              }
              if (unifiedToCreate.length > 0) {
                await base44.asServiceRole.entities.UnifiedTransaction.bulkCreate(unifiedToCreate);
              }
            }

            // Process removed
            if ((syncRes.removed || []).length > 0) {
              const removedIds = syncRes.removed.map((r: any) => r.transaction_id);
              const existingRemoved = await base44.asServiceRole.entities.BankTransaction.filter({});
              for (const t of existingRemoved) {
                if (removedIds.includes(t.transaction_id)) {
                  await base44.asServiceRole.entities.BankTransaction.delete(t.id);
                }
              }
            }

            totalProcessed += txns.length;
            cursor = syncRes.next_cursor;
            hasMore = syncRes.has_more;
          }

          // Update item with new cursor and clear errors
          await base44.asServiceRole.entities.PlaidItem.update(plaidItem.id, {
            sync_cursor: cursor,
            last_sync_date: new Date().toISOString(),
            status: 'active',
            webhook_last_received: new Date().toISOString(),
            webhook_last_code: webhookCode,
            last_error_code: null,
            last_error_type: null,
            last_error_message: null,
          });
          console.log(`Webhook ${webhookCode}: processed ${totalProcessed} transactions`);
          break;
        }

        // ─── Transactions removed ───
        case 'TRANSACTIONS_REMOVED': {
          const removedTxns = body.removed_transactions || [];
          if (removedTxns.length > 0) {
            const existing = await base44.asServiceRole.entities.BankTransaction.filter({});
            for (const t of existing) {
              if (removedTxns.includes(t.transaction_id)) {
                await base44.asServiceRole.entities.BankTransaction.delete(t.id);
              }
            }
          }
          await base44.asServiceRole.entities.PlaidItem.update(plaidItem.id, {
            webhook_last_received: new Date().toISOString(),
            webhook_last_code: webhookCode,
          });
          break;
        }

        // ─── Item needs re-authentication ───
        case 'ITEM_LOGIN_REQUIRED': {
          await base44.asServiceRole.entities.PlaidItem.update(plaidItem.id, {
            status: 'relink_needed',
            last_error_code: 'ITEM_LOGIN_REQUIRED',
            last_error_type: 'ITEM_ERROR',
            last_error_message: 'User action required to restore Item login',
            webhook_last_received: new Date().toISOString(),
            webhook_last_code: webhookCode,
          });
          console.log(`Item ${itemId} marked as relink_needed`);
          break;
        }

        // ─── Item error ───
        case 'ITEM_ERROR': {
          await base44.asServiceRole.entities.PlaidItem.update(plaidItem.id, {
            status: 'degraded',
            last_error_code: body.error?.error_code || 'ITEM_ERROR',
            last_error_type: body.error?.error_type || 'ITEM_ERROR',
            last_error_message: body.error?.error_message || 'Item error',
            webhook_last_received: new Date().toISOString(),
            webhook_last_code: webhookCode,
          });
          console.log(`Item ${itemId} marked as degraded: ${body.error?.error_code}`);
          break;
        }

        // ─── New accounts available (after update mode) ───
        case 'NEW_ACCOUNTS_AVAILABLE': {
          const accessToken = await decryptToken(plaidItem.encrypted_access_token, plaidItem.encryption_iv);
          const accountsRes = await plaidRequestWithRetry('/accounts/balance/get', { access_token: accessToken });
          const now = new Date().toISOString();
          const accounts = accountsRes.accounts.map((a: any) => ({
            account_id: a.account_id,
            name: a.name,
            official_name: a.official_name,
            type: a.type,
            subtype: a.subtype,
            mask: a.mask,
            current_balance: a.balances?.current,
            available_balance: a.balances?.available,
            currency: a.balances?.iso_currency_code,
            institution_name: plaidItem.institution_name || 'Unknown Bank',
            last_synced: now,
          }));
          const existing = await base44.asServiceRole.entities.BankAccount.filter({});
          const existingMap = new Map(existing.map((e: any) => [e.account_id, e]));
          for (const acc of accounts) {
            if (existingMap.has(acc.account_id)) {
              await base44.asServiceRole.entities.BankAccount.update(existingMap.get(acc.account_id).id, acc);
            } else {
              await base44.asServiceRole.entities.BankAccount.create(acc);
            }
          }
          await base44.asServiceRole.entities.PlaidItem.update(plaidItem.id, {
            webhook_last_received: new Date().toISOString(),
            webhook_last_code: webhookCode,
          });
          break;
        }

        default:
          console.log(`Unhandled webhook code: ${webhookCode}`);
          status = 'skipped';
      }
    } catch (err: any) {
      console.error(`Webhook processing error: ${err.message}`);
      status = 'error';
      errorMessage = err.message;
    }

    // ─── Log for audit ───
    await logWebhook(base44, webhookType, webhookCode, itemId, status, errorMessage);

    return Response.json({ success: true, status });
  } catch (error: any) {
    console.error('Plaid webhook verification error:', error.message);
    // Log even on verification failure (without sensitive data)
    return Response.json({ error: 'Webhook verification failed' }, { status: 401 });
  }
});

async function logWebhook(base44: any, type: string, code: string, itemId: string, status: string, errorMessage: string | null) {
  try {
    const payloadHash = `${type}_${code}_${itemId}_${Date.now().toString(36)}`;
    await base44.asServiceRole.entities.PlaidWebhookLog.create({
      webhook_type: type,
      webhook_code: code,
      item_id: itemId,
      processed_at: new Date().toISOString(),
      status,
      error_message: errorMessage,
      payload_hash: payloadHash,
    });
  } catch (err) {
    console.error('Failed to log webhook:', err.message);
  }
}