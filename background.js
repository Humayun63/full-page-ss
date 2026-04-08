chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'capture') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }).then(image => {
      sendResponse(image);
    });
    return true; // keep channel open for async sendResponse
  }

  if (msg.action === 'download') {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename,
      saveAs: false
    });
  }

  if (msg.action === 'resizeWindow') {
    const windowId = sender.tab.windowId;
    chrome.windows.update(windowId, { width: msg.width }, () => {
      sendResponse({ done: true });
    });
    return true; // keep channel open for async sendResponse
  }
});

// Hotkey trigger
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'start-capture') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.storage.local.get(['lastName', 'lastSuffix', 'lastResponsive'], (res) => {
      const name = res.lastName || 'screenshot';
      const suffix = res.lastSuffix || '';
      const responsive = res.lastResponsive || false;

      chrome.tabs.sendMessage(tab.id, {
        action: 'startCapture',
        name,
        suffix,
        responsive
      });
    });
  }
});