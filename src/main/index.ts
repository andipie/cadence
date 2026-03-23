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
import { registerPhase1Handlers, initializeDataLayer, cleanup } from './ipc';
import { checkStartupState } from './services/startup-service';
import { getCurrentDataDir, setCurrentDataDir } from './ipc/startup';
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
  // In production on macOS, electron-builder handles the icon via icon.icns.
  // In production on non-macOS platforms, the icon is copied to resourcesPath via extraResources.
  // macOS uses the .icns from the app bundle. In dev mode, use the source icon.png directly.
  const iconPath = app.isPackaged
    ? (process.platform !== 'darwin' ? join(process.resourcesPath, 'icon.png') : undefined)
    : join(__dirname, '../../resources/icon.png');

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
  // Register custom protocol for serving attachment images.
  // Uses a mutable reference to dataDir — not available until Phase 2.
  protocol.handle('cadence-file', (request) => {
    const dataDir = getCurrentDataDir();
    if (!dataDir) {
      return new Response('Not initialized', { status: 503 });
    }

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
  if (process.platform === 'darwin' && app.dock && !app.isPackaged) {
    const iconPath = join(__dirname, '../../resources/icon.png');
    try {
      app.dock.setIcon(iconPath);
    } catch {
      // Icon not found — skip silently
    }
  }

  const win = createWindow();

  // Phase 1: Register startup IPC handlers (always — no data dir needed)
  registerPhase1Handlers(win);

  // Check startup state — if ready, immediately run Phase 2
  const state = checkStartupState();
  if (state.state === 'ready') {
    setCurrentDataDir(state.dataDir);
    initializeDataLayer(win, state.dataDir);
    win.setTitle(`${APP_NAME} — ${path.basename(state.dataDir)}`);
  }

  // Register global hotkey for quick capture
  registerGlobalHotkey(DEFAULT_CAPTURE_HOTKEY, showCaptureWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow();
      registerPhase1Handlers(newWin);
      // Re-initialize data layer if we have a valid dir
      const dataDir = getCurrentDataDir();
      if (dataDir) {
        initializeDataLayer(newWin, dataDir);
      }
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
