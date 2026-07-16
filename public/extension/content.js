// Content script — runs on nudigofinance.base44.app
// Captures the auth token and appId from localStorage and sends to background

function captureAndSend() {
  const token = localStorage.getItem('base44_access_token');
  const appId = localStorage.getItem('base44_app_id');

  if (token && appId) {
    chrome.runtime.sendMessage({ type: 'AUTH_TOKEN', token, appId }, () => {
      if (chrome.runtime.lastError) {
        // Background might not be ready yet — retry
        setTimeout(captureAndSend, 2000);
      }
    });
  }
}

// Capture on load
captureAndSend();

// Poll for changes (handles login/logout)
setInterval(captureAndSend, 3000);
