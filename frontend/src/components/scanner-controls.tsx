import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useLogging } from '@/lib/logging-context';
import {
	Activity,
	ArrowUpDown,
	Clock,
	Layers,
	Pause,
	Play,
	RotateCcw,
	RotateCw,
	Square
} from 'lucide-react';

export type ScannerStatus =
	| 'idle'
	| 'scanning'
	| 'paused'
	| 'emergency_stop'
	| 'error'
	| 'completed';

interface ScannerControlsProps {
	onStart?: () => void;
	onPause?: () => void;
	onStop?: () => void;
	onReset?: () => void;
	status?: ScannerStatus;
	progress?: number;
	estimatedTime?: string;
	currentLayer?: number;
	totalLayers?: number;
	// Sensor control props
	baseRotation?: number;
	sensorRotation?: number;
	maxSensorRange?: number;
	onRotateBase?: (angle: number) => void;
	onMoveSensor?: (position: number) => void;
}

const statusConfig = {
	idle: { label: 'Ready', color: 'default' as const, icon: Activity },
	scanning: { label: 'Scanning', color: 'default' as const, icon: Activity },
	paused: { label: 'Paused', color: 'secondary' as const, icon: Pause },
	error: { label: 'Error', color: 'destructive' as const, icon: Activity },
	completed: { label: 'Completed', color: 'default' as const, icon: Activity },
	emergency_stop: {
		label: 'Emergency Stop',
		color: 'destructive' as const,
		icon: Activity
	}
};

export function ScannerControls({
	onStart = () => {},
	onPause = () => {},
	onStop = () => {},
	onReset = () => {},
	status = 'idle',
	progress = 0,
	estimatedTime = '--:--',
	currentLayer = 0,
	totalLayers = 100,
	baseRotation = 0,
	sensorRotation = 50,
	maxSensorRange = 100,
	onRotateBase = () => {},
	onMoveSensor = () => {}
}: ScannerControlsProps) {
	const [isScanning, setIsScanning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [baseAngleInput, setBaseAngleInput] = useState('');
	const [sensorAngleInput, setSensorAngleInput] = useState('');
	const { addStatus, addInfo, addError } = useLogging();

	const handleStart = () => {
		setIsScanning(true);
		setIsPaused(false);
		addStatus('Scan started');
		addInfo(`Starting scan with ${totalLayers} layers`);
		onStart();
	};

	const handlePause = () => {
		setIsPaused(!isPaused);
		addStatus(isPaused ? 'Scan resumed' : 'Scan paused');
		onPause();
	};

	const handleStop = () => {
		setIsScanning(false);
		setIsPaused(false);
		addStatus('Scan stopped');
		addInfo('Scan operation terminated by user');
		onStop();
	};

	const handleReset = () => {
		setIsScanning(false);
		setIsPaused(false);
		addInfo('Scanner reset to initial state');
		onReset();
	};

	// Helper functions for sensor controls
	const formatRotation = (angle: number) => `${angle.toFixed(1)}°`;

	const handleBaseRotation = (angle: number) => {
		addInfo(`Base rotation set to ${formatRotation(angle)}`);
		onRotateBase(angle);
	};

	const handleSensorMove = (position: number) => {
		addInfo(`Sensor position set to ${formatRotation(position)}`);
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

	const config = statusConfig[status];
	const StatusIcon = config.icon;

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					Scanner Controls
					<Badge variant={config.color} className='flex items-center gap-1'>
						<StatusIcon className='h-3 w-3' />
						{config.label}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* Control Buttons */}
				<div className='flex flex-wrap gap-2'>
					<Button
						onClick={handleStart}
						disabled={isScanning && !isPaused}
						className='min-w-[80px] flex-1'
						variant={isScanning && !isPaused ? 'secondary' : 'default'}
					>
						<Play className='mr-2 h-4 w-4' />
						Start
					</Button>

					<Button
						onClick={handlePause}
						disabled={!isScanning}
						variant='secondary'
						className='min-w-[80px] flex-1'
					>
						<Pause className='mr-2 h-4 w-4' />
						{isPaused ? 'Resume' : 'Pause'}
					</Button>

					<Button
						onClick={handleStop}
						disabled={!isScanning}
						variant='destructive'
						className='min-w-[80px] flex-1'
					>
						<Square className='mr-2 h-4 w-4' />
						Stop
					</Button>

					<Button
						onClick={handleReset}
						variant='outline'
						className='min-w-[80px] flex-1'
					>
						<RotateCcw className='mr-2 h-4 w-4' />
						Reset
					</Button>
				</div>

				{/* Progress Section */}
				{(isScanning || status === 'completed') && (
					<div className='space-y-3'>
						<div className='flex justify-between text-sm'>
							<span>Progress</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<Progress value={progress} className='w-full' />

						<div className='grid grid-cols-2 gap-4 text-sm'>
							<div className='flex items-center gap-2'>
								<Clock className='text-muted-foreground h-4 w-4' />
								<span className='text-muted-foreground'>Est. Time:</span>
								<span className='font-mono'>{estimatedTime}</span>
							</div>

							<div className='flex items-center gap-2'>
								<Layers className='text-muted-foreground h-4 w-4' />
								<span className='text-muted-foreground'>Layer:</span>
								<span className='font-mono'>
									{currentLayer}/{totalLayers}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Status Messages */}
				{status === 'error' && (
					<div className='bg-destructive/10 border-destructive/20 rounded-md border p-3'>
						<p className='text-destructive text-sm'>
							Scanner error detected. Please check hardware connections and try
							again.
						</p>
					</div>
				)}

				{status === 'completed' && (
					<div className='rounded-md border border-green-500/20 bg-green-500/10 p-3'>
						<p className='text-sm text-green-700 dark:text-green-400'>
							Scan completed successfully! You can now export or save your
							model.
						</p>
					</div>
				)}

				{/* Sensor Controls Section */}
				<div className='space-y-4 border-t pt-4'>
					<h4 className='text-sm font-medium'>Sensor Controls</h4>
					
					{/* Base Rotation */}
					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<RotateCw className='text-muted-foreground h-4 w-4' />
								<span className='font-medium'>Base Rotation</span>
							</div>
							<span className='font-mono text-sm'>
								{formatRotation(baseRotation)}
							</span>
						</div>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => handleBaseRotation(baseRotation - 5)}
							>
								-5°
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={() => handleBaseRotation(baseRotation + 5)}
							>
								+5°
							</Button>
							<Input
								type='number'
								value={baseAngleInput}
								onChange={(e) => setBaseAngleInput(e.target.value)}
								className='w-20'
								placeholder='Angle'
							/>
							<Button variant='outline' size='sm' onClick={handleSetBaseAngle}>
								Set
							</Button>
						</div>

						{/* Circular Progress Indicator */}
						<div className='flex justify-center'>
							<div className='relative h-20 w-20'>
								<svg
									className='h-full w-full -rotate-90 transform'
									viewBox='0 0 100 100'
								>
									{/* Background circle */}
									<circle
										cx='50'
										cy='50'
										r='40'
										stroke='currentColor'
										strokeWidth='6'
										fill='none'
										className='text-muted'
									/>
									{/* Progress circle */}
									<circle
										cx='50'
										cy='50'
										r='40'
										stroke='currentColor'
										strokeWidth='6'
										fill='none'
										strokeDasharray={`${(baseRotation / 360) * 251} 251`}
										className='text-primary'
									/>
									{/* Position indicator */}
									<circle
										cx={
											50 +
											35 *
												Math.cos(
													((baseRotation - 90) * Math.PI) / 180
												)
										}
										cy={
											50 +
											35 *
												Math.sin(
													((baseRotation - 90) * Math.PI) / 180
												)
										}
										r='3'
										fill='currentColor'
										className='text-primary'
									/>
								</svg>
								<div className='absolute inset-0 flex items-center justify-center'>
									<span className='font-mono text-xs'>
										{formatRotation(baseRotation)}
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
								{formatRotation(sensorRotation)}
							</span>
						</div>

						<div className='space-y-2'>
							<Progress
								value={(sensorRotation / maxSensorRange) * 100}
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
										handleSensorMove(sensorRotation - 5)
									}
								>
									-5°
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										handleSensorMove(sensorRotation + 5)
									}
								>
									+5°
								</Button>
								<Input
									type='number'
									value={sensorAngleInput}
									onChange={(e) => setSensorAngleInput(e.target.value)}
									className='w-20'
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
				</div>
			</CardContent>
		</Card>
	);
}
