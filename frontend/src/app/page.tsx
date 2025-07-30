'use client';

import { useEffect, useState } from 'react';
import { Model3DViewer } from '@/components/3d-viewer';
import { ScannerControls } from '@/components/scanner-controls';
import { ScanVolumeControls } from '@/components/scan-volume-controls';
import { DeviceMonitor } from '@/components/device-monitor';
import { ExportControls } from '@/components/export-controls';
import {
	type ExportOptions,
	scannerAPI,
	type ScannerStatus
} from '@/lib/scanner-api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Monitor, Scan, Settings } from 'lucide-react';

interface ScanVolume {
	width: number;
	height: number;
	depth: number;
}

export default function Dashboard() {
	// Scanner state
	const [scannerStatus, setScannerStatus] =
		useState<ScannerStatus['status']>('idle');
	const [scanProgress, setScanProgress] = useState(0);
	const [estimatedTime, setEstimatedTime] = useState('--:--');
	const [currentLayer, setCurrentLayer] = useState(0);
	const [totalLayers, setTotalLayers] = useState(100);

	// 3D model and scan volume state
	const [scanVolume, setScanVolume] = useState({
		width: 10,
		height: 10,
		depth: 10
	});
	const [modelData, setModelData] = useState<any>(null);

	// Export state
	const [isExporting, setIsExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState(0);

	// Real-time event listeners
	useEffect(() => {
		// Subscribe to scanner status updates
		const unsubscribeStatus = scannerAPI.onStatusUpdate((status) => {
			setScannerStatus(status.status);
			setScanProgress(status.progress);
			setCurrentLayer(status.currentLayer);
			setTotalLayers(status.totalLayers);
			setEstimatedTime(status.estimatedTime);
		});

		// Subscribe to device status updates
		const unsubscribeDevice = scannerAPI.onDeviceStatusUpdate(
			(deviceStatus) => {
				// Device status updates can be handled by the DeviceMonitor component
				console.log('Device status update:', deviceStatus);
			}
		);

		// Subscribe to scan data updates
		const unsubscribeScanData = scannerAPI.onScanDataUpdate((scanData) => {
			setModelData(scanData);
		});

		// Subscribe to error notifications
		const unsubscribeError = scannerAPI.onError((error) => {
			console.error('Scanner error:', error);
			setScannerStatus('error');
		});

		// Cleanup subscriptions
		return () => {
			unsubscribeStatus();
			unsubscribeDevice();
			unsubscribeScanData();
			unsubscribeError();
		};
	}, []);

	// Scanner control handlers
	const handleScanStart = async () => {
		const success = await scannerAPI.startScan(scanVolume);
		if (success) {
			setScannerStatus('scanning');
			setScanProgress(0);
			setCurrentLayer(0);
		}
	};

	const handleScanPause = async () => {
		if (scannerStatus === 'paused') {
			const success = await scannerAPI.resumeScan();
			if (success) {
				setScannerStatus('scanning');
			}
		} else {
			const success = await scannerAPI.pauseScan();
			if (success) {
				setScannerStatus('paused');
			}
		}
	};

	const handleScanStop = async () => {
		const success = await scannerAPI.stopScan();
		if (success) {
			setScannerStatus('idle');
			setScanProgress(0);
			setCurrentLayer(0);
			setEstimatedTime('--:--');
		}
	};

	const handleScanReset = async () => {
		const success = await scannerAPI.resetScanner();
		if (success) {
			setScannerStatus('idle');
			setScanProgress(0);
			setCurrentLayer(0);
			setEstimatedTime('--:--');
			setModelData(null);
		}
	};

	// Volume control handlers
	const handleVolumeChange = async (volume: any) => {
		setScanVolume(volume);
		// Update total layers based on volume
		const newTotalLayers = Math.ceil(
			(volume.width * volume.height * volume.depth) / 10
		);
		setTotalLayers(Math.max(50, Math.min(500, newTotalLayers)));

		// Update scan volume in backend
		await scannerAPI.updateScanVolume(volume);
	};

	const handleVolumeReset = async () => {
		const defaultVolume = { width: 10, height: 10, depth: 10 };
		setScanVolume(defaultVolume);
		setTotalLayers(100);
		await scannerAPI.updateScanVolume(defaultVolume);
	};

	// Export handlers
	const handleExport = async (
		options: ExportOptions,
		location: 'local' | 'cloud'
	): Promise<boolean> => {
		setIsExporting(true);
		setExportProgress(0);

		try {
			const success = await scannerAPI.exportModel(options, location);
			if (success) {
				// Monitor export progress
				const progressInterval = setInterval(async () => {
					const progress = await scannerAPI.getExportProgress();
					setExportProgress(progress);
					if (progress >= 100) {
						clearInterval(progressInterval);
						setIsExporting(false);
					}
				}, 500);
			}
			return success;
		} catch (error) {
			console.error('Export failed:', error);
			setIsExporting(false);
			setExportProgress(0);
			return false;
		}
	};

	return (
		<div className='bg-background min-h-screen'>
			{/* Header */}
			<header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex items-center gap-2'>
						<Scan className='h-6 w-6' />
						<h1 className='text-2xl font-bold'>3D Scanner Control Dashboard</h1>
					</div>
				</div>
			</header>

			{/* Main Dashboard */}
			<main className='container mx-auto px-4 py-6'>
				<div className='grid h-[calc(100vh-120px)] grid-cols-1 gap-6 xl:grid-cols-3'>
					{/* Left Panel - 3D Viewer */}
					<div className='xl:col-span-2'>
						<Model3DViewer modelData={modelData} scanVolume={scanVolume} />
					</div>

					{/* Right Panel - Controls */}
					<div className='xl:col-span-1'>
						<Tabs defaultValue='scanner' className='flex h-full flex-col'>
							<TabsList className='grid w-full grid-cols-4'>
								<TabsTrigger
									value='scanner'
									className='flex items-center gap-1'
								>
									<Scan className='h-4 w-4' />
									<span className='hidden sm:inline'>Scan</span>
								</TabsTrigger>
								<TabsTrigger value='volume' className='flex items-center gap-1'>
									<Settings className='h-4 w-4' />
									<span className='hidden sm:inline'>Volume</span>
								</TabsTrigger>
								<TabsTrigger
									value='monitor'
									className='flex items-center gap-1'
								>
									<Monitor className='h-4 w-4' />
									<span className='hidden sm:inline'>Monitor</span>
								</TabsTrigger>
								<TabsTrigger value='export' className='flex items-center gap-1'>
									<Download className='h-4 w-4' />
									<span className='hidden sm:inline'>Export</span>
								</TabsTrigger>
							</TabsList>

							<div className='mt-4 flex-1 overflow-auto'>
								<TabsContent value='scanner' className='mt-0 h-full'>
									<ScannerControls
										onStart={handleScanStart}
										onPause={handleScanPause}
										onStop={handleScanStop}
										onReset={handleScanReset}
										status={scannerStatus}
										progress={scanProgress}
										estimatedTime={estimatedTime}
										currentLayer={currentLayer}
										totalLayers={totalLayers}
									/>
								</TabsContent>

								<TabsContent value='volume' className='mt-0 h-full'>
									<ScanVolumeControls
										width={scanVolume.width}
										height={scanVolume.height}
										depth={scanVolume.depth}
										onVolumeChange={handleVolumeChange}
										onReset={handleVolumeReset}
										minSize={1}
										maxSize={50}
									/>
								</TabsContent>

								<TabsContent value='monitor' className='mt-0 h-full'>
									<DeviceMonitor />
								</TabsContent>

								<TabsContent value='export' className='mt-0 h-full'>
									<ExportControls
										modelData={modelData}
										onExport={handleExport}
										isExporting={isExporting}
										exportProgress={exportProgress}
									/>
								</TabsContent>
							</div>
						</Tabs>
					</div>
				</div>
			</main>
		</div>
	);
}
