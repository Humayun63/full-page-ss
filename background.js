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

    chrome.storage.local.get([
      'lastResponsive', 'lastBreakpoints',
      'lastNamingEnabled', 'lastIncludeDomain', 'lastIncludeTitle', 
      'lastIncludeTime', 'lastIncludeDevice', 'lastCustomName'
    ], (res) => {
      const responsive  = res.lastResponsive || false;
      const breakpoints = res.lastBreakpoints || null;

      const namingConfig = {
        enabled: res.lastNamingEnabled || false,
        includeDomain: res.lastIncludeDomain !== undefined ? res.lastIncludeDomain : true,
        includeTitle: res.lastIncludeTitle !== undefined ? res.lastIncludeTitle : true,
        includeTime: res.lastIncludeTime !== undefined ? res.lastIncludeTime : true,
        includeDevice: res.lastIncludeDevice || false,
        customName: res.lastCustomName || '',
      };

      chrome.tabs.sendMessage(tab.id, {
        action: 'startCapture',
        responsive,
        breakpoints,
        namingConfig,
      });
    });
  }
});