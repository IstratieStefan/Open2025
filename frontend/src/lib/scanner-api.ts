// Scanner API for Electron backend communication
// This module handles all IPC communication with the Electron main process

declare global {
	interface Window {
		electronAPI: {
			on: (channel: string, callback: (...args: any[]) => void) => void;
			send: (channel: string, args?: any) => void;
		};
	}
}

// Types for scanner operations
export interface ScannerStatus {
	status: 'idle' | 'scanning' | 'paused' | 'error' | 'completed';
	progress: number;
	currentLayer: number;
	totalLayers: number;
	estimatedTime: string;
	error?: string;
}

export interface DeviceStatus {
	sensorY: number;
	plateRotation: number;
	isConnected: boolean;
	lastUpdate: Date;
	batteryLevel?: number;
	temperature?: number;
}

export interface ScanVolume {
	width: number;
	height: number;
	depth: number;
}

export interface Point3D {
	x: number;
	y: number;
	z: number;
	color?: { r: number; g: number; b: number };
	normal?: { x: number; y: number; z: number };
}

export interface ScanData {
	points: Point3D[];
	metadata: {
		scanVolume: ScanVolume;
		timestamp: Date;
		resolution: number;
		totalPoints: number;
	};
}

export interface ExportOptions {
	format: 'stl' | 'obj' | 'ply' | 'glb' | 'gltf';
	fileName: string;
	quality: 'low' | 'medium' | 'high';
	includeTextures: boolean;
	includeColors: boolean;
}

// Event listeners for real-time updates
type StatusCallback = (status: ScannerStatus) => void;
type DeviceStatusCallback = (status: DeviceStatus) => void;
type ScanDataCallback = (data: ScanData) => void;
type ErrorCallback = (error: string) => void;

class ScannerAPI {
	private statusCallbacks: StatusCallback[] = [];
	private deviceStatusCallbacks: DeviceStatusCallback[] = [];
	private scanDataCallbacks: ScanDataCallback[] = [];
	private errorCallbacks: ErrorCallback[] = [];

	constructor() {
		this.setupEventListeners();
	}

	private setupEventListeners() {
		if (typeof window !== 'undefined' && window.electronAPI) {
			// Scanner status updates
			window.electronAPI.on('scanner:status', (status: ScannerStatus) => {
				this.statusCallbacks.forEach(callback => callback(status));
			});

			// Device status updates
			window.electronAPI.on('device:status', (status: DeviceStatus) => {
				this.deviceStatusCallbacks.forEach(callback => callback(status));
			});

			// Scan data updates (real-time point cloud)
			window.electronAPI.on('scan:data', (data: ScanData) => {
				this.scanDataCallbacks.forEach(callback => callback(data));
			});

			// Error notifications
			window.electronAPI.on('scanner:error', (error: string) => {
				this.errorCallbacks.forEach(callback => callback(error));
			});
		}
	}

	// Event subscription methods
	onStatusUpdate(callback: StatusCallback) {
		this.statusCallbacks.push(callback);
		return () => {
			this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
		};
	}

	onDeviceStatusUpdate(callback: DeviceStatusCallback) {
		this.deviceStatusCallbacks.push(callback);
		return () => {
			this.deviceStatusCallbacks = this.deviceStatusCallbacks.filter(cb => cb !== callback);
		};
	}

	onScanDataUpdate(callback: ScanDataCallback) {
		this.scanDataCallbacks.push(callback);
		return () => {
			this.scanDataCallbacks = this.scanDataCallbacks.filter(cb => cb !== callback);
		};
	}

	onError(callback: ErrorCallback) {
		this.errorCallbacks.push(callback);
		return () => {
			this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
		};
	}

	// Scanner Control Methods
	async startScan(scanVolume: ScanVolume): Promise<boolean> {
		try {
			window.electronAPI.send('scanner:start', { scanVolume });
			return true;
		} catch (error) {
			console.error('Failed to start scan:', error);
			return false;
		}
	}

	async pauseScan(): Promise<boolean> {
		try {
			window.electronAPI.send('scanner:pause');
			return true;
		} catch (error) {
			console.error('Failed to pause scan:', error);
			return false;
		}
	}

	async resumeScan(): Promise<boolean> {
		try {
			window.electronAPI.send('scanner:resume');
			return true;
		} catch (error) {
			console.error('Failed to resume scan:', error);
			return false;
		}
	}

	async stopScan(): Promise<boolean> {
		try {
			window.electronAPI.send('scanner:stop');
			return true;
		} catch (error) {
			console.error('Failed to stop scan:', error);
			return false;
		}
	}

	async resetScanner(): Promise<boolean> {
		try {
			window.electronAPI.send('scanner:reset');
			return true;
		} catch (error) {
			console.error('Failed to reset scanner:', error);
			return false;
		}
	}

	// Device Control Methods
	async calibrateDevice(): Promise<boolean> {
		try {
			window.electronAPI.send('device:calibrate');
			return true;
		} catch (error) {
			console.error('Failed to calibrate device:', error);
			return false;
		}
	}

	async moveSensorY(position: number): Promise<boolean> {
		try {
			window.electronAPI.send('device:moveSensorY', { position });
			return true;
		} catch (error) {
			console.error('Failed to move sensor Y:', error);
			return false;
		}
	}

	async rotatePlate(angle: number): Promise<boolean> {
		try {
			window.electronAPI.send('device:rotatePlate', { angle });
			return true;
		} catch (error) {
			console.error('Failed to rotate plate:', error);
			return false;
		}
	}

	async getDeviceStatus(): Promise<DeviceStatus | null> {
		try {
			window.electronAPI.send('device:getStatus');
			// TODO: Implement response handling with promise resolution
			return null;
		} catch (error) {
			console.error('Failed to get device status:', error);
			return null;
		}
	}

	// Scan Data Methods
	async getCurrentScanData(): Promise<ScanData | null> {
		try {
			window.electronAPI.send('scan:getData');
			// TODO: Implement response handling with promise resolution
			return null;
		} catch (error) {
			console.error('Failed to get scan data:', error);
			return null;
		}
	}

	async clearScanData(): Promise<boolean> {
		try {
			window.electronAPI.send('scan:clear');
			return true;
		} catch (error) {
			console.error('Failed to clear scan data:', error);
			return false;
		}
	}

	// Export Methods
	async exportModel(options: ExportOptions, location: 'local' | 'cloud'): Promise<boolean> {
		try {
			window.electronAPI.send('export:model', { options, location });
			return true;
		} catch (error) {
			console.error('Failed to export model:', error);
			return false;
		}
	}

	async getExportProgress(): Promise<number> {
		try {
			window.electronAPI.send('export:getProgress');
			// TODO: Implement response handling with promise resolution
			return 0;
		} catch (error) {
			console.error('Failed to get export progress:', error);
			return 0;
		}
	}

	// Configuration Methods
	async updateScanVolume(volume: ScanVolume): Promise<boolean> {
		try {
			window.electronAPI.send('config:updateVolume', { volume });
			return true;
		} catch (error) {
			console.error('Failed to update scan volume:', error);
			return false;
		}
	}

	async getScannerConfig(): Promise<any> {
		try {
			window.electronAPI.send('config:get');
			// TODO: Implement response handling with promise resolution
			return null;
		} catch (error) {
			console.error('Failed to get scanner config:', error);
			return null;
		}
	}

	// Connection Management
	async testConnection(): Promise<boolean> {
		try {
			window.electronAPI.send('connection:test');
			// TODO: Implement response handling with promise resolution
			return true;
		} catch (error) {
			console.error('Failed to test connection:', error);
			return false;
		}
	}

	async connectToDevice(deviceId?: string): Promise<boolean> {
		try {
			window.electronAPI.send('connection:connect', { deviceId });
			return true;
		} catch (error) {
			console.error('Failed to connect to device:', error);
			return false;
		}
	}

	async disconnectDevice(): Promise<boolean> {
		try {
			window.electronAPI.send('connection:disconnect');
			return true;
		} catch (error) {
			console.error('Failed to disconnect device:', error);
			return false;
		}
	}

	// Utility Methods
	async ping(): Promise<boolean> {
		try {
			window.electronAPI.send('ping');
			// TODO: Implement response handling with promise resolution
			return true;
		} catch (error) {
			console.error('Failed to ping backend:', error);
			return false;
		}
	}

	// TODO: Implement these methods when backend is ready
	async getScanHistory(): Promise<any[]> {
		// TODO: Implement scan history retrieval
		console.log('getScanHistory: To be implemented');
		return [];
	}

	async loadScanFromFile(filePath: string): Promise<ScanData | null> {
		// TODO: Implement loading scan from file
		console.log('loadScanFromFile: To be implemented');
		return null;
	}

	async saveScanToFile(filePath: string, format: string): Promise<boolean> {
		// TODO: Implement saving scan to file
		console.log('saveScanToFile: To be implemented');
		return false;
	}

	async getSystemInfo(): Promise<any> {
		// TODO: Implement system information retrieval
		console.log('getSystemInfo: To be implemented');
		return null;
	}

	async updateFirmware(): Promise<boolean> {
		// TODO: Implement firmware update
		console.log('updateFirmware: To be implemented');
		return false;
	}

	async emergencyStop(): Promise<boolean> {
		try {
			window.electronAPI.send('emergency:stop');
			return true;
		} catch (error) {
			console.error('Failed to emergency stop:', error);
			return false;
		}
	}
}

// Create singleton instance
export const scannerAPI = new ScannerAPI();

// Types are already exported above 