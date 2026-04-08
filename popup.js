const namingToggle      = document.getElementById('naming-toggle');
const namingPanel       = document.getElementById('naming-panel');
const includeDomain     = document.getElementById('include-domain');
const includeTitle      = document.getElementById('include-title');
const includeTime       = document.getElementById('include-time');
const includeDevice     = document.getElementById('include-device');
const customNameInput   = document.getElementById('custom-name');
const responsiveToggle  = document.getElementById('responsive-toggle');
const devicePanel       = document.getElementById('device-panel');
const deviceList        = document.getElementById('device-list');
const customRowsEl      = document.getElementById('custom-rows');

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

// ── Load saved state ──────────────────────────────────────────────────────────
chrome.storage.local.get([
  'lastResponsive', 'lastDeviceState', 
  'lastNamingEnabled', 'lastIncludeDomain', 'lastIncludeTitle', 
  'lastIncludeTime', 'lastIncludeDevice', 'lastCustomName'
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
  
  const namingConfig = {
    enabled: namingEnabled,
    includeDomain: includeDomain.checked,
    includeTitle: includeTitle.checked,
    includeTime: includeTime.checked,
    includeDevice: includeDevice.checked,
    customName: customName,
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
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const sendCapture = () => chrome.tabs.sendMessage(tab.id, {
    action: 'startCapture',
    responsive,
    breakpoints,
    namingConfig,
  });

  try {
    await sendCapture();
  } catch (e) {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await new Promise(r => setTimeout(r, 200));
    await sendCapture();
  }
}

document.getElementById('start').addEventListener('click', start);

