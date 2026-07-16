// Block page — shown when a fully blocked site is visited

const NUDIGO_URL = 'https://nudigofinance.base44.app';
const API_BASE = 'https://base44.app';
const params = new URLSearchParams(window.location.search);
const blockedUrl = params.get('url') || '';
const appName = params.get('appName') || 'this site';
const blockUrl = params.get('blockUrl') || '';
const blockId = params.get('appId') || '';

const app = document.getElementById('app');
app.innerHTML = `
  <div class="container">
    <div class="shield-icon">🛡️</div>
    <h1>Blocked by Nudigo</h1>
    <p class="subtitle">You've blocked this site to protect your spending.</p>
    <div class="site-card">
      <div class="site-icon">🌐</div>
      <div class="site-info">
        <div class="site-name">${escapeHtml(appName)}</div>
        <div class="site-url">${escapeHtml(blockUrl)}</div>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" id="goBackBtn">Go Back</button>
      <button class="btn btn-secondary" id="openNudigoBtn">Open Nudigo</button>
      <button class="btn btn-danger" id="removeBtn">Remove from Blocklist</button>
    </div>
  </div>
`;

document.getElementById('goBackBtn').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else chrome.tabs.update({ url: 'chrome://newtab' });
});

document.getElementById('openNudigoBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: NUDIGO_URL });
});

document.getElementById('removeBtn').addEventListener('click', async () => {
  const btn = document.getElementById('removeBtn');
  btn.textContent = 'Removing...';
  btn.disabled = true;

  try {
    const { token, appId } = await chrome.storage.local.get(['token', 'appId']);
    const response = await fetch(`${API_BASE}/apps/${appId}/functions/extension-api`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_block', block_id: blockId })
    });

    if (response.ok) {
      // Navigate to the originally blocked URL
      window.location.href = blockedUrl;
    } else {
      btn.textContent = 'Failed — try again';
      btn.disabled = false;
    }
  } catch (err) {
    btn.textContent = 'Failed — try again';
    btn.disabled = false;
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
