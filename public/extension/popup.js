// Nudigo Extension Popup Logic

const NUDIGO_URL = 'https://nudigofinance.base44.app';
const API_BASE = 'https://base44.app';

const app = document.getElementById('app');

let state = {
  token: null,
  appId: null,
  blocklist: [],
  settings: {},
  profile: null,
  connected: false
};

// ─── Init ───
chrome.storage.local.get(['token', 'appId', 'blocklist', 'settings', 'profile', 'connected'], (result) => {
  state = { ...state, ...result };
  render();
  // If connected, refresh data from backend on popup open
  if (state.token) {
    refreshBlocklist();
  }
});

// Listen for storage changes (blocklist sync)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.token) { state.token = changes.token.newValue; }
  if (changes.appId) { state.appId = changes.appId.newValue; }
  if (changes.blocklist) state.blocklist = changes.blocklist.newValue || [];
  if (changes.settings) state.settings = changes.settings.newValue || {};
  if (changes.profile) state.profile = changes.profile.newValue;
  if (changes.connected) state.connected = changes.connected.newValue;
  render();
});

// ─── API Call ───
async function apiCall(action, data = {}) {
  const { token, appId } = state;
  if (!token || !appId) throw new Error('Not connected');

  const response = await fetch(`${API_BASE}/apps/${appId}/functions/extension-api`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, ...data })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Error: ${response.status}`);
  }

  return response.json();
}

// ─── Render ───
function render() {
  if (!state.token) {
    renderNotConnected();
    return;
  }
  renderConnected();
}

function renderNotConnected() {
  app.innerHTML = `
    <div class="not-connected">
      <div class="not-connected-icon">🛡️</div>
      <h3>Connect to Nudigo</h3>
      <p>Sign in to your Nudigo account to sync your blocklist and get AI spending guidance.</p>
      <button class="btn btn-primary" id="connectBtn">Connect to Nudigo</button>
    </div>
  `;
  document.getElementById('connectBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: NUDIGO_URL });
  });
}

function renderConnected() {
  const profile = state.profile || {};
  const blocklist = state.blocklist || [];

  app.innerHTML = `
    <div class="header">
      <div class="header-logo">🛡️</div>
      <div>
        <div class="header-title">Nudigo Shield</div>
        <div class="header-sub">${profile.first_name ? 'Hi, ' + profile.first_name : 'Connected'}</div>
      </div>
      <div class="status-dot connected" title="Connected"></div>
    </div>

    <!-- Financial Summary -->
    ${renderSummary(profile)}

    <!-- AI Assistant -->
    <div class="section">
      <div class="section-title">AI Assistant</div>
      <div class="ai-box">
        <textarea class="input" id="aiInput" rows="2" placeholder="Can I afford this? Should I buy this?"></textarea>
        <label class="check-row">
          <input type="checkbox" id="screenshotToggle">
          📸 Analyze current page (screenshot)
        </label>
        <button class="btn btn-primary" id="aiBtn" style="margin-top:8px;">Ask Nudigo</button>
        <div id="aiResult"></div>
      </div>
    </div>

    <!-- Blocklist -->
    <div class="section">
      <div class="section-title">Blocked Sites (${blocklist.length})</div>
      <div class="add-form" id="addForm" style="display:none;">
        <input class="input" id="customName" placeholder="Site name (e.g. Amazon)">
        <input class="input" id="customUrl" placeholder="Domain (e.g. amazon.com)">
        <div class="gate-toggle" style="margin-bottom:6px;">
          <button class="gate-btn active" data-mode="block">Block</button>
          <button class="gate-btn" data-mode="intercept">Ask Questions</button>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary" id="cancelAddBtn">Cancel</button>
          <button class="btn btn-primary" id="addBlockBtn">Add</button>
        </div>
      </div>
      <button class="btn btn-secondary" id="showAddBtn" style="margin-bottom:10px;">+ Add Custom Site</button>
      <div id="blocklistContainer">
        ${blocklist.length > 0 ? blocklist.map(renderBlockItem).join('') : '<div class="empty">No blocked sites yet.</div>'}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <button class="btn btn-secondary" id="openNudigoBtn">Open Nudigo</button>
      <button class="btn btn-secondary" id="optionsBtn">Settings</button>
    </div>
  `;

  attachEventListeners();
}

function renderSummary(profile) {
  const income = profile?.monthly_income || 0;
  const balance = profile?.balance || 0;
  const spent = profile?.total_spent || 0;

  if (!income) return '';

  return `
    <div class="section">
      <div class="section-title">Your Finances</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Balance</div>
          <div class="summary-value ${balance >= 0 ? 'positive' : 'negative'}">$${balance.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Spent</div>
          <div class="summary-value">$${spent.toLocaleString()}</div>
        </div>
      </div>
    </div>
  `;
}

function renderBlockItem(app) {
  const gateMode = app.gate_mode || 'block';
  return `
    <div class="block-item">
      <div class="block-icon">${app.app_type === 'app' ? '📱' : '🌐'}</div>
      <div style="flex:1;min-width:0;">
        <div class="block-name">${escapeHtml(app.app_name)}</div>
        <div class="block-url">${escapeHtml(app.block_url)}</div>
      </div>
      <div class="block-actions">
        <div class="gate-toggle">
          <button class="gate-btn ${gateMode === 'block' ? 'active' : ''}" data-action="gate" data-id="${app.id}" data-mode="block">Block</button>
          <button class="gate-btn ${gateMode === 'intercept' ? 'active' : ''}" data-action="gate" data-id="${app.id}" data-mode="intercept">Ask</button>
        </div>
        <button class="btn btn-danger btn-sm" data-action="remove" data-id="${app.id}">✕</button>
      </div>
    </div>
  `;
}

function attachEventListeners() {
  // Open Nudigo
  document.getElementById('openNudigoBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: NUDIGO_URL });
  });

  // Options
  document.getElementById('optionsBtn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Add custom form
  document.getElementById('showAddBtn')?.addEventListener('click', () => {
    document.getElementById('addForm').style.display = 'flex';
    document.getElementById('showAddBtn').style.display = 'none';
  });

  document.getElementById('cancelAddBtn')?.addEventListener('click', () => {
    document.getElementById('addForm').style.display = 'none';
    document.getElementById('showAddBtn').style.display = 'block';
  });

  // Gate mode toggle in add form
  document.querySelectorAll('#addForm .gate-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#addForm .gate-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  // Add block
  document.getElementById('addBlockBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('customName').value.trim();
    const url = document.getElementById('customUrl').value.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const mode = document.querySelector('#addForm .gate-btn.active')?.dataset.mode || 'block';

    if (!name || !url) return;

    try {
      await apiCall('add_block', { app_name: name, block_url: url, gate_mode: mode });
      await refreshBlocklist();
      document.getElementById('customName').value = '';
      document.getElementById('customUrl').value = '';
      document.getElementById('addForm').style.display = 'none';
      document.getElementById('showAddBtn').style.display = 'block';
    } catch (err) {
      alert('Failed to add: ' + err.message);
    }
  });

  // Block item actions (event delegation)
  document.getElementById('blocklistContainer')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id, mode } = btn.dataset;

    if (action === 'gate') {
      try {
        await apiCall('update_block', { block_id: id, gate_mode: mode });
        await refreshBlocklist();
      } catch (err) {
        alert('Failed to update: ' + err.message);
      }
    } else if (action === 'remove') {
      try {
        await apiCall('remove_block', { block_id: id });
        await refreshBlocklist();
      } catch (err) {
        alert('Failed to remove: ' + err.message);
      }
    }
  });

  // AI Assistant
  document.getElementById('aiBtn')?.addEventListener('click', handleAiQuery);
}

async function handleAiQuery() {
  const input = document.getElementById('aiInput');
  const resultDiv = document.getElementById('aiResult');
  const screenshotToggle = document.getElementById('screenshotToggle');
  const btn = document.getElementById('aiBtn');

  const question = input.value.trim();
  if (!question) return;

  btn.disabled = true;
  resultDiv.innerHTML = '<div class="ai-loading"><div class="spinner"></div> Analyzing...</div>';

  try {
    let screenshot = null;
    if (screenshotToggle.checked) {
      // Request screenshot from background
      screenshot = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (response) => {
          resolve(response?.success ? response.dataUrl : null);
        });
      });
    }

    const response = await apiCall('ai_query', { question, screenshot });
    resultDiv.innerHTML = `<div class="ai-response">${escapeHtml(response.response)}</div>`;
  } catch (err) {
    resultDiv.innerHTML = `<div class="ai-response" style="color:var(--danger);">Error: ${escapeHtml(err.message)}</div>`;
  }

  btn.disabled = false;
}

async function refreshBlocklist() {
  try {
    const data = await apiCall('get_data');
    state.blocklist = data.blocklist || [];
    state.profile = data.profile || null;
    state.settings = data.settings || {};
    chrome.storage.local.set({ blocklist: state.blocklist, profile: state.profile, settings: state.settings });
    render();
  } catch (err) {
    // Token might be expired
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
