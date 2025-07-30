'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
const electron_1 = require('electron');
const electron_serve_1 = __importDefault(require('electron-serve'));
const path_1 = __importDefault(require('path'));
require('./scanner-ipc'); // Ensure IPC handlers are registered
const appServe = electron_1.app.isPackaged
	? (0, electron_serve_1.default)({
			directory: path_1.default.join(__dirname, '../out')
		})
	: null;
const createWindow = () => {
	let preloadPath;
	preloadPath = path_1.default.join(__dirname, './preload.js');
	console.log(preloadPath);
	const win = new electron_1.BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: preloadPath
		}
	});
	if (electron_1.app.isPackaged) {
		appServe(win).then(() => {
			win.loadURL('app://-');
		});
	} else {
		win.loadURL('http://localhost:3000');
		win.webContents.openDevTools();
		win.webContents.on('did-fail-load', (_e, _code, _desc) => {
			win.webContents.reloadIgnoringCache();
		});
	}
	console.log('Window created');
};
electron_1.app.on('ready', () => {
	createWindow();
});
electron_1.app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		electron_1.app.quit();
	}
});
