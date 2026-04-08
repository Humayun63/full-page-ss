async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function captureVisible() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'capture' }, resolve);
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

async function captureFullPage(name, suffix, device) {
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

  const parts = [name];
  if (suffix) parts.push(suffix);
  parts.push(device);

  chrome.runtime.sendMessage({
    action: 'download',
    url: finalImage,
    filename: parts.join('-') + '.png'
  });
}

async function startFullPageCapture(name, suffix) {
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

  await captureFullPage(name, suffix, device);
}

async function startResponsiveCapture(name, suffix, breakpoints) {
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
    await captureFullPage(name, suffix, label);
  }

  // Restore original window size
  chrome.runtime.sendMessage({ action: 'resizeWindow', width: originalWidth });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'startCapture') {
    if (msg.responsive && msg.breakpoints && msg.breakpoints.length > 0) {
      startResponsiveCapture(msg.name, msg.suffix, msg.breakpoints);
    } else {
      startFullPageCapture(msg.name, msg.suffix);
    }
  }
});