const input = document.getElementById('name');
const suffixInput = document.getElementById('suffix');
const responsiveCheckbox = document.getElementById('responsive');

// Load saved name, suffix, and responsive state
chrome.storage.local.get(['lastName', 'lastSuffix', 'lastResponsive'], (res) => {
  if (res.lastName) {
    input.value = res.lastName;
  }
  if (res.lastSuffix) {
    suffixInput.value = res.lastSuffix;
  }
  if (res.lastResponsive) {
    responsiveCheckbox.checked = true;
  }
  input.focus();
});

// Handle start
async function start() {
  const name = input.value;
  if (!name) {
    alert('Enter a name');
    return;
  }

  const suffix = suffixInput.value.trim();
  const responsive = responsiveCheckbox.checked;

  chrome.storage.local.set({ lastName: name, lastSuffix: suffix, lastResponsive: responsive });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const sendCapture = () => chrome.tabs.sendMessage(tab.id, {
    action: 'startCapture',
    name,
    suffix,
    responsive
  });

  try {
    await sendCapture();
  } catch (e) {
    // Content script not yet injected (e.g. tab existed before extension load).
    // Inject it, wait for it to register its listener, then retry.
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await new Promise(r => setTimeout(r, 200));
    await sendCapture();
  }
}

document.getElementById('start').addEventListener('click', start);

// Enter key support
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    start();
  }
});

suffixInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    start();
  }
});