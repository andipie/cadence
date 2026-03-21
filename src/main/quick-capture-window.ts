import { app, BrowserWindow, nativeTheme, screen } from 'electron';
import { join } from 'path';
import { CAPTURE_WINDOW_WIDTH, CAPTURE_WINDOW_HEIGHT } from '../shared/constants';
import { IPC } from '../shared/ipc-channels';

let captureWindow: BrowserWindow | null = null;

function applyDarkMode(win: BrowserWindow): void {
  const isDark = nativeTheme.shouldUseDarkColors;
  win.webContents.executeJavaScript(
    `document.documentElement.classList.toggle('dark', ${isDark})`
  );
}

/**
 * Create the capture window (hidden). Reuses existing preload script.
 */
function createCaptureWindow(): BrowserWindow {
  // Center on the display where the cursor currently is (multi-monitor support)
  const cursorPoint = screen.getCursorScreenPoint();
  const activeDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x, y, width, height } = activeDisplay.workArea;

  const winX = Math.round(x + (width - CAPTURE_WINDOW_WIDTH) / 2);
  const winY = Math.round(y + (height - CAPTURE_WINDOW_HEIGHT) / 3); // Upper third looks better

  captureWindow = new BrowserWindow({
    width: CAPTURE_WINDOW_WIDTH,
    height: CAPTURE_WINDOW_HEIGHT,
    x: winX,
    y: winY,
    frame: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    transparent: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  // Apply dark mode when content loads
  captureWindow.webContents.on('did-finish-load', () => {
    if (captureWindow) {
      applyDarkMode(captureWindow);
    }
  });

  // Intercept close → hide instead of destroy (for fast re-open)
  captureWindow.on('close', (e) => {
    if (captureWindow && !captureWindow.isDestroyed()) {
      e.preventDefault();
      captureWindow.hide();
    }
  });

  captureWindow.on('blur', () => {
    // Hide when the window loses focus (click outside)
    if (captureWindow && captureWindow.isVisible()) {
      captureWindow.hide();
    }
  });

  // Load the capture page
  if (process.env['ELECTRON_RENDERER_URL']) {
    captureWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/capture.html');
  } else {
    captureWindow.loadFile(join(__dirname, '../renderer/capture.html'));
  }

  return captureWindow;
}

/**
 * Show the capture window. Creates it if it doesn't exist yet.
 */
export function showCaptureWindow(): void {
  if (!captureWindow || captureWindow.isDestroyed()) {
    captureWindow = createCaptureWindow();
  }

  // Re-center on current display (user may have moved to another monitor)
  const cursorPoint = screen.getCursorScreenPoint();
  const activeDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x, y, width, height } = activeDisplay.workArea;
  const winX = Math.round(x + (width - CAPTURE_WINDOW_WIDTH) / 2);
  const winY = Math.round(y + (height - CAPTURE_WINDOW_HEIGHT) / 3);
  captureWindow.setPosition(winX, winY);

  // Steal focus on macOS so the window appears even from background
  if (process.platform === 'darwin') {
    app.focus({ steal: true });
  }

  captureWindow.show();
  captureWindow.focus();

  // Notify the renderer to reset fields and focus
  captureWindow.webContents.send(IPC.CAPTURE_SHOW);
}

/**
 * Update dark mode on the capture window (call from nativeTheme listener).
 */
export function updateCaptureWindowDarkMode(): void {
  if (captureWindow && !captureWindow.isDestroyed()) {
    applyDarkMode(captureWindow);
  }
}

/**
 * Destroy the capture window (call on app quit).
 */
export function destroyCaptureWindow(): void {
  if (captureWindow && !captureWindow.isDestroyed()) {
    // Remove the close interceptor so we can actually destroy it
    captureWindow.removeAllListeners('close');
    captureWindow.destroy();
  }
  captureWindow = null;
}
