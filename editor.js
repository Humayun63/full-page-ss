// ══════════════════════════════════════════════════════════════════════════════
// Screenshot Annotation Editor
// ══════════════════════════════════════════════════════════════════════════════

const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// State
let currentTool = 'select';
let isDrawing = false;
let startX, startY;
let currentColor = '#ff0000';
let currentSize = 3;
let imageData = null;
let originalFilename = 'screenshot';
let mimeType = 'image/png';
let annotations = []; // Store all annotations for undo

// ── Initialize ────────────────────────────────────────────────────────────────
function init() {
  // Get image data from URL params
  const params = new URLSearchParams(window.location.search);
  const dataUrl = params.get('image');
  const filename = params.get('filename');
  const mime = params.get('mimeType');
  
  if (dataUrl) {
    loadImage(dataUrl);
  }
  
  if (filename) {
    originalFilename = filename;
  }
  
  if (mime) {
    mimeType = mime;
  }
  
  setupEventListeners();
}

// ── Load Image ────────────────────────────────────────────────────────────────
function loadImage(dataUrl) {
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Store original image data
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

// ── Event Listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  // Tool buttons
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
      
      // Update cursor
      if (currentTool === 'select') {
        canvas.style.cursor = 'default';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    });
  });
  
  // Color picker
  document.getElementById('colorPicker').addEventListener('input', (e) => {
    currentColor = e.target.value;
  });
  
  // Size slider
  document.getElementById('sizeSlider').addEventListener('input', (e) => {
    currentSize = parseInt(e.target.value);
    document.getElementById('sizeValue').textContent = currentSize + 'px';
  });
  
  // Canvas drawing
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);
  
  // Action buttons
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('clearBtn').addEventListener('click', clearAll);
  document.getElementById('saveBtn').addEventListener('click', saveAndDownload);
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.close();
  });
}

// ── Drawing Handlers ──────────────────────────────────────────────────────────
function handleMouseDown(e) {
  if (currentTool === 'select') return;
  
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
  
  if (currentTool === 'text') {
    addText(startX, startY);
    isDrawing = false;
  }
}

function handleMouseMove(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  // Redraw image and all annotations
  redrawCanvas();
  
  // Draw preview of current annotation
  if (currentTool === 'arrow') {
    drawArrow(startX, startY, currentX, currentY, currentColor, currentSize);
  } else if (currentTool === 'rect') {
    drawRectangle(startX, startY, currentX, currentY, currentColor, currentSize);
  } else if (currentTool === 'highlight') {
    drawHighlight(startX, startY, currentX, currentY, currentColor);
  } else if (currentTool === 'blur') {
    drawBlur(startX, startY, currentX, currentY);
  }
}

function handleMouseUp(e) {
  if (!isDrawing) return;
  isDrawing = false;
  
  const rect = canvas.getBoundingClientRect();
  const endX = e.clientX - rect.left;
  const endY = e.clientY - rect.top;
  
  // Save annotation
  if (currentTool === 'arrow') {
    annotations.push({
      type: 'arrow',
      x1: startX, y1: startY, x2: endX, y2: endY,
      color: currentColor, size: currentSize
    });
  } else if (currentTool === 'rect') {
    annotations.push({
      type: 'rect',
      x1: startX, y1: startY, x2: endX, y2: endY,
      color: currentColor, size: currentSize
    });
  } else if (currentTool === 'highlight') {
    annotations.push({
      type: 'highlight',
      x1: startX, y1: startY, x2: endX, y2: endY,
      color: currentColor
    });
  } else if (currentTool === 'blur') {
    annotations.push({
      type: 'blur',
      x1: startX, y1: startY, x2: endX, y2: endY
    });
  }
  
  redrawCanvas();
}

// ── Drawing Functions ─────────────────────────────────────────────────────────
function drawArrow(x1, y1, x2, y2, color, size) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Draw arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = size * 4;
  
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function drawRectangle(x1, y1, x2, y2, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}

function drawHighlight(x1, y1, x2, y2, color) {
  ctx.fillStyle = color + '40'; // Add transparency
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
}

function drawBlur(x1, y1, x2, y2) {
  const width = x2 - x1;
  const height = y2 - y1;
  
  if (width === 0 || height === 0) return;
  
  // Get the region to blur
  const imageData = ctx.getImageData(
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.abs(width),
    Math.abs(height)
  );
  
  // Apply pixelation effect (simple blur alternative)
  const pixelSize = 10;
  const w = imageData.width;
  const h = imageData.height;
  
  for (let y = 0; y < h; y += pixelSize) {
    for (let x = 0; x < w; x += pixelSize) {
      // Get average color in block
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let py = 0; py < pixelSize && y + py < h; py++) {
        for (let px = 0; px < pixelSize && x + px < w; px++) {
          const i = ((y + py) * w + (x + px)) * 4;
          r += imageData.data[i];
          g += imageData.data[i + 1];
          b += imageData.data[i + 2];
          count++;
        }
      }
      
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      
      // Fill block with average color
      for (let py = 0; py < pixelSize && y + py < h; py++) {
        for (let px = 0; px < pixelSize && x + px < w; px++) {
          const i = ((y + py) * w + (x + px)) * 4;
          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
        }
      }
    }
  }
  
  ctx.putImageData(imageData, Math.min(x1, x2), Math.min(y1, y2));
}

function addText(x, y) {
  const text = prompt('Enter text:');
  if (!text) return;
  
  annotations.push({
    type: 'text',
    x: x, y: y,
    text: text,
    color: currentColor,
    size: currentSize * 5
  });
  
  redrawCanvas();
}

function drawText(x, y, text, color, size) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillText(text, x, y);
}

// ── Redraw Canvas ─────────────────────────────────────────────────────────────
function redrawCanvas() {
  // Clear and draw original image
  ctx.putImageData(imageData, 0, 0);
  
  // Redraw all annotations
  annotations.forEach(annotation => {
    if (annotation.type === 'arrow') {
      drawArrow(annotation.x1, annotation.y1, annotation.x2, annotation.y2, annotation.color, annotation.size);
    } else if (annotation.type === 'rect') {
      drawRectangle(annotation.x1, annotation.y1, annotation.x2, annotation.y2, annotation.color, annotation.size);
    } else if (annotation.type === 'highlight') {
      drawHighlight(annotation.x1, annotation.y1, annotation.x2, annotation.y2, annotation.color);
    } else if (annotation.type === 'blur') {
      drawBlur(annotation.x1, annotation.y1, annotation.x2, annotation.y2);
    } else if (annotation.type === 'text') {
      drawText(annotation.x, annotation.y, annotation.text, annotation.color, annotation.size);
    }
  });
}

// ── Undo ──────────────────────────────────────────────────────────────────────
function undo() {
  if (annotations.length === 0) return;
  annotations.pop();
  redrawCanvas();
}

// ── Clear All ─────────────────────────────────────────────────────────────────
function clearAll() {
  if (!confirm('Clear all annotations?')) return;
  annotations = [];
  redrawCanvas();
}

// ── Save and Download ─────────────────────────────────────────────────────────
function saveAndDownload() {
  // Get final image data
  const finalDataUrl = canvas.toDataURL(mimeType);
  
  // Create download link
  const link = document.createElement('a');
  link.href = finalDataUrl;
  link.download = originalFilename.replace(/\.(png|jpg|jpeg|webp)$/i, '-edited.$1');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show notification
  showNotification('✅ Edited screenshot downloaded!');
  
  // Close after brief delay
  setTimeout(() => {
    window.close();
  }, 1500);
}

// ── Notification ──────────────────────────────────────────────────────────────
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 1000000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 2000);
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();
