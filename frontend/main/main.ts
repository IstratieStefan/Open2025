import { app, BrowserWindow } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import './scanner-ipc'; // Ensure IPC handlers are registered

const appServe = app.isPackaged
	? serve({ directory: path.join(__dirname, '../out') })
	: null;

const createWindow = (): void => {
	let preloadPath: string;
	preloadPath = path.join(__dirname, './preload.js');

	const win: BrowserWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: preloadPath
		}
	});

	if (app.isPackaged) {
		appServe!(win).then(() => {
			win.loadURL('app://-');
		});
	} else {
		win.loadURL('http://localhost:3000');
		win.webContents.openDevTools();
		win.webContents.on('did-fail-load', (_e, _code, _desc) => {
			win.webContents.reloadIgnoringCache();
		});
	}
};

app.on('ready', () => {
	createWindow();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
