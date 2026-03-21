/**
 * Post-install script: patches the Electron.app Info.plist on macOS
 * to display "Cadence" in the dock instead of "Electron" during development.
 * Silently skips on Windows and Linux.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.platform !== 'darwin') {
  // Only needed on macOS
  process.exit(0);
}

const plist = path.join(
  __dirname,
  '..',
  'node_modules',
  'electron',
  'dist',
  'Electron.app',
  'Contents',
  'Info.plist'
);

if (!fs.existsSync(plist)) {
  console.log('[postinstall] Electron Info.plist not found, skipping dock name patch');
  process.exit(0);
}

try {
  execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleName Cadence" "${plist}"`);
  execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Cadence" "${plist}"`);
  console.log('[postinstall] Dock name set to "Cadence"');
} catch (err) {
  console.warn('[postinstall] Could not patch dock name:', err.message);
}
