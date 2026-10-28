// Where the headless renders find Chrome: $CHROME if set, else the usual install paths on Windows, macOS and Linux.
// `angle` picks the GPU backend per platform (d3d11 on Windows, metal on macOS, Chrome's default elsewhere).
import fs from 'node:fs';
import path from 'node:path';

const PATHS = {
  win32: ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')],
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
};
export const chrome = process.env.CHROME || (PATHS[process.platform] || []).find((p) => p && fs.existsSync(p)) || 'google-chrome';
export const angle = { win32: ['--use-angle=d3d11'], darwin: ['--use-angle=metal'] }[process.platform] || [];
