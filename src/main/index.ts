import { app, BrowserWindow, nativeTheme, protocol, net } from 'electron';
import { join } from 'path';
import path from 'path';
import {
  APP_NAME,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_CAPTURE_HOTKEY
} from '../shared/constants';
import { registerIpcHandlers, cleanup } from './ipc';
import { getDefaultDataDir } from './store/file-store';
import { showCaptureWindow, destroyCaptureWindow, updateCaptureWindowDarkMode } from './quick-capture-window';
import { registerGlobalHotkey, unregisterGlobalHotkey } from './global-hotkey';

// Set app name for dock/taskbar display (in dev mode Electron uses its own name)
app.name = APP_NAME;

// Ignore EPIPE errors on stdout/stderr (can happen when parent process closes pipe)
process.stdout?.on('error', () => {});
process.stderr?.on('error', () => {});

// Register custom protocol scheme before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'cadence-file', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  // In production, electron-builder handles the icon via icon.icns.
  // In dev mode, use the source icon.png.
  const iconPath = process.env['ELECTRON_RENDERER_URL']
    ? join(__dirname, '../../resources/icon.png')
    : undefined;

  mainWindow = new BrowserWindow({
    title: APP_NAME,
    ...(iconPath ? { icon: iconPath } : {}),
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  // Dark mode: send theme state to renderer via class on html element
  mainWindow.webContents.on('did-finish-load', () => {
    const isDark = nativeTheme.shouldUseDarkColors;
    mainWindow?.webContents.executeJavaScript(
      `document.documentElement.classList.toggle('dark', ${isDark})`
    );
  });

  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors;
    mainWindow?.webContents.executeJavaScript(
      `document.documentElement.classList.toggle('dark', ${isDark})`
    );
    // Also update capture window dark mode
    updateCaptureWindowDarkMode();
  });

  // Load renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

app.whenReady().then(() => {
  // Register custom protocol for serving attachment images
  const dataDir = getDefaultDataDir();
  protocol.handle('cadence-file', (request) => {
    const url = new URL(request.url);
    const urlPath = decodeURIComponent(url.pathname);
    const resolved = path.resolve(dataDir, urlPath.replace(/^\//, ''));

    // Prevent path traversal outside dataDir
    if (!resolved.startsWith(dataDir + path.sep) && resolved !== dataDir) {
      return new Response('Forbidden', { status: 403 });
    }

    return net.fetch('file://' + resolved);
  });

  // Set dock icon on macOS in dev mode (production build uses icon.icns from electron-builder)
  if (process.platform === 'darwin' && app.dock && process.env['ELECTRON_RENDERER_URL']) {
    const iconPath = join(__dirname, '../../resources/icon.png');
    try {
      app.dock.setIcon(iconPath);
    } catch {
      // Icon not found — skip silently
    }
  }

  const win = createWindow();

  // Initialize data layer and IPC handlers after window is created
  registerIpcHandlers(win);

  // Register global hotkey for quick capture
  registerGlobalHotkey(DEFAULT_CAPTURE_HOTKEY, showCaptureWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow();
      registerIpcHandlers(newWin);
    }
  });
});

app.on('will-quit', () => {
  // Clean up file watcher and database before process exits.
  // With useFsEvents:false, watcher.close() is synchronous enough
  // to complete before the Node.js environment tears down.
  cleanup();
  unregisterGlobalHotkey();
  destroyCaptureWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
