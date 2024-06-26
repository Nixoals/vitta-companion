import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import MainNiryo from './niryoInterface/mainNiryo';
const os = require('os');
const isDev = require('electron-is-dev');
import { ipcMain } from 'electron';

const checkVersion = async (platform:string) => {
	let version = '';
	const appVersion = 'v' + app.getVersion();
	const url = 'https://api.github.com/repos/Nixoals/vitta-companion/releases/latest'; // update with the new repo when available on vittascience github

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		version = data.tag_name; // get the tag name of the latest release
		if (version && String(version) !== appVersion) {
			console.log('New version available: ', version);
			if (!win) return;
			win.webContents.send('update_available', {version, platform});
		} 
	} catch (error) {
		console.error('Error fetching latest release version: ', error);
	}
};

// const { autoUpdater } = require('electron-updater');

// autoUpdater.logger = require('electron-log');
// autoUpdater.logger.transports.file.level = 'info';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
	win = new BrowserWindow({
		icon: path.join(process.env.VITE_PUBLIC, 'favicon.png'),
		minWidth: 800,
		minHeight: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});
	let platform = os.platform();
	

	if (isDev) {
		win.webContents.openDevTools();
	}
	// Test active push message to Renderer-process.
	win.webContents.on('did-finish-load', () => {
		win?.webContents.send('main-process-message', new Date().toLocaleString());
		if (platform === 'darwin') {
			win?.webContents.send('os', 'mac');
			checkVersion('mac');
		} else if (platform === 'win32') {
			win?.webContents.send('os', 'win');
			checkVersion('win');
		}
		
	});
	

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		// win.loadFile('dist/index.html')
		win.loadFile(path.join(process.env.DIST, 'index.html'));
	}
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	app.quit();
	win = null;
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});


ipcMain.on('download', (_, url) => {
	win?.webContents.downloadURL(url);
});


app.whenReady().then(() => {
	createWindow();
	new MainNiryo('10.10.10.10', win);
	// new MainNiryo('192.168.10.110', win);
	// new MainNiryo('51.83.12.237', win);
	// autoUpdater.checkForUpdatesAndNotify();
});

// autoUpdater.on('update-available', () => {
// 	if (!win) return;
// 	console.log('update_available');
//     win.webContents.send('update_available');
// });

// autoUpdater.on('update-downloaded', () => {
// 	if (!win) return;
//     win.webContents.send('update_downloaded');
// });
