import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { type DeviceStatus } from '@/lib/scanner-api';
import { Terminal } from '@/components/terminal';
import { useLogging } from '@/lib/logging-context';
import {
	AlertOctagon,
	AlertTriangle,
	Gauge,
	MapPin,
	RotateCcw,
	Wifi,
	WifiOff
} from 'lucide-react';

interface DeviceMonitorProps {
	deviceStatus?: DeviceStatus;
	maxSensorRange?: number;
	onCalibrate?: () => void;
	onEmergencyStop?: () => void;
}

export function DeviceMonitor({
	deviceStatus,
	maxSensorRange = 100,
	onCalibrate = () => {},
	onEmergencyStop = () => {}
}: DeviceMonitorProps) {
	const [isCalibrating, setIsCalibrating] = useState(false);
	const { addInfo, addStatus, addError } = useLogging();

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
		addStatus('Starting device calibration...');
		try {
			await onCalibrate();
			addStatus('Device calibration completed successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			addError(`Calibration failed: ${errorMessage}`);
		} finally {
			setIsCalibrating(false);
		}
	};

	const handleTerminalCommand = (command: string) => {
		const [cmd, ...args] = command.toLowerCase().split(' ');
		
		switch (cmd) {
			case 'calibrate':
				handleCalibrate();
				break;
			case 'status':
				addInfo(`Device connected: ${currentStatus.isConnected}`);
				addInfo(`Base rotation: ${currentStatus.baseRotation}°`);
				addInfo(`Sensor rotation: ${currentStatus.sensorRotation}°`);
				addInfo(`Distance: ${currentStatus.distance}mm`);
				break;
			case 'emergency':
				onEmergencyStop();
				addError('Emergency stop activated');
				break;
			default:
				addInfo(`Available commands: calibrate, status, emergency`);
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



				{/* System Terminal */}
				<div className='min-h-92'>
					<Terminal onCommand={handleTerminalCommand} />
				</div>
			</CardContent>
		</Card>
	);
}
