'use client';

import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState
} from 'react';
import {
	type DeviceStatus,
	type ExportOptions,
	scannerAPI,
	type ScannerStatus,
	type ScanVolume
} from './scanner-api';

interface ScannerContextType {
	scannerStatus: ScannerStatus['status'];
	scanProgress: number;
	estimatedTime: string;
	currentLayer: number;
	totalLayers: number;
	scanVolume: ScanVolume;
	deviceStatus: DeviceStatus | null;
	isExporting: boolean;
	exportProgress: number;
	handleScanStart: () => Promise<void>;
	handleScanPause: () => Promise<void>;
	handleScanStop: () => Promise<void>;
	handleScanReset: () => Promise<void>;
	handleVolumeChange: (volume: ScanVolume) => Promise<void>;
	handleVolumeReset: () => Promise<void>;
	handleEmergencyStop: () => Promise<void>;
	handleCalibrate: () => Promise<void>;
	handleMoveSensor: (position: number) => Promise<void>;
	handleRotatePlate: (angle: number) => Promise<void>;
	handleExport: (options: ExportOptions, location: 'local' | 'cloud') => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider = ({ children }: { children: ReactNode }) => {
	const [scannerStatus, setScannerStatus] =
		useState<ScannerStatus['status']>('idle');
	const [scanProgress, setScanProgress] = useState(0);
	const [estimatedTime, setEstimatedTime] = useState('--:--');
	const [currentLayer, setCurrentLayer] = useState(0);
	const [totalLayers, setTotalLayers] = useState(100);
	const [scanVolume, setScanVolume] = useState<ScanVolume>({
		width: 10,
		height: 10,
		depth: 10
	});
	const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState(0);

	useEffect(() => {
		// const unsubscribeStatus = scannerAPI.onStatusUpdate((status) => {
		// 	setScannerStatus(status.status);
		// 	setScanProgress(status.progress);
		// 	setCurrentLayer(status.currentLayer);
		// 	setTotalLayers(status.totalLayers);
		// 	setEstimatedTime(status.estimatedTime);
		// });

		// const unsubscribeDevice = scannerAPI.onStatusUpdate(
		// 	(deviceStatus) => {
		// 		setDeviceStatus(deviceStatus);
		// 		console.log('Set to: ', deviceStatus);
		// 	}
		// );

		const unsubscribeError = scannerAPI.onError((error) => {
			console.error('Scanner error:', error);
			setScannerStatus('error');
		});

		const status = scannerAPI.getDeviceStatus();

		setDeviceStatus(status);
		console.log('Set to: ', deviceStatus);

		return () => {
			// unsubscribeStatus();
			// unsubscribeDevice();
			unsubscribeError();
		};
	}, []);

	// Scanner control handlers
	const handleScanStart = async () => {
		scannerAPI.startScan(scanVolume);

		setScannerStatus('scanning');
		setScanProgress(0);
		setCurrentLayer(0);
	};

	const handleScanPause = async () => {
		scannerAPI.pauseScan();

		setScannerStatus('paused');
	};

	const handleScanStop = async () => {
		scannerAPI.emergencyStop();

		setScannerStatus('emergency_stop');
		setScanProgress(0);
		setCurrentLayer(0);
		setEstimatedTime('--:--');
	};

	const handleScanReset = async () => {
		scannerAPI.resetScanner();

		setScannerStatus('idle');
		setScanProgress(0);
		setCurrentLayer(0);
		setEstimatedTime('--:--');
	};

	// Volume control handlers
	const handleVolumeChange = async (volume: ScanVolume) => {
		setScanVolume(volume);
		const newTotalLayers = Math.ceil(
			(volume.width * volume.height * volume.depth) / 10
		);
		setTotalLayers(Math.max(50, Math.min(500, newTotalLayers)));
	};

	const handleVolumeReset = async () => {
		const defaultVolume = { width: 10, height: 10, depth: 10 };
		setScanVolume(defaultVolume);
		setTotalLayers(100);
	};

	// Device control handlers
	const handleEmergencyStop = async () => {
		scannerAPI.emergencyStop();
		setScannerStatus('emergency_stop');
	};

	const handleCalibrate = async () => {
		scannerAPI.calibrateDevice();
	};

	const handleMoveSensor = async (position: number) => {
		scannerAPI.moveSensorY(position);
	};

	const handleRotatePlate = async (angle: number) => {
		scannerAPI.rotatePlate(angle);
	};

	// Export handlers
	const handleExport = (
		options: ExportOptions,
		location: 'local' | 'cloud'
	) => {
		setIsExporting(true);
		setExportProgress(0);
	};

	return (
		<ScannerContext.Provider
			value={{
				scannerStatus,
				scanProgress,
				estimatedTime,
				currentLayer,
				totalLayers,
				scanVolume,
				deviceStatus,
				isExporting,
				exportProgress,
				handleScanStart,
				handleScanPause,
				handleScanStop,
				handleScanReset,
				handleVolumeChange,
				handleVolumeReset,
				handleEmergencyStop,
				handleCalibrate,
				handleMoveSensor,
				handleRotatePlate,
				handleExport
			}}
		>
			{children}
		</ScannerContext.Provider>
	);
};

export function useScanner() {
	const ctx = useContext(ScannerContext);
	if (!ctx) throw new Error('useScanner must be used within a ScannerProvider');
	return ctx;
}
