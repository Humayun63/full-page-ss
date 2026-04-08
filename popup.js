const namingToggle      = document.getElementById('naming-toggle');
const namingPanel       = document.getElementById('naming-panel');
const includeDomain     = document.getElementById('include-domain');
const includeTitle      = document.getElementById('include-title');
const includeTime       = document.getElementById('include-time');
const includeDevice     = document.getElementById('include-device');
const customNameInput   = document.getElementById('custom-name');
const formatPng         = document.getElementById('format-png');
const formatJpeg        = document.getElementById('format-jpeg');
const formatWebp        = document.getElementById('format-webp');
const qualityControl    = document.getElementById('quality-control');
const qualitySlider     = document.getElementById('quality-slider');
const qualityValue      = document.getElementById('quality-value');
const delayToggle       = document.getElementById('delay-toggle');
const delayPanel        = document.getElementById('delay-panel');
const customDelayInput  = document.getElementById('custom-delay-input');
const responsiveToggle  = document.getElementById('responsive-toggle');
const devicePanel       = document.getElementById('device-panel');
const deviceList        = document.getElementById('device-list');
const customRowsEl      = document.getElementById('custom-rows');
const historyToggle     = document.getElementById('history-toggle');
const historyPanel      = document.getElementById('history-panel');
const historyList       = document.getElementById('history-list');
const clearHistoryBtn   = document.getElementById('clear-history');
const statusIndicator   = document.getElementById('status-indicator');
const statusText        = document.getElementById('status-text');
const startButton       = document.getElementById('start');

// ── Predefined devices ────────────────────────────────────────────────────────
const PREDEFINED_DEVICES = [
  { label: 'desktop',  name: 'Desktop',  width: 1920, defaultChecked: true  },
  { label: 'laptop',   name: 'Laptop',   width: 1440, defaultChecked: false },
  { label: 'tablet-l', name: 'Tablet L', width: 1024, defaultChecked: false },
  { label: 'tablet',   name: 'Tablet',   width: 991,  defaultChecked: true  },
  { label: 'mobile-l', name: 'Mobile L', width: 768,  defaultChecked: false },
  { label: 'mobile',   name: 'Mobile',   width: 575,  defaultChecked: true  },
  { label: 'mobile-s', name: 'Mobile S', width: 375,  defaultChecked: false },
];

const ROW_STYLE  = 'display:flex; align-items:center; gap:4px; padding:2px 0;';
const NAME_STYLE = 'flex:1; font-size:11px;';
const NUM_STYLE  = 'width:46px; font-size:11px; text-align:right; padding:1px 3px; box-sizing:border-box;';

// Build predefined rows
PREDEFINED_DEVICES.forEach(device => {
  const row = document.createElement('div');
  row.style.cssText = ROW_STYLE;

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.dataset.label = device.label;
  cb.checked = device.defaultChecked;

  const nameSpan = document.createElement('span');
  nameSpan.textContent = device.name;
  nameSpan.style.cssText = NAME_STYLE;

  const wi = document.createElement('input');
  wi.type = 'number';
  wi.min = '100';
  wi.max = '7680';
  wi.value = device.width;
  wi.dataset.label = device.label;
  wi.style.cssText = NUM_STYLE;

  row.appendChild(cb);
  row.appendChild(nameSpan);
  row.appendChild(wi);
  deviceList.appendChild(row);
});

// ── Custom rows ───────────────────────────────────────────────────────────────
let customCount = 0;

function addCustomRow(width = '') {
  customCount++;
  const row = document.createElement('div');
  row.style.cssText = ROW_STYLE;

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = true;
  cb.dataset.custom = 'true';

  const nameSpan = document.createElement('span');
  nameSpan.textContent = 'Custom';
  nameSpan.style.cssText = NAME_STYLE;

  const wi = document.createElement('input');
  wi.type = 'number';
  wi.min = '100';
  wi.max = '7680';
  wi.placeholder = 'px';
  if (width) wi.value = width;
  wi.dataset.custom = 'true';
  wi.style.cssText = NUM_STYLE;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '×';
  removeBtn.style.cssText = 'border:none; background:none; cursor:pointer; color:#999; font-size:14px; padding:0 2px; line-height:1;';
  removeBtn.addEventListener('click', () => row.remove());

  row.appendChild(cb);
  row.appendChild(nameSpan);
  row.appendChild(wi);
  row.appendChild(removeBtn);
  customRowsEl.appendChild(row);
}

document.getElementById('add-custom').addEventListener('click', () => addCustomRow());

// Toggle panel visibility
namingToggle.addEventListener('change', () => {
  namingPanel.style.display = namingToggle.checked ? 'block' : 'none';
});

delayToggle.addEventListener('change', () => {
  delayPanel.style.display = delayToggle.checked ? 'block' : 'none';
});

historyToggle.addEventListener('change', () => {
  historyPanel.style.display = historyToggle.checked ? 'block' : 'none';
  if (historyToggle.checked) {
    loadHistory();
  }
});

// Format selection handlers
function updateQualityVisibility() {
  const format = document.querySelector('input[name="format"]:checked').value;
  qualityControl.style.display = (format === 'jpeg' || format === 'webp') ? 'block' : 'none';
}

formatPng.addEventListener('change', updateQualityVisibility);
formatJpeg.addEventListener('change', updateQualityVisibility);
formatWebp.addEventListener('change', updateQualityVisibility);

qualitySlider.addEventListener('input', () => {
  qualityValue.textContent = qualitySlider.value;
});

// Handle custom delay input
document.querySelectorAll('input[name="delay"]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'custom') {
      customDelayInput.disabled = false;
      customDelayInput.focus();
    } else {
      customDelayInput.disabled = true;
    }
  });
});

responsiveToggle.addEventListener('change', () => {
  devicePanel.style.display = responsiveToggle.checked ? 'block' : 'none';
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getBreakpoints() {
  const breakpoints = [];

  deviceList.querySelectorAll('div').forEach(row => {
    const cb = row.querySelector('input[type=checkbox]');
    const wi = row.querySelector('input[type=number]');
    if (cb && cb.checked && wi && wi.value) {
      breakpoints.push({ label: cb.dataset.label, width: parseInt(wi.value, 10) });
    }
  });

  customRowsEl.querySelectorAll('div').forEach(row => {
    const cb = row.querySelector('input[type=checkbox]');
    const wi = row.querySelector('input[type=number]');
    if (cb && cb.checked && wi && wi.value) {
      breakpoints.push({ label: wi.value + 'px', width: parseInt(wi.value, 10) });
    }
  });

  return breakpoints;
}

function collectDeviceState() {
  const predefined = {};
  deviceList.querySelectorAll('div').forEach(row => {
    const cb = row.querySelector('input[type=checkbox]');
    const wi = row.querySelector('input[type=number]');
    if (cb && wi) {
      predefined[cb.dataset.label] = { checked: cb.checked, width: parseInt(wi.value, 10) };
    }
  });

  const custom = [];
  customRowsEl.querySelectorAll('div').forEach(row => {
    const wi = row.querySelector('input[type=number]');
    const cb = row.querySelector('input[type=checkbox]');
    if (wi && wi.value) custom.push({ width: parseInt(wi.value, 10), checked: cb ? cb.checked : true });
  });

  return { predefined, custom };
}

function applyDeviceState(state) {
  if (!state) return;

  if (state.predefined) {
    deviceList.querySelectorAll('div').forEach(row => {
      const cb = row.querySelector('input[type=checkbox]');
      const wi = row.querySelector('input[type=number]');
      const saved = cb && state.predefined[cb.dataset.label];
      if (saved) {
        cb.checked   = saved.checked;
        if (wi) wi.value = saved.width;
      }
    });
  }

  if (state.custom && state.custom.length > 0) {
    state.custom.forEach(c => addCustomRow(c.width));
    // restore checked state for custom rows after they're built
    const rows = customRowsEl.querySelectorAll('div');
    state.custom.forEach((c, i) => {
      if (rows[i]) {
        const cb = rows[i].querySelector('input[type=checkbox]');
        if (cb) cb.checked = c.checked !== false;
      }
    });
  }
}

// ── History Management ─────────────────────────────────────────────────────────
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function loadHistory() {
  chrome.storage.local.get(['screenshotHistory'], (res) => {
    const history = res.screenshotHistory || [];
    
    if (history.length === 0) {
      historyList.innerHTML = '<div style="color:#999; text-align:center; padding:10px 0;">No history yet</div>';
      return;
    }

    // Sort by timestamp descending (newest first)
    history.sort((a, b) => b.timestamp - a.timestamp);

    historyList.innerHTML = history.map((item, index) => `
      <div style="border-bottom:1px solid #eee; padding:6px 0; display:flex; flex-direction:column; gap:4px;">
        <div style="font-weight:500; word-break:break-word;">${item.filename}</div>
        <div style="font-size:10px; color:#666; word-break:break-all;">${item.url}</div>
        <div style="display:flex; gap:6px; align-items:center; margin-top:2px;">
          <span style="font-size:10px; color:#999;">${formatDate(item.timestamp)}</span>
          <button class="copy-filename" data-index="${index}" style="font-size:9px; padding:2px 6px; cursor:pointer; background:#4CAF50; color:white; border:none; border-radius:2px;">Copy Name</button>
          <button class="open-url" data-index="${index}" style="font-size:9px; padding:2px 6px; cursor:pointer; background:#2196F3; color:white; border:none; border-radius:2px;">Open Page</button>
          <button class="delete-item" data-index="${index}" style="font-size:9px; padding:2px 6px; cursor:pointer; background:#f44336; color:white; border:none; border-radius:2px;">Delete</button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    historyList.querySelectorAll('.copy-filename').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const filename = history[index].filename;
        navigator.clipboard.writeText(filename).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy Name', 1500);
        });
      });
    });

    historyList.querySelectorAll('.open-url').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const url = history[index].url;
        chrome.tabs.create({ url });
      });
    });

    historyList.querySelectorAll('.delete-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        history.splice(index, 1);
        chrome.storage.local.set({ screenshotHistory: history }, () => {
          loadHistory();
        });
      });
    });
  });
}

clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear all screenshot history?')) {
    chrome.storage.local.set({ screenshotHistory: [] }, () => {
      loadHistory();
    });
  }
});

// ── Load saved state ──────────────────────────────────────────────────────────
chrome.storage.local.get([
  'lastResponsive', 'lastDeviceState', 
  'lastNamingEnabled', 'lastIncludeDomain', 'lastIncludeTitle', 
  'lastIncludeTime', 'lastIncludeDevice', 'lastCustomName',
  'lastFormat', 'lastQuality', 'lastDelay', 'lastDelayEnabled',
  'lastDelayMode', 'lastCustomDelay', 'lastAction'
], (res) => {
  if (res.lastNamingEnabled) {
    namingToggle.checked = true;
    namingPanel.style.display = 'block';
  }
  
  // Set naming checkboxes (defaults to checked if not previously saved)
  includeDomain.checked = res.lastIncludeDomain !== undefined ? res.lastIncludeDomain : true;
  includeTitle.checked = res.lastIncludeTitle !== undefined ? res.lastIncludeTitle : true;
  includeTime.checked = res.lastIncludeTime !== undefined ? res.lastIncludeTime : true;
  includeDevice.checked = res.lastIncludeDevice || false;
  
  if (res.lastCustomName) customNameInput.value = res.lastCustomName;

  // Set format (default to PNG)
  const format = res.lastFormat || 'png';
  if (format === 'png') formatPng.checked = true;
  else if (format === 'jpeg') formatJpeg.checked = true;
  else if (format === 'webp') formatWebp.checked = true;
  
  // Set quality (default to 92)
  const quality = res.lastQuality || 92;
  qualitySlider.value = quality;
  qualityValue.textContent = quality;
  
  updateQualityVisibility();

  // Set action (default to download)
  const action = res.lastAction || 'download';
  const actionRadio = document.getElementById(`action-${action}`);
  if (actionRadio) actionRadio.checked = true;

  // Set delay toggle and panel
  if (res.lastDelayEnabled) {
    delayToggle.checked = true;
    delayPanel.style.display = 'block';
  }

  // Set delay mode (default to "0" - None)
  const delayMode = res.lastDelayMode || '0';
  const delayRadio = document.getElementById(delayMode === 'custom' ? 'delay-custom' : `delay-${delayMode}`);
  if (delayRadio) delayRadio.checked = true;
  
  // Set custom delay input value and enable/disable
  if (res.lastCustomDelay) customDelayInput.value = res.lastCustomDelay;
  customDelayInput.disabled = (delayMode !== 'custom');

  if (res.lastResponsive) {
    responsiveToggle.checked = true;
    devicePanel.style.display = 'block';
  }

  applyDeviceState(res.lastDeviceState);
});

// ── Capture ───────────────────────────────────────────────────────────────────
async function start() {
  const responsive      = responsiveToggle.checked;
  const breakpoints     = responsive ? getBreakpoints() : null;

  if (responsive && (!breakpoints || breakpoints.length === 0)) {
    alert('Select at least one device for responsive capture.');
    return;
  }

  const namingEnabled   = namingToggle.checked;
  const customName      = customNameInput.value.trim();
  const format          = document.querySelector('input[name="format"]:checked').value;
  const quality         = parseInt(qualitySlider.value, 10);
  const action          = document.querySelector('input[name="action"]:checked').value;
  
  // Get delay value (handle custom input)
  const selectedDelay   = document.querySelector('input[name="delay"]:checked');
  let delay = 0;
  if (selectedDelay.value === 'custom') {
    const customValue = parseInt(customDelayInput.value, 10);
    delay = (customValue && customValue > 0) ? customValue : 0;
  } else {
    delay = parseInt(selectedDelay.value, 10);
  }
  
  const namingConfig = {
    enabled: namingEnabled,
    includeDomain: includeDomain.checked,
    includeTitle: includeTitle.checked,
    includeTime: includeTime.checked,
    includeDevice: includeDevice.checked,
    customName: customName,
  };

  const formatConfig = {
    format: format,
    quality: quality,
    outputAction: action,
  };

  chrome.storage.local.set({
    lastResponsive:     responsive,
    lastDeviceState:    collectDeviceState(),
    lastBreakpoints:    breakpoints,
    lastNamingEnabled:  namingEnabled,
    lastIncludeDomain:  includeDomain.checked,
    lastIncludeTitle:   includeTitle.checked,
    lastIncludeTime:    includeTime.checked,
    lastIncludeDevice:  includeDevice.checked,
    lastCustomName:     customName,
    lastFormat:         format,
    lastQuality:        quality,
    lastDelay:          delay,
    lastDelayEnabled:   delayToggle.checked,
    lastDelayMode:      selectedDelay.value,
    lastCustomDelay:    customDelayInput.value,
    lastAction:         action,
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Show status indicator
  startButton.disabled = true;
  statusIndicator.style.display = 'block';
  statusText.textContent = 'Initializing capture...';

  // Send capture request
  const sendCapture = () => new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'startCapture',
      responsive,
      breakpoints,
      namingConfig,
      formatConfig,
      delay,
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });

  try {
    // Initiate capture
    statusText.textContent = delay > 0 ? `Waiting ${delay}s before capture...` : 'Capturing screenshot...';
    
    let response;
    try {
      response = await sendCapture();
    } catch (e) {
      // Content script not injected, inject it first
      statusText.textContent = 'Injecting content script...';
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await new Promise(r => setTimeout(r, 200));
      statusText.textContent = 'Capturing screenshot...';
      response = await sendCapture();
    }
    
    if (!response || !response.success) {
      statusIndicator.style.background = '#f44336';
      statusText.textContent = '❌ ' + (response?.error || 'Unknown error');
      setTimeout(() => {
        statusIndicator.style.display = 'none';
        startButton.disabled = false;
      }, 3000);
      return;
    }
    
    // Process results
    const results = response.results || [];
    statusText.textContent = `Processing ${results.length} screenshot(s)...`;
    
    for (const result of results) {
      const { dataUrl, filename, mimeType } = result;
      
      // Handle download
      if (action === 'download' || action === 'both') {
        chrome.runtime.sendMessage({
          action: 'download',
          url: dataUrl,
          filename: filename
        });
      }
      
      // Handle clipboard (in popup context - within user gesture)
      if (action === 'clipboard' || action === 'both') {
        statusText.textContent = 'Copying to clipboard...';
        try {
          // Convert data URL to blob
          const base64Data = dataUrl.split(',')[1];
          const binaryData = atob(base64Data);
          const arrayBuffer = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            arrayBuffer[i] = binaryData.charCodeAt(i);
          }
          const blob = new Blob([arrayBuffer], { type: mimeType });
          
          // Copy to clipboard in popup context (reliable)
          await navigator.clipboard.write([
            new ClipboardItem({ [mimeType]: blob })
          ]);
          
          console.log('✅ Copied to clipboard (popup context)');
        } catch (clipErr) {
          console.warn('Popup clipboard failed, trying fallback:', clipErr);
          
          // Fallback: Use content script context
          chrome.tabs.sendMessage(tab.id, {
            action: 'copyToClipboard',
            dataUrl: dataUrl,
            mimeType: mimeType
          }, (fallbackResponse) => {
            if (fallbackResponse && fallbackResponse.success) {
              console.log('✅ Copied to clipboard (content script fallback)');
            } else {
              console.error('❌ Both clipboard methods failed');
            }
          });
        }
      }
      
      // Save to history
      chrome.storage.local.get(['screenshotHistory'], (res) => {
        let history = res.screenshotHistory || [];
        history.unshift({
          filename: filename,
          url: tab.url,
          timestamp: Date.now()
        });
        if (history.length > 50) history = history.slice(0, 50);
        chrome.storage.local.set({ screenshotHistory: history });
      });
    }
    
    // Success!
    statusIndicator.style.background = '#4CAF50';
    statusText.textContent = action === 'clipboard' || action === 'both' 
      ? '✅ Copied to clipboard!' 
      : '✅ Downloaded successfully!';
    
    setTimeout(() => {
      statusIndicator.style.display = 'none';
      startButton.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Capture error:', error);
    statusIndicator.style.background = '#f44336';
    statusText.textContent = '❌ Failed: ' + error.message;
    setTimeout(() => {
      statusIndicator.style.display = 'none';
      startButton.disabled = false;
    }, 3000);
  }
}

startButton.addEventListener('click', start);

