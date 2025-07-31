import { ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import { SerialHandler } from './serial-handler';
import { credentials } from './credentials';

const serial = new SerialHandler(credentials, processCommand);

let scannedPoints: {
	height: number;
	radius: number;
	angle: number;
}[] = [];

// Scanner state
let scannerState = {
	baseRotation: 0,
	height: 0,
	distance: 0,
	scanning: false,
	emergencyStop: false,
	connected: true
};

function processCommand(data: string) {
	console.log(data);

	const message = data.trim();

	if (message.startsWith('POS ')) {
		// Status update: "POS {base_rotation} {sensor_rotation} {distance}"
		const parts = message.split(' ');
		if (parts.length === 4) {
			scannerState.baseRotation = parseInt(parts[1]);
			scannerState.height = parseInt(parts[2]);
			scannerState.distance = parseInt(parts[3]);

			console.log('Status update:', scannerState);
		}
	} else if (message.startsWith('POSX ')) {
		const parts = message.split(' ');

		if (parts.length === 4) {
			scannerState.baseRotation = parseInt(parts[1]);
			scannerState.height = parseInt(parts[2]);
			scannerState.distance = parseInt(parts[3]);

			if (parseInt(parts[2]) <= 122) {
				scannedPoints.push({
					angle: parseInt(parts[1]) * 1.8,
					height: parseInt(parts[2]) / 30,
					radius: (122 - parseInt(parts[3])) / 20
				});
			}
		}
	} else if (message.startsWith('OK')) {
		console.log('Command executed successfully');
	} else if (message.startsWith('ERROR ')) {
		const error = message.substring(6);
		console.error('Pico error:', error);
		// TODO: Send error to frontend
	} else if (message.startsWith('STATUS ')) {
		const status = message.substring(7);
		console.log('Pico status:', status);
		// TODO: Send status to frontend
	} else if (message === '3D Scanner Controller Ready') {
		console.log('Scanner ready');
		scannerState.connected = true;
	} else {
		console.log('Unknown message from Pico:', message);
	}
}

// Scanner Control
ipcMain.handle('scanner:start', (event: IpcMainInvokeEvent) => {
	if (!scannerState.connected) {
		// event.reply('scanner:error', 'Scanner not connected');
		return;
	}

	if (scannerState.scanning) {
		// event.reply('scanner:error', 'Scan already in progress');
		return;
	}

	console.log('Starting scan');
	scannerState.scanning = true;
	serial.sendCommand('scan');
});

ipcMain.handle('scanner:pause', (event: IpcMainInvokeEvent) => {
	if (!scannerState.connected) {
		return 'Scanner not connected';
	}

	serial.sendCommand('scan');
	console.log('Pausing scan');
	scannerState.scanning = false;
});

ipcMain.handle('scanner:resume', (event: IpcMainInvokeEvent) => {
	if (!scannerState.connected) {
		return;
	}

	serial.sendCommand('resume');
	console.log('Resuming scan');
	scannerState.scanning = true;
});

ipcMain.handle('scanner:reset', (event: IpcMainInvokeEvent) => {
	if (!scannerState.connected) {
		return;
	}

	console.log('Resetting scanner');
	scannerState.scanning = false;
	scannerState.emergencyStop = false;
	serial.sendCommand("reset");
});

ipcMain.on('device:moveSensorY', (event: IpcMainEvent, { position }) => {
	if (!scannerState.connected) {
		// event.reply('scanner:error', 'Scanner not connected');
		return;
	}

	if (scannerState.scanning) {
		return;
	}

	try {
		console.log('Moving sensor to', position);
		// event.reply('device:status', { sensorRotation: position });
	} catch (error) {
		// event.reply('scanner:error', 'Failed to move sensor');
	}
});

ipcMain.handle('device:rotatePlate', (event: IpcMainInvokeEvent, { angle }) => {
	if (!scannerState.connected) {
		// event.reply('scanner:error', 'Scanner not connected');
		return;
	}

	if (scannerState.scanning) {
		// event.reply('scanner:error', 'Cannot move manually while scanning');
		return;
	}

	try {
		console.log('Rotating plate to', angle);
		// event.reply('device:status', { baseRotation: angle });
	} catch (error) {
		// event.reply('scanner:error', 'Failed to rotate plate');
	}
});

// Utility
ipcMain.handle('device:getStatus', (event: IpcMainInvokeEvent) => {
	if (!scannerState.connected) {
		return;
	}

	return scannerState;
});

ipcMain.handle('device:getScannedPoints', (event: IpcMainInvokeEvent) => {
	const points = scannedPoints;

	scannedPoints = [];

	return points;
});

ipcMain.handle('emergency:stop', (event: IpcMainInvokeEvent) => {
	if (!scannerState.connected) {
		return;
	}

	console.log('Emergency stop triggered');

	scannerState.scanning = false;
	scannerState.emergencyStop = true;
	serial.sendCommand("stop");
});
