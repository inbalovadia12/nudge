// Nudigo Chrome Extension — Background Service Worker

const NUDIGO_URL = 'https://nudigofinance.base44.app';
const API_BASE = 'https://base44.app';
const SYNC_ALARM = 'nudigo-sync';

// ─── Install / Startup ───
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ blocklist: [], settings: { defaultGateMode: 'block' } });
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 5 });
  syncBlocklist();
});

chrome.runtime.onStartup.addListener(() => {
  syncBlocklist();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM) syncBlocklist();
});

// ─── Token Capture from Content Script ───
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_TOKEN') {
    chrome.storage.local.set({
      token: message.token,
      appId: message.appId
    });
    sendResponse({ success: true });
    syncBlocklist();
    return true;
  }

  if (message.type === 'API_CALL') {
    handleApiCall(message.action, message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }

  if (message.type === 'OPEN_NUDIGO') {
    chrome.tabs.create({ url: NUDIGO_URL });
    sendResponse({ success: true });
    return true;
  }
});

// ─── Config Helper ───
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token', 'appId'], (result) => {
      resolve(result);
    });
  });
}

// ─── API Call to Nudigo Backend ───
async function handleApiCall(action, data) {
  const { token, appId } = await getConfig();
  if (!token || !appId) throw new Error('Not connected to Nudigo');

  const response = await fetch(`${API_BASE}/apps/${appId}/functions/extension-api`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, ...data })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ─── Blocklist Sync ───
async function syncBlocklist() {
  const { token, appId } = await getConfig();
  if (!token || !appId) return;

  try {
    const response = await fetch(`${API_BASE}/apps/${appId}/functions/extension-api`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'get_data' })
    });

    if (!response.ok) return;
    const data = await response.json();

    chrome.storage.local.set({
      blocklist: data.blocklist || [],
      settings: data.settings || { defaultGateMode: 'block' },
      profile: data.profile || null,
      connected: true
    });
  } catch (err) {
    // Silently fail — will retry on next alarm
  }
}

// ─── URL Monitoring & Blocking ───
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url) {
    await checkAndBlockUrl(tabId, changeInfo.url);
  }
});

async function checkAndBlockUrl(tabId, url) {
  // Skip extension pages and chrome pages
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

  const { blocklist, token, appId } = await new Promise((resolve) => {
    chrome.storage.local.get(['blocklist', 'token', 'appId'], resolve);
  });

  if (!blocklist || blocklist.length === 0) return;

  const hostname = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  const matched = blocklist.find(app => {
    const blockUrl = (app.block_url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!blockUrl) return false;
    return hostname === blockUrl || hostname.endsWith('.' + blockUrl);
  });

  if (!matched) return;

  // Redirect to block or intervention page
  const params = new URLSearchParams({
    url: url,
    appName: matched.app_name || '',
    blockUrl: matched.block_url || '',
    appId: matched.id || '',
    gateMode: matched.gate_mode || 'block'
  });

  const page = matched.gate_mode === 'intercept' ? 'intervention.html' : 'block.html';
  chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL(`${page}?${params.toString()}`)
  });
}
