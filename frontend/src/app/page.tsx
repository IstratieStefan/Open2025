'use client';

import { Model3DViewer } from '@/components/3d-viewer';
import { ScannerControls } from '@/components/scanner-controls';
import { DeviceMonitor } from '@/components/device-monitor';
import { ExportControls } from '@/components/export-controls';
import { ModelEditor } from '@/components/model-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Monitor, Scan, Layers } from 'lucide-react';
import { useScanner } from '@/lib/scanner-context';

export default function Dashboard() {
	const {
		scannerStatus,
		scanProgress,
		estimatedTime,
		currentLayer,
		totalLayers,
		deviceStatus,
		isExporting,
		exportProgress,
		handleScanStart,
		handleScanPause,
		handleScanStop,
		handleScanReset,
		handleEmergencyStop,
		handleCalibrate,
		handleMoveSensor,
		handleRotatePlate,
		handleExport
	} = useScanner();

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
						<Model3DViewer />
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
															<TabsTrigger value='model' className='flex items-center gap-1'>
								<Layers className='h-4 w-4' />
								<span className='hidden sm:inline'>Model</span>
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
										status={scannerStatus as any}
										progress={scanProgress}
										estimatedTime={estimatedTime}
										currentLayer={currentLayer}
										totalLayers={totalLayers}
										baseRotation={deviceStatus?.baseRotation || 0}
										sensorRotation={deviceStatus?.sensorRotation || 50}
										onRotateBase={handleRotatePlate}
										onMoveSensor={handleMoveSensor}
									/>
															</TabsContent>

							<TabsContent value='model' className='mt-0 h-full'>
								<ModelEditor />
							</TabsContent>

							<TabsContent value='monitor' className='mt-0 h-full'>
									<DeviceMonitor
										deviceStatus={deviceStatus || undefined}
										onCalibrate={handleCalibrate}
										onEmergencyStop={handleEmergencyStop}
									/>
								</TabsContent>

								<TabsContent value='export' className='mt-0 h-full'>
									<ExportControls
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
