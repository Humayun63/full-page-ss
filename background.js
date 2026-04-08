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
      'lastIncludeTime', 'lastIncludeDevice', 'lastCustomName',
      'lastFormat', 'lastQuality', 'lastDelay', 'lastAction'
    ], async (res) => {
      const responsive  = res.lastResponsive || false;
      const breakpoints = res.lastBreakpoints || null;
      const action      = res.lastAction || 'download';

      const namingConfig = {
        enabled: res.lastNamingEnabled || false,
        includeDomain: res.lastIncludeDomain !== undefined ? res.lastIncludeDomain : true,
        includeTitle: res.lastIncludeTitle !== undefined ? res.lastIncludeTitle : true,
        includeTime: res.lastIncludeTime !== undefined ? res.lastIncludeTime : true,
        includeDevice: res.lastIncludeDevice || false,
        customName: res.lastCustomName || '',
      };

      const formatConfig = {
        format: res.lastFormat || 'png',
        quality: res.lastQuality || 92,
        outputAction: action,
      };

      const delay = res.lastDelay || 0;

      // Send capture request
      chrome.tabs.sendMessage(tab.id, {
        action: 'startCapture',
        responsive,
        breakpoints,
        namingConfig,
        formatConfig,
        delay,
      }, async (response) => {
        if (!response || !response.success) {
          console.error('Capture failed:', response?.error);
          return;
        }
        
        // Process results
        const results = response.results || [];
        
        for (const result of results) {
          const { dataUrl, filename, mimeType } = result;
          
          // Handle download
          if (action === 'download' || action === 'both') {
            chrome.downloads.download({
              url: dataUrl,
              filename: filename,
              saveAs: false
            });
          }
          
          // Handle clipboard - use content script context for keyboard shortcuts
          if (action === 'clipboard' || action === 'both') {
            chrome.tabs.sendMessage(tab.id, {
              action: 'copyToClipboard',
              dataUrl: dataUrl,
              mimeType: mimeType
            });
          }
          
          // Save to history
          chrome.storage.local.get(['screenshotHistory'], (histRes) => {
            let history = histRes.screenshotHistory || [];
            history.unshift({
              filename: filename,
              url: tab.url,
              timestamp: Date.now()
            });
            if (history.length > 50) history = history.slice(0, 50);
            chrome.storage.local.set({ screenshotHistory: history });
          });
        }
      });
    });
  }
});