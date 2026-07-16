// Intervention page — shows questions before allowing access to a blocked site

const NUDIGO_URL = 'https://nudigofinance.base44.app';
const params = new URLSearchParams(window.location.search);
const blockedUrl = params.get('url') || '';
const appName = params.get('appName') || 'this site';

const questions = [
  { id: 'need', text: "What's driving you to open this right now?", answers: [
    { label: 'I genuinely need to buy something specific', value: 0 },
    { label: "I'm browsing to kill time", value: 3 },
    { label: "I'm stressed, bored, or emotional", value: 3 },
    { label: 'I saw an ad or got a notification', value: 2 },
  ]},
  { id: 'timing', text: 'Have you thought about this purchase for more than 10 minutes today?', answers: [
    { label: "Yes, I've been planning this for a while", value: 0 },
    { label: 'I thought about it earlier today', value: 1 },
    { label: 'It just popped into my head', value: 3 },
    { label: "I'm not even sure what I want to buy", value: 3 },
  ]},
  { id: 'goal', text: "How does this fit with what you're saving for?", answers: [
    { label: "It doesn't affect my savings goal", value: 0 },
    { label: "It's a small dent, I can recover", value: 1 },
    { label: 'It pushes my goal back a bit', value: 2 },
    { label: "I don't have a savings goal", value: 2 },
  ]},
  { id: 'alternatives', text: 'Have you checked if you already own something that does the job?', answers: [
    { label: "Yes, and I don't have anything like this", value: 0 },
    { label: "I think I might, but haven't looked", value: 2 },
    { label: 'Probably, but I want the new one', value: 3 },
    { label: "No, and I don't care to check", value: 3 },
  ]},
  { id: 'trigger', text: 'Be honest — is something else going on right now?', answers: [
    { label: 'Nothing, just a normal day', value: 0 },
    { label: "I'm a little restless", value: 1 },
    { label: "I'm stressed or anxious", value: 3 },
    { label: "I'm rewarding myself for a bad day", value: 3 },
  ]},
  { id: 'regret', text: 'Think about a purchase you regretted recently. How is this different?', answers: [
    { label: "This is different — I've done my homework", value: 0 },
    { label: "It's similar, but I think this one's worth it", value: 1 },
    { label: 'Honestly, it feels the same', value: 3 },
    { label: "I don't have any recent regrets", value: 1 },
  ]},
  { id: 'future', text: 'Fast forward 30 days. How will you feel about opening this today?', answers: [
    { label: 'Glad I did it — it was worth it', value: 0 },
    { label: 'Neutral, it was just a normal purchase', value: 1 },
    { label: "I'll probably have forgotten about it", value: 2 },
    { label: "I can already feel the regret coming", value: 3 },
  ]},
];

function getResult(totalScore, maxScore) {
  const pct = totalScore / maxScore;
  if (pct <= 0.15) return { tier: 'green', icon: '✅', title: "You've thought this through", message: 'Your answers show intention and awareness. This looks like a mindful choice — go ahead if it feels right.', primaryAction: 'proceed', primaryLabel: 'Proceed to site' };
  if (pct <= 0.35) return { tier: 'lime', icon: '✅', title: 'Looks reasonable — just stay aware', message: "Nothing alarming, but a couple of your answers suggest you're not fully certain. If you proceed, set a spending limit before you start browsing.", primaryAction: 'proceed', primaryLabel: 'Proceed with a spending limit' };
  if (pct <= 0.55) return { tier: 'amber', icon: '⏰', title: 'Sleep on it', message: "A few of your answers hint that this might be impulse-driven. Give it 24 hours — if you still want it tomorrow, it's probably a real need, not a moment.", primaryAction: 'back', primaryLabel: 'Set a 24-hour reminder', secondaryAction: 'proceed', secondaryLabel: "I'll proceed anyway" };
  if (pct <= 0.75) return { tier: 'orange', icon: '🧠', title: 'This feels emotional', message: 'Your answers suggest something deeper is driving this — stress, boredom, or a need for a reward. Those are the moments spending tends to sting later. Take a walk, text a friend, then revisit.', primaryAction: 'back', primaryLabel: 'Not right now', secondaryAction: 'proceed', secondaryLabel: 'I understand, let me through' };
  return { tier: 'red', icon: '🛡️', title: 'Your future self is asking you to stop', message: "Almost every answer points to this being an impulse purchase you're likely to regret. The strongest move you can make right now is closing this and doing something else. Seriously.", primaryAction: 'back', primaryLabel: 'Close and walk away', secondaryAction: 'proceed', secondaryLabel: 'I insist on proceeding' };
}

const app = document.getElementById('app');
let currentQ = 0;
let answers = [];

render();

function render() {
  if (currentQ < questions.length) {
    renderQuestion();
  } else {
    renderResult();
  }
}

function renderQuestion() {
  const q = questions[currentQ];
  const progress = questions.map((_, i) => `<div class="progress-bar ${i <= currentQ ? 'active' : ''}"></div>`).join('');

  app.innerHTML = `
    <div class="container">
      <div class="header">
        <div class="shield-icon">🛡️</div>
        <div class="header-text">
          <div class="header-label">Shopping Shield</div>
          <div class="header-title">Opening ${escapeHtml(appName)}</div>
        </div>
      </div>
      <div class="progress">${progress}</div>
      <div class="question-num">Question ${currentQ + 1} of ${questions.length}</div>
      <h2>${q.text}</h2>
      <div class="answers">
        ${q.answers.map((a, i) => `<button class="answer-btn" data-value="${a.value}">${a.label}</button>`).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      answers.push(parseInt(btn.dataset.value));
      currentQ++;
      render();
    });
  });
}

function renderResult() {
  const totalScore = answers.reduce((s, a) => s + a, 0);
  const maxScore = questions.length * 3;
  const result = getResult(totalScore, maxScore);

  app.innerHTML = `
    <div class="container result">
      <div class="result-icon tier-${result.tier}">${result.icon}</div>
      <h2>${result.title}</h2>
      <p class="result-message">${result.message}</p>
      <div class="actions">
        ${result.primaryAction === 'proceed'
          ? `<button class="btn btn-primary" id="proceedBtn">${result.primaryLabel}</button>
             <button class="btn btn-text" id="backBtn">Maybe not</button>`
          : `<button class="btn btn-primary" id="backBtn">${result.primaryLabel}</button>
             ${result.secondaryAction === 'proceed' ? `<button class="btn btn-text" id="proceedBtn">${result.secondaryLabel}</button>` : ''}`
        }
      </div>
      <button class="btn btn-link" id="nudigoBtn">Open Nudigo</button>
    </div>
  `;

  document.getElementById('proceedBtn')?.addEventListener('click', () => {
    window.location.href = blockedUrl;
  });
  document.getElementById('backBtn')?.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else chrome.tabs.update({ url: 'chrome://newtab' });
  });
  document.getElementById('nudigoBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: NUDIGO_URL });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
