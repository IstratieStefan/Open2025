import { ipcMain, IpcMainEvent } from 'electron';
import { SerialHandler } from './serial-handler';
import { log } from 'console';

// Scanner state
let scannerState = {
  baseRotation: 0,
  sensorRotation: 0,
  distance: 0,
  scanning: false,
  emergencyStop: false,
  connected: true
};

// Process commands from the Pico
function processCommand(data: string) {
  const message = data.trim();
  
  if (message.startsWith('POS ')) {
    // Status update: "POS {base_rotation} {sensor_rotation} {distance}"
    const parts = message.split(' ');
    if (parts.length === 4) {
      scannerState.baseRotation = parseInt(parts[1]);
      scannerState.sensorRotation = parseInt(parts[2]);
      scannerState.distance = parseInt(parts[3]);
      
      // Send status update to frontend
      // TODO: Implement proper event emission to frontend
      console.log('Status update:', scannerState);
    }
  } else if (message.startsWith('OK')) {
    // Command executed successfully
    console.log('Command executed successfully');
  } else if (message.startsWith('ERROR ')) {
    // Error from Pico
    const error = message.substring(6);
    console.error('Pico error:', error);
    // TODO: Send error to frontend
  } else if (message.startsWith('STATUS ')) {
    // Status message from Pico
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
ipcMain.on('scanner:start', (event: IpcMainEvent, { scanVolume }) => {
  if (!scannerState.connected) {
    event.reply('scanner:error', 'Scanner not connected');
    return;
  }
  
  if (scannerState.scanning) {
    event.reply('scanner:error', 'Scan already in progress');
    return;
  }
  
  try {
    console.log('Starting scan');
    scannerState.scanning = true;
    event.reply('scanner:status', { status: 'scanning', progress: 0 });
  } catch (error) {
    event.reply('scanner:error', 'Failed to start scan');
  }
});

ipcMain.on('scanner:pause', (event: IpcMainEvent) => {
  if (!scannerState.connected) {
    event.reply('scanner:error', 'Scanner not connected');
    return;
  }
  
  try {
    console.log('Pausing scan');
    scannerState.scanning = false;
    event.reply('scanner:status', { status: 'paused' });
  } catch (error) {
    event.reply('scanner:error', 'Failed to pause scan');
  }
});

ipcMain.on('scanner:resume', (event: IpcMainEvent) => {
  if (!scannerState.connected) {
    event.reply('scanner:error', 'Scanner not connected');
    return;
  }
  
  try {
    console.log('Resuming scan');
    scannerState.scanning = true;
    event.reply('scanner:status', { status: 'scanning' });
  } catch (error) {
    event.reply('scanner:error', 'Failed to resume scan');
  }
});

ipcMain.on('scanner:reset', (event: IpcMainEvent) => {
  if (!scannerState.connected) {
    event.reply('scanner:error', 'Scanner not connected');
    return;
  }
  
  try {
    console.log('Resetting scanner');
    scannerState.scanning = false;
    scannerState.emergencyStop = false;
    event.reply('scanner:status', { status: 'idle' });
  } catch (error) {
    event.reply('scanner:error', 'Failed to reset scanner');
  }
});

ipcMain.on('device:moveSensorY', (event: IpcMainEvent, { position }) => {
  if (!scannerState.connected) {
    event.reply('scanner:error', 'Scanner not connected');
    return;
  }
  
  if (scannerState.scanning) {
    event.reply('scanner:error', 'Cannot move manually while scanning');
    return;
  }
  
  try {
    console.log('Moving sensor to', position);
    event.reply('device:status', { sensorRotation: position });
  } catch (error) {
    event.reply('scanner:error', 'Failed to move sensor');
  }
});

ipcMain.on('device:rotatePlate', (event: IpcMainEvent, { angle }) => {
  if (!scannerState.connected) {
    event.reply('scanner:error', 'Scanner not connected');
    return;
  }
  
  if (scannerState.scanning) {
    event.reply('scanner:error', 'Cannot move manually while scanning');
    return;
  }
  
  try {
    console.log('Rotating plate to', angle);
    event.reply('device:status', { baseRotation: angle });
  } catch (error) {
    event.reply('scanner:error', 'Failed to rotate plate');
  }
});

// Utility
ipcMain.on('status', (event: IpcMainEvent) => {
  if (scannerState.connected) {
    try {
      console.log('Status request received');
      event.reply('pong', { connected: true });
    } catch (error) {
      event.reply('pong', { connected: false, error: 'Connection failed' });
    }
  } else {
    event.reply('pong', { connected: false, error: 'Not connected' });
  }
});

ipcMain.on('emergency:stop', (event: IpcMainEvent) => {
  if (!scannerState.connected) {
    event.reply('scanner:error', 'Scanner not connected');
    return;
  }
  
  try {
    console.log('Emergency stop triggered');

    scannerState.scanning = false;
    scannerState.emergencyStop = true;
    event.reply('scanner:status', { status: 'emergency_stop' });
  } catch (error) {
    event.reply('scanner:error', 'Failed to emergency stop');
  }
});