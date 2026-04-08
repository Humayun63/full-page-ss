async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function captureVisible() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'capture' }, resolve);
  });
}

function generateFilename(device, namingConfig) {
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

  return filename + '.png';
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

async function captureFullPage(device, namingConfig) {
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

  const finalImage = canvas.toDataURL('image/png');
  const filename = generateFilename(device, namingConfig);

  chrome.runtime.sendMessage({
    action: 'download',
    url: finalImage,
    filename: filename
  });

  // Save to history
  saveToHistory(filename);
}

async function startFullPageCapture(namingConfig) {
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

  await captureFullPage(device, namingConfig);
}

async function startResponsiveCapture(breakpoints, namingConfig) {
  const style = document.createElement('style');
  style.innerHTML = `
    #wpadminbar { display: none !important; }
    html { margin: 0 !important; }
  `;
  document.head.appendChild(style);

  await sleep(500);

  const originalWidth = window.outerWidth;

  for (const { width, label } of breakpoints) {
    await resizeToViewport(width);
    await captureFullPage(label, namingConfig);
  }

  // Restore original window size
  chrome.runtime.sendMessage({ action: 'resizeWindow', width: originalWidth });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'startCapture') {
    if (msg.responsive && msg.breakpoints && msg.breakpoints.length > 0) {
      startResponsiveCapture(msg.breakpoints, msg.namingConfig);
    } else {
      startFullPageCapture(msg.namingConfig);
    }
  }
});
