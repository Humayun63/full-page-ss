async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function captureVisible() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'capture' }, resolve);
  });
}

function showNotification(message, isError = false) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${isError ? '#f44336' : '#4CAF50'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s ease-out';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 300);
  }, 3000);
}

function generateFilename(device, namingConfig, formatConfig) {
  // Extract page info
  const pageTitle = document.title || 'untitled';
  const domain = window.location.hostname || 'localhost';
  
  // Get current date/time
  const now = new Date();
  const time = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS

  // Build filename parts based on config
  const parts = [];
  
  // If custom name is provided, use it first
  if (namingConfig && namingConfig.customName) {
    parts.push(namingConfig.customName);
  }
  
  // Add components based on checkboxes (or defaults)
  if (!namingConfig || !namingConfig.enabled) {
    // Default behavior: domain-title-time (always)
    // Add device only if we're in responsive mode (device is non-standard)
    parts.push(domain, pageTitle, time);
    if (device) {
      parts.push(device);
    }
  } else {
    // Advanced naming is enabled - use checkboxes
    if (namingConfig.includeDomain) parts.push(domain);
    if (namingConfig.includeTitle) parts.push(pageTitle);
    if (namingConfig.includeTime) parts.push(time);
    if (namingConfig.includeDevice && device) parts.push(device);
  }

  // Build filename
  let filename = parts
    .filter(part => part && part.trim() !== '')
    .join('-');

  // Clean up special characters and spaces
  filename = filename
    .replace(/[^a-zA-Z0-9\-_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Fallback if filename is empty
  if (!filename) {
    filename = 'screenshot-' + Date.now();
  }

  // Add extension based on format
  const format = (formatConfig && formatConfig.format) || 'png';
  const extension = format === 'jpeg' ? 'jpg' : format;
  
  return filename + '.' + extension;
}

function saveToHistory(filename) {
  const historyItem = {
    filename: filename,
    url: window.location.href,
    timestamp: Date.now(),
  };

  chrome.storage.local.get(['screenshotHistory'], (res) => {
    const history = res.screenshotHistory || [];
    history.push(historyItem);
    
    // Keep only last 50 items to prevent storage bloat
    if (history.length > 50) {
      history.shift();
    }
    
    chrome.storage.local.set({ screenshotHistory: history });
  });
}

async function resizeToViewport(targetWidth) {
  await new Promise(resolve =>
    chrome.runtime.sendMessage({ action: 'resizeWindow', width: targetWidth }, resolve)
  );
  await sleep(400);
  // Compensate for browser chrome / scrollbar offset so innerWidth matches target
  const diff = targetWidth - window.innerWidth;
  if (diff !== 0) {
    await new Promise(resolve =>
      chrome.runtime.sendMessage({ action: 'resizeWindow', width: targetWidth + diff }, resolve)
    );
    await sleep(400);
  }
}

async function captureFullPage(device, namingConfig, formatConfig) {
  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    window.innerHeight
  );
  const viewportHeight = window.innerHeight;

  let scrollY = 0;
  const images = [];

  while (scrollY < totalHeight) {
    window.scrollTo(0, scrollY);
    await sleep(500);

    const img = await captureVisible();
    images.push(img);

    scrollY += viewportHeight;
  }

  window.scrollTo(0, 0);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const imgElements = await Promise.all(
    images.map(src => new Promise(res => {
      if (!src) { res(null); return; }
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    }))
  );

  const validImgs = imgElements.filter(Boolean);
  if (validImgs.length === 0) {
    console.error('Full-page capture: no valid images captured.');
    return;
  }

  canvas.width = validImgs[0].width;
  canvas.height = totalHeight;

  let y = 0;
  for (let img of validImgs) {
    ctx.drawImage(img, 0, y);
    y += img.height;
  }

  // Generate image in selected format with quality settings
  const format = (formatConfig && formatConfig.format) || 'png';
  const quality = (formatConfig && formatConfig.quality) || 92;
  
  let finalImage;
  let mimeType;
  
  if (format === 'png') {
    mimeType = 'image/png';
    finalImage = canvas.toDataURL(mimeType);
  } else if (format === 'jpeg') {
    mimeType = 'image/jpeg';
    finalImage = canvas.toDataURL(mimeType, quality / 100);
  } else if (format === 'webp') {
    mimeType = 'image/webp';
    finalImage = canvas.toDataURL(mimeType, quality / 100);
  } else {
    // Fallback to PNG
    mimeType = 'image/png';
    finalImage = canvas.toDataURL(mimeType);
  }

  const filename = generateFilename(device, namingConfig, formatConfig);

  // Return capture result to caller (popup or background)
  return {
    dataUrl: finalImage,
    filename: filename,
    mimeType: mimeType,
  };
}

async function startFullPageCapture(namingConfig, formatConfig) {
  const style = document.createElement('style');
  style.innerHTML = `
    #wpadminbar { display: none !important; }
    html { margin: 0 !important; }
  `;
  document.head.appendChild(style);

  await sleep(500);

  const width = window.innerWidth;
  let device;
  if (width > 991) {
    device = 'desktop';
  } else if (width > 575) {
    device = 'tablet';
  } else {
    device = 'mobile';
  }

  const result = await captureFullPage(device, namingConfig, formatConfig);
  return result;
}

async function startResponsiveCapture(breakpoints, namingConfig, formatConfig) {
  const style = document.createElement('style');
  style.innerHTML = `
    #wpadminbar { display: none !important; }
    html { margin: 0 !important; }
  `;
  document.head.appendChild(style);

  await sleep(500);

  const originalWidth = window.outerWidth;

  const results = [];
  
  for (const { width, label } of breakpoints) {
    await resizeToViewport(width);
    await sleep(1000);
    
    const result = await captureFullPage(label, namingConfig, formatConfig);
    results.push(result);
  }

  // Restore original window size
  chrome.runtime.sendMessage({ action: 'resizeWindow', width: originalWidth });
  
  return results;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startCapture') {
    const delay = msg.delay || 0;
    
    // Async handler function
    const handleCapture = async () => {
      try {
        // If delay is set, wait before capturing
        if (delay > 0) {
          await sleep(delay * 1000);
        }
        
        let results;
        if (msg.responsive && msg.breakpoints && msg.breakpoints.length > 0) {
          results = await startResponsiveCapture(msg.breakpoints, msg.namingConfig, msg.formatConfig);
        } else {
          const result = await startFullPageCapture(msg.namingConfig, msg.formatConfig);
          results = [result]; // Wrap single result in array for consistency
        }
        
        sendResponse({ success: true, results: results });
      } catch (error) {
        console.error('Capture failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    };
    
    handleCapture();
    return true; // Required to use sendResponse asynchronously
  }
  
  // Fallback clipboard handler (when popup context fails)
  if (msg.action === 'copyToClipboard') {
    const handleClipboardCopy = async () => {
      try {
        // Ensure document has focus
        window.focus();
        document.body.focus();
        await sleep(100);
        
        // Convert data URL to blob
        const base64Data = msg.dataUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          arrayBuffer[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([arrayBuffer], { type: msg.mimeType });
        
        // Copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ [msg.mimeType]: blob })
        ]);
        
        showNotification('✅ Screenshot copied to clipboard!');
        sendResponse({ success: true });
      } catch (err) {
        console.error('Clipboard fallback failed:', err);
        showNotification('❌ Failed to copy. Try download mode instead.', true);
        sendResponse({ success: false, error: err.message });
      }
    };
    
    handleClipboardCopy();
    return true;
  }
});
