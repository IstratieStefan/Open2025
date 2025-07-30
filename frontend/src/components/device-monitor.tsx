import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { type DeviceStatus } from '@/lib/scanner-api';
import {
	AlertOctagon,
	AlertTriangle,
	ArrowUpDown,
	Gauge,
	MapPin,
	RotateCcw,
	RotateCw,
	Wifi,
	WifiOff
} from 'lucide-react';

interface DeviceMonitorProps {
	deviceStatus?: DeviceStatus;
	maxSensorRange?: number;
	onCalibrate?: () => void;
	onMoveSensor?: (position: number) => void;
	onRotatePlate?: (angle: number) => void;
	onEmergencyStop?: () => void;
}

export function DeviceMonitor({
	deviceStatus,
	maxSensorRange = 100,
	onCalibrate = () => {},
	onMoveSensor = () => {},
	onRotatePlate = () => {},
	onEmergencyStop = () => {}
}: DeviceMonitorProps) {
	const [isCalibrating, setIsCalibrating] = useState(false);
	const [baseAngleInput, setBaseAngleInput] = useState('');
	const [sensorAngleInput, setSensorAngleInput] = useState('');

	// Use mock data if no real status is available
	const currentStatus = deviceStatus || {
		baseRotation: 0,
		sensorRotation: 50,
		distance: 0,
		isConnected: false,
		lastUpdate: new Date(),
		scanning: false,
		emergencyStop: false
	};

	const handleCalibrate = async () => {
		setIsCalibrating(true);
		try {
			await onCalibrate();
		} catch (error) {
			console.error('Calibration failed:', error);
		} finally {
			setIsCalibrating(false);
		}
	};

	const handleBaseRotation = (angle: number) => {
		onRotatePlate(angle);
	};

	const handleSensorMove = (position: number) => {
		onMoveSensor(position);
	};

	const handleSetBaseAngle = () => {
		const angle = parseFloat(baseAngleInput);
		if (!isNaN(angle)) {
			handleBaseRotation(angle);
			setBaseAngleInput('');
		}
	};

	const handleSetSensorAngle = () => {
		const angle = parseFloat(sensorAngleInput);
		if (!isNaN(angle)) {
			handleSensorMove(angle);
			setSensorAngleInput('');
		}
	};

	const getConnectionBadge = () => {
		if (currentStatus.isConnected) {
			return (
				<Badge variant='default' className='flex items-center gap-1'>
					<Wifi className='h-3 w-3' />
					Connected
				</Badge>
			);
		} else {
			return (
				<Badge variant='destructive' className='flex items-center gap-1'>
					<WifiOff className='h-3 w-3' />
					Disconnected
				</Badge>
			);
		}
	};

	const formatRotation = (angle: number) => {
		console.log(currentStatus);
		return `${angle.toFixed(1)}°`;
	};

	const formatPosition = (position: number) => {
		return `${position.toFixed(1)} mm`;
	};

	const timeSinceUpdate = () => {
		const now = new Date();
		const diffMs = now.getTime() - currentStatus.lastUpdate.getTime();
		const seconds = Math.floor(diffMs / 1000);

		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	};
	
	

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Gauge className='h-5 w-5' />
						Device Monitor
					</div>
					{getConnectionBadge()}
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Connection Status Alert */}
				{!currentStatus.isConnected && (
					<div className='bg-destructive/10 border-destructive/20 rounded-md border p-3'>
						<div className='flex items-center gap-2'>
							<AlertTriangle className='text-destructive h-4 w-4' />
							<span className='text-destructive text-sm'>
								Device connection lost. Check hardware connections.
							</span>
						</div>
					</div>
				)}

				{/* Emergency Stop Button */}
				<Button
					onClick={onEmergencyStop}
					variant='destructive'
					className='w-full'
				>
					<AlertOctagon className='mr-2 h-4 w-4' />
					Emergency Stop
				</Button>

				{/* Calibration Button */}
				<Button
					onClick={handleCalibrate}
					disabled={isCalibrating}
					variant='outline'
					className='w-full'
				>
					<RotateCcw className='mr-2 h-4 w-4' />
					{isCalibrating ? 'Calibrating...' : 'Calibrate Device'}
				</Button>

				{/* Base Rotation */}
				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<RotateCw className='text-muted-foreground h-4 w-4' />
							<span className='font-medium'>Base Rotation</span>
						</div>
						<span className='font-mono text-sm'>
							{formatRotation(currentStatus.baseRotation)}
						</span>
					</div>
					<div className='flex gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => handleBaseRotation(currentStatus.baseRotation - 5)}
						>
							-5°
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() => handleBaseRotation(currentStatus.baseRotation + 5)}
						>
							+5°
						</Button>
						<input
							type='number'
							value={baseAngleInput}
							onChange={(e) => setBaseAngleInput(e.target.value)}
							className='w-20 rounded border px-2'
							placeholder='Angle'
						/>
						<Button variant='outline' size='sm' onClick={handleSetBaseAngle}>
							Set
						</Button>
					</div>

					{/* Circular Progress Indicator */}
					<div className='flex justify-center'>
						<div className='relative h-24 w-24'>
							<svg
								className='h-full w-full -rotate-90 transform'
								viewBox='0 0 100 100'
							>
								{/* Background circle */}
								<circle
									cx='50'
									cy='50'
									r='45'
									stroke='currentColor'
									strokeWidth='4'
									fill='none'
									className='text-muted'
								/>
								{/* Progress circle */}
								<circle
									cx='50'
									cy='50'
									r='45'
									stroke='currentColor'
									strokeWidth='4'
									fill='none'
									strokeDasharray={`${(currentStatus.baseRotation / 360) * 283} 283`}
									className='text-primary'
								/>
								{/* Center dot */}
								<circle
									cx='50'
									cy='50'
									r='2'
									fill='currentColor'
									className='text-primary'
								/>
								{/* Position indicator */}
								<circle
									cx={
										50 +
										40 *
											Math.cos(
												((currentStatus.baseRotation - 90) * Math.PI) / 180
											)
									}
									cy={
										50 +
										40 *
											Math.sin(
												((currentStatus.baseRotation - 90) * Math.PI) / 180
											)
									}
									r='3'
									fill='currentColor'
									className='text-primary'
								/>
							</svg>
							<div className='absolute inset-0 flex items-center justify-center'>
								<span className='font-mono text-xs'>
									{formatRotation(currentStatus.baseRotation)}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Sensor Rotation */}
				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<ArrowUpDown className='text-muted-foreground h-4 w-4' />
							<span className='font-medium'>Sensor Rotation</span>
						</div>
						<span className='font-mono text-sm'>
							{formatRotation(currentStatus.sensorRotation)}
						</span>
					</div>

					<div className='space-y-2'>
						<Progress
							value={(currentStatus.sensorRotation / maxSensorRange) * 100}
							className='w-full'
						/>
						<div className='text-muted-foreground flex justify-between text-xs'>
							<span>0°</span>
							<span>{maxSensorRange}°</span>
						</div>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={() =>
									handleSensorMove(currentStatus.sensorRotation - 5)
								}
							>
								-5°
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={() =>
									handleSensorMove(currentStatus.sensorRotation + 5)
								}
							>
								+5°
							</Button>
							<input
								type='number'
								value={sensorAngleInput}
								onChange={(e) => setSensorAngleInput(e.target.value)}
								className='w-20 rounded border px-2'
								placeholder='Angle'
							/>
							<Button
								variant='outline'
								size='sm'
								onClick={handleSetSensorAngle}
							>
								Set
							</Button>
						</div>
					</div>
				</div>

				{/* Distance Reading */}
				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<MapPin className='text-muted-foreground h-4 w-4' />
							<span className='font-medium'>Distance</span>
						</div>
						<span className='font-mono text-sm'>
							{currentStatus.distance} mm
						</span>
					</div>
				</div>

				{/* System Information */}
				<div className='grid grid-cols-2 gap-4 border-t pt-4'>
					<div className='space-y-2'>
						<div className='text-muted-foreground text-sm'>Last Update</div>
						<div className='font-mono text-sm'>{timeSinceUpdate()}</div>
					</div>

					<div className='space-y-2'>
						<div className='text-muted-foreground text-sm'>Status</div>
						<div className='flex items-center gap-1'>
							<MapPin className='h-3 w-3' />
							<span className='text-sm'>
								{currentStatus.scanning
									? 'Scanning'
									: currentStatus.emergencyStop
										? 'Emergency Stop'
										: 'Active'}
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
