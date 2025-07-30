'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box, Maximize, Minimize, RotateCcw } from 'lucide-react';

interface ScanVolumeControlsProps {
	width?: number;
	height?: number;
	depth?: number;
	onVolumeChange?: (volume: {
		width: number;
		height: number;
		depth: number;
	}) => void;
	onReset?: () => void;
	minSize?: number;
	maxSize?: number;
}

export function ScanVolumeControls({
	width = 10,
	height = 10,
	depth = 10,
	onVolumeChange = () => {},
	onReset = () => {},
	minSize = 1,
	maxSize = 50
}: ScanVolumeControlsProps) {
	const updateDimension = (
		dimension: 'width' | 'height' | 'depth',
		value: number
	) => {
		const newVolume = {
			width: dimension === 'width' ? value : width,
			height: dimension === 'height' ? value : height,
			depth: dimension === 'depth' ? value : depth
		};
		onVolumeChange(newVolume);
	};

	const handleSliderChange =
		(dimension: 'width' | 'height' | 'depth') => (values: number[]) => {
			updateDimension(dimension, values[0]);
		};

	const handleInputChange =
		(dimension: 'width' | 'height' | 'depth') =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = parseFloat(e.target.value);
			if (!isNaN(value) && value >= minSize && value <= maxSize) {
				updateDimension(dimension, value);
			}
		};

	const handlePresetSize = (size: 'small' | 'medium' | 'large') => {
		const presets = {
			small: { width: 5, height: 5, depth: 5 },
			medium: { width: 15, height: 15, depth: 15 },
			large: { width: 30, height: 30, depth: 30 }
		};
		onVolumeChange(presets[size]);
	};

	const handleReset = () => {
		onVolumeChange({ width: 10, height: 10, depth: 10 });
		onReset();
	};

	const totalVolume = (width * height * depth).toFixed(1);

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Box className='h-5 w-5' />
					Scan Volume
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Volume Statistics */}
				<div className='bg-muted/50 grid grid-cols-2 gap-4 rounded-lg p-3'>
					<div className='text-center'>
						<div className='text-2xl font-bold'>{totalVolume}</div>
						<div className='text-muted-foreground text-sm'>cm³</div>
					</div>
					<div className='text-center'>
						<div className='text-lg font-semibold'>
							{width}×{height}×{depth}
						</div>
						<div className='text-muted-foreground text-sm'>W×H×D (cm)</div>
					</div>
				</div>

				{/* Dimension Controls */}
				<div className='space-y-4'>
					{/* Width */}
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label htmlFor='width'>Width (cm)</Label>
							<Input
								id='width'
								type='number'
								value={width}
								onChange={handleInputChange('width')}
								min={minSize}
								max={maxSize}
								step={0.1}
								className='h-8 w-20'
							/>
						</div>
						<Slider
							value={[width]}
							onValueChange={handleSliderChange('width')}
							min={minSize}
							max={maxSize}
							step={0.1}
							className='w-full'
						/>
					</div>

					{/* Height */}
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label htmlFor='height'>Height (cm)</Label>
							<Input
								id='height'
								type='number'
								value={height}
								onChange={handleInputChange('height')}
								min={minSize}
								max={maxSize}
								step={0.1}
								className='h-8 w-20'
							/>
						</div>
						<Slider
							value={[height]}
							onValueChange={handleSliderChange('height')}
							min={minSize}
							max={maxSize}
							step={0.1}
							className='w-full'
						/>
					</div>

					{/* Depth */}
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label htmlFor='depth'>Depth (cm)</Label>
							<Input
								id='depth'
								type='number'
								value={depth}
								onChange={handleInputChange('depth')}
								min={minSize}
								max={maxSize}
								step={0.1}
								className='h-8 w-20'
							/>
						</div>
						<Slider
							value={[depth]}
							onValueChange={handleSliderChange('depth')}
							min={minSize}
							max={maxSize}
							step={0.1}
							className='w-full'
						/>
					</div>
				</div>

				{/* Preset Buttons */}
				<div className='space-y-2'>
					<Label>Quick Presets</Label>
					<div className='flex gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => handlePresetSize('small')}
							className='flex-1'
						>
							<Minimize className='mr-1 h-4 w-4' />
							Small
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() => handlePresetSize('medium')}
							className='flex-1'
						>
							<Box className='mr-1 h-4 w-4' />
							Medium
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() => handlePresetSize('large')}
							className='flex-1'
						>
							<Maximize className='mr-1 h-4 w-4' />
							Large
						</Button>
					</div>
				</div>

				{/* Reset Button */}
				<Button variant='secondary' onClick={handleReset} className='w-full'>
					<RotateCcw className='mr-2 h-4 w-4' />
					Reset to Default
				</Button>

				{/* Volume Limits Warning */}
				{width * height * depth > 1000 && (
					<div className='rounded-md border border-amber-500/20 bg-amber-500/10 p-3'>
						<p className='text-sm text-amber-700 dark:text-amber-400'>
							Large scan volumes may require longer scan times and more storage
							space.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
