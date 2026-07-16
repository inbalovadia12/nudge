// Options / Settings page

const NUDIGO_URL = 'https://nudigofinance.base44.app';

let settings = { defaultGateMode: 'block' };

chrome.storage.local.get(['settings', 'token', 'connected'], (result) => {
  settings = { ...settings, ...(result.settings || {}) };
  render(result);
});

function render(state) {
  const connected = !!state.token;

  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="header">
        <div class="logo">🛡️</div>
        <div>
          <h1>Nudigo Shield Settings</h1>
          <p class="version">Version 2.0.0</p>
        </div>
      </div>

      <!-- Connection Status -->
      <div class="section">
        <div class="section-title">Connection</div>
        <div class="card ${connected ? 'connected' : 'disconnected'}">
          <div class="status-row">
            <div class="status-dot ${connected ? 'connected' : 'disconnected'}"></div>
            <div>
              <div class="status-label">${connected ? 'Connected to Nudigo' : 'Not Connected'}</div>
              <div class="status-sub">${connected ? 'Your blocklist syncs automatically.' : 'Sign in to sync your data.'}</div>
            </div>
          </div>
          ${connected
            ? '<button class="btn btn-secondary" id="syncBtn">Sync Now</button>'
            : '<button class="btn btn-primary" id="connectBtn">Connect to Nudigo</button>'
          }
        </div>
      </div>

      <!-- Default Gate Mode -->
      <div class="section">
        <div class="section-title">Default Blocking Mode</div>
        <p class="section-desc">When you add a new site to block, which mode should it use?</p>
        <div class="gate-options">
          <button class="gate-option ${settings.defaultGateMode === 'block' ? 'active' : ''}" data-mode="block">
            <div class="gate-icon">🔒</div>
            <div class="gate-name">Block</div>
            <div class="gate-desc">Fully blocked — can't access the site</div>
          </button>
          <button class="gate-option ${settings.defaultGateMode === 'intercept' ? 'active' : ''}" data-mode="intercept">
            <div class="gate-icon">❓</div>
            <div class="gate-name">Ask Questions</div>
            <div class="gate-desc">Show intervention questions first</div>
          </button>
        </div>
      </div>

      <!-- Apple Screen Time -->
      <div class="section">
        <div class="section-title">Device Integration</div>
        <div class="card under-construction">
          <div class="status-row">
            <div class="uc-icon">🍎</div>
            <div style="flex:1;">
              <div class="status-label">Connect Apple Screen Time</div>
              <div class="status-sub">Sync your blocklist with iOS Screen Time restrictions.</div>
            </div>
            <span class="uc-badge">Coming Soon</span>
          </div>
          <div class="uc-message">
            <div class="uc-construction-icon">🚧</div>
            <p>This feature is under construction. We're working on a seamless integration with Apple's Screen Time API to sync your Nudigo blocklist across all your Apple devices.</p>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="section">
        <div class="section-title">About</div>
        <div class="card">
          <p class="about-text">Nudigo Shopping Shield helps you make mindful spending decisions by blocking shopping sites, asking intervention questions, and providing AI-powered financial guidance — all connected to your Nudigo account.</p>
          <button class="btn btn-link" id="openNudigoBtn">Open Nudigo Web App →</button>
        </div>
      </div>
    </div>
  `;

  attachListeners();
}

function attachListeners() {
  document.getElementById('connectBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: NUDIGO_URL });
  });

  document.getElementById('syncBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('syncBtn');
    btn.textContent = 'Syncing...';
    btn.disabled = true;
    chrome.runtime.sendMessage({ type: 'API_CALL', action: 'get_data', data: {} }, (response) => {
      if (response?.success) {
        chrome.storage.local.set({
          blocklist: response.data.blocklist || [],
          profile: response.data.profile || null,
          settings: response.data.settings || {},
          connected: true
        });
        btn.textContent = 'Synced!';
        setTimeout(() => { btn.textContent = 'Sync Now'; btn.disabled = false; }, 2000);
      } else {
        btn.textContent = 'Failed';
        setTimeout(() => { btn.textContent = 'Sync Now'; btn.disabled = false; }, 2000);
      }
    });
  });

  document.querySelectorAll('.gate-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gate-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      settings.defaultGateMode = btn.dataset.mode;
      chrome.storage.local.set({ settings });
    });
  });

  document.getElementById('openNudigoBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: NUDIGO_URL });
  });
}
