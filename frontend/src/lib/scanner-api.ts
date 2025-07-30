declare global {
	interface Window {
		electronAPI: {
			on: (channel: string, callback: (...args: any[]) => void) => void;
			send: (channel: string, args?: any) => void;
		};
	}
}

export interface ScannerStatus {
	status: 'idle' | 'scanning' | 'paused' | 'error' | 'completed' | 'emergency_stop';
	progress: number;
	currentLayer: number;
	totalLayers: number;
	estimatedTime: string;
	error?: string;
}

export interface DeviceStatus {
	baseRotation: number;
	sensorRotation: number;
	distance: number;
	isConnected: boolean;
	lastUpdate: Date;
	scanning: boolean;
	emergencyStop: boolean;
}

export interface ScanVolume {
	width: number;
	height: number;
	depth: number;
}

export interface ExportOptions {
	format: 'stl' | 'obj' | 'ply' | 'glb' | 'gltf';
	fileName: string;
	quality: 'low' | 'medium' | 'high';
	includeTextures: boolean;
	includeColors: boolean;
}

type StatusCallback = (status: ScannerStatus) => void;
type DeviceStatusCallback = (status: DeviceStatus) => void;
type ErrorCallback = (error: string) => void;

class ScannerAPI {
	private statusCallbacks: StatusCallback[] = [];
	private deviceStatusCallbacks: DeviceStatusCallback[] = [];
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

	onError(callback: ErrorCallback) {
		this.errorCallbacks.push(callback);
		return () => {
			this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
		};
	}

	// Scanner Control Methods
	startScan(scanVolume: ScanVolume): void {
		window.electronAPI.send('scanner:start', { scanVolume });
	}

	pauseScan(): void {
		window.electronAPI.send('scanner:pause');
	}

	resumeScan(): void {
		window.electronAPI.send('scanner:resume');
	}

	resetScanner(): void {
		window.electronAPI.send('scanner:reset');
	}

	// Device Control Methods
	calibrateDevice(): void {
		window.electronAPI.send('device:calibrate');
	}

	moveSensorY(position: number): void {
		window.electronAPI.send('device:moveSensorY', { position });
	}

	rotatePlate(angle: number): void {
		window.electronAPI.send('device:rotatePlate', { angle });
	}

	getDeviceStatus(): DeviceStatus {
		// window.electronAPI.send('device:getStatus');

		return {
			baseRotation: 0,
			sensorRotation: 0,
			distance: 0,
			isConnected: true,
			lastUpdate: new Date(),
			scanning: false,
			emergencyStop: false
		}
	}

	emergencyStop(): void {
		console.log("Stopping");
		window.electronAPI.send('emergency:stop');
	}
}

export const scannerAPI = new ScannerAPI();