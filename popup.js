const input            = document.getElementById('name');
const suffixInput      = document.getElementById('suffix');
const responsiveToggle = document.getElementById('responsive-toggle');
const devicePanel      = document.getElementById('device-panel');
const deviceList       = document.getElementById('device-list');
const customRowsEl     = document.getElementById('custom-rows');

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
chrome.storage.local.get(['lastName', 'lastSuffix', 'lastResponsive', 'lastDeviceState'], (res) => {
  if (res.lastName)  input.value       = res.lastName;
  if (res.lastSuffix) suffixInput.value = res.lastSuffix;

  if (res.lastResponsive) {
    responsiveToggle.checked = true;
    devicePanel.style.display = 'block';
  }

  applyDeviceState(res.lastDeviceState);
  input.focus();
});

// ── Capture ───────────────────────────────────────────────────────────────────
async function start() {
  const name = input.value.trim();
  if (!name) { alert('Enter a name'); return; }

  const suffix     = suffixInput.value.trim();
  const responsive = responsiveToggle.checked;
  const breakpoints = responsive ? getBreakpoints() : null;

  if (responsive && (!breakpoints || breakpoints.length === 0)) {
    alert('Select at least one device for responsive capture.');
    return;
  }

  chrome.storage.local.set({
    lastName:        name,
    lastSuffix:      suffix,
    lastResponsive:  responsive,
    lastDeviceState: collectDeviceState(),
    lastBreakpoints: breakpoints,
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const sendCapture = () => chrome.tabs.sendMessage(tab.id, {
    action: 'startCapture',
    name,
    suffix,
    responsive,
    breakpoints,
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
input.addEventListener('keydown',      (e) => { if (e.key === 'Enter') start(); });
suffixInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
