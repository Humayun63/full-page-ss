# Advanced Full Page Screenshot Tool

A Chrome extension that captures full-page screenshots with flexible naming, optional suffix labels, automatic device detection, and a responsive screenshot mode that captures all three breakpoints in one click.

---

## Features

- **Full-page capture** — scrolls the entire page and stitches all visible segments into a single PNG, regardless of page height.
- **Multiple capture modes** — Full Page, Visible Area, Select Area (drag to select), Select Element (click element)
- **Custom file naming** — set a base name before capturing with dynamic variables (domain, title, time, device)
- **Format selection** — Choose PNG, JPEG, or WebP with quality controls
- **Output options** — Download, Copy to Clipboard, Edit with Annotations, or Upload to ImgBB
- **Screenshot history** — Tracks last 50 screenshots with timestamps and URLs
- **Delay timer** — Capture after 3s, 5s, 10s, or custom delay for dynamic UI states
- **Annotation tools** — Add arrows, rectangles, highlights, blur sensitive info, and text to screenshots
- **Upload to ImgBB** — Instantly upload screenshots and get shareable links
- **Automatic device label** — the device type is appended to the filename based on the current window width:
  - `> 991px` → `-desktop`
  - `> 575px` and `≤ 991px` → `-tablet`
  - `≤ 575px` → `-mobile`
- **Responsive screenshot mode** — a single checkbox triggers three sequential captures, automatically resizing the browser window to:
  - `1920px` → saves as `-desktop`
  - `991px` → saves as `-tablet`
  - `575px` → saves as `-mobile`
  - The window is restored to its original width when done.
- **Keyboard shortcut** — trigger a capture without opening the popup.
- **Auto content script injection** — works on tabs that were open before the extension was installed or reloaded, with no manual page refresh needed.

---

## File Naming

| Condition | Filename |
|---|---|
| Name only | `[name]-desktop.png` |
| Name + suffix | `[name]-[suffix]-desktop.png` |
| Responsive mode | `[name]-desktop.png`, `[name]-tablet.png`, `[name]-mobile.png` |
| Responsive + suffix | `[name]-[suffix]-desktop.png`, `[name]-[suffix]-tablet.png`, `[name]-[suffix]-mobile.png` |

---

## Installation

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the `fullpage-extension-v2` folder.
4. The extension icon will appear in the toolbar.

---

## Usage

### Basic screenshot

1. Navigate to the page you want to capture.
2. Click the extension icon in the toolbar.
3. Enter a **name** (required).
4. Optionally enter a **suffix**.
5. Click **Capture**.

The file is saved automatically to your default Downloads folder.

### Responsive screenshot (all three breakpoints)

1. Click the extension icon.
2. Enter a **name** and optional **suffix**.
3. Check **Responsive screenshot**.
4. Click **Capture**.

The extension will resize the browser window to 1920px, 991px, and 575px in sequence, capturing a full-page screenshot at each size. Three files will be saved automatically.

### Upload to ImgBB

**First-time setup:**
1. Get a free API key from https://api.imgbb.com/
2. Open the extension popup
3. Click "Settings" at the bottom
4. Enter your API key in the "ImgBB API Key" field
5. Click "Save"

**Usage:**
1. Click the extension icon
2. Configure your screenshot settings
3. Select **"Upload to ImgBB"** or **"Upload & Copy URL"** as output action
4. Click **Capture**

**What happens:**
- **Upload to ImgBB**: Uploads image and opens it in a new tab
- **Upload & Copy URL**: Uploads image, copies URL to clipboard, and opens it in a new tab

See [IMGBB_SETUP.md](IMGBB_SETUP.md) for detailed setup instructions.

### Keyboard shortcut

Press **Cmd+Shift+S** (Mac) or **Ctrl+Shift+S** (Windows/Linux) on any tab to start a capture using the last saved name, suffix, and responsive setting — no popup required.

To change the shortcut, go to `chrome://extensions/shortcuts`.

---

## Permissions

| Permission | Reason |
|---|---|
| `tabs` | Query and message the active tab |
| `scripting` | Inject the content script on demand |
| `activeTab` | Access the currently active tab |
| `downloads` | Save screenshots to disk |
| `storage` | Remember name, suffix, and responsive preference |
| `windows` | Resize the browser window for responsive mode |
| `clipboardWrite` | Copy screenshots and URLs to clipboard |
| `https://api.imgbb.com/*` | Upload screenshots to ImgBB |
