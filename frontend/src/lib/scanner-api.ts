declare global {
	interface Window {
		electronAPI: {
			invoke: <T = any>(channel: string, args?: any) => Promise<T>;
		};
	}
}

export interface ScannerStatus {
	status:
		| 'idle'
		| 'scanning'
		| 'paused'
		| 'error'
		| 'completed'
		| 'emergency_stop';
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

	private setupEventListeners() {}

	// Event subscription methods
	onStatusUpdate(callback: StatusCallback) {
		this.statusCallbacks.push(callback);
		return () => {
			this.statusCallbacks = this.statusCallbacks.filter(
				(cb) => cb !== callback
			);
		};
	}

	onDeviceStatusUpdate(callback: DeviceStatusCallback) {
		this.deviceStatusCallbacks.push(callback);
		return () => {
			this.deviceStatusCallbacks = this.deviceStatusCallbacks.filter(
				(cb) => cb !== callback
			);
		};
	}

	onError(callback: ErrorCallback) {
		this.errorCallbacks.push(callback);
		return () => {
			this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
		};
	}

	// Scanner Control Methods
	startScan(scanVolume: ScanVolume): void {
		window.electronAPI.invoke('scanner:start', { scanVolume });
	}

	pauseScan(): void {
		window.electronAPI.invoke('scanner:pause');
	}

	resumeScan(): void {
		window.electronAPI.invoke('scanner:resume');
	}

	resetScanner(): void {
		window.electronAPI.invoke('scanner:reset');
	}

	// Device Control Methods
	calibrateDevice(): void {
		window.electronAPI.invoke('device:calibrate');
	}

	moveSensorY(position: number): void {
		window.electronAPI.invoke('device:moveSensorY', { position });
	}

	rotatePlate(angle: number): void {
		window.electronAPI.invoke('device:rotatePlate', { angle });
	}

	async getDeviceStatus(): Promise<{
		deviceStatus: DeviceStatus;
		scannedPoints: {
			radius: number;
			height: number;
			angle: number;
		}[];
	}> {
		const deviceStatus = await window.electronAPI.invoke('device:getStatus');

		const scannedPoints = await window.electronAPI.invoke('device:getScannedPoints');

		return {
			deviceStatus,
			scannedPoints
		};
	}

	emergencyStop(): void {
		console.log('Stopping');
		window.electronAPI.invoke('emergency:stop');
	}
}

export const scannerAPI = new ScannerAPI();
