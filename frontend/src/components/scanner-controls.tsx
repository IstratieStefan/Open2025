import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
	Activity,
	Clock,
	Layers,
	Pause,
	Play,
	RotateCcw,
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
	totalLayers = 100
}: ScannerControlsProps) {
	const [isScanning, setIsScanning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);

	const handleStart = () => {
		setIsScanning(true);
		setIsPaused(false);
		onStart();
	};

	const handlePause = () => {
		setIsPaused(!isPaused);
		onPause();
	};

	const handleStop = () => {
		setIsScanning(false);
		setIsPaused(false);
		onStop();
	};

	const handleReset = () => {
		setIsScanning(false);
		setIsPaused(false);
		onReset();
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
			</CardContent>
		</Card>
	);
}
