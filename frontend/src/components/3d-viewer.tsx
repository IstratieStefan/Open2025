'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, Grid, OrbitControls } from '@react-three/drei';
import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move3D, RotateCcw, ZoomIn } from 'lucide-react';

interface Model3DViewerProps {
	modelData?: any; // This would be the 3D scan data
	scanVolume?: {
		width: number;
		height: number;
		depth: number;
	};
}

function ScanVolume({
	width = 10,
	height = 10,
	depth = 10
}: {
	width?: number;
	height?: number;
	depth?: number;
}) {
	return (
		<mesh position={[0, height / 2, 0]}>
			<boxGeometry args={[width, height, depth]} />
			<meshStandardMaterial
				color='#3b82f6'
				transparent
				opacity={0.1}
				wireframe
			/>
		</mesh>
	);
}

function SampleModel() {
	return (
		<mesh position={[0, 0, 0]}>
			<sphereGeometry args={[2, 32, 32]} />
			<meshStandardMaterial color='#ef4444' />
		</mesh>
	);
}

export function Model3DViewer({
	modelData,
	scanVolume = { width: 10, height: 10, depth: 10 }
}: Model3DViewerProps) {
	const controlsRef = useRef<any>(null);
	const [resetTrigger, setResetTrigger] = useState(0);

	const resetCamera = () => {
		if (controlsRef.current) {
			controlsRef.current.reset();
			setResetTrigger((prev) => prev + 1);
		}
	};

	return (
		<Card className='h-full w-full overflow-hidden p-0'>
			<div className='relative h-full'>
				{/* 3D Canvas */}
				<Canvas
					camera={{ position: [15, 10, 15], fov: 60 }}
					className='h-full w-full'
				>
					<color attach='background' args={['#0f0f23']} />

					{/* Lighting */}
					<ambientLight intensity={0.4} />
					<directionalLight position={[10, 10, 5]} intensity={1} />

					{/* Environment for reflections */}
					<Environment preset='warehouse' />

					{/* Controls */}
					<OrbitControls
						ref={controlsRef}
						enablePan={true}
						enableZoom={true}
						enableRotate={true}
						minDistance={5}
						maxDistance={50}
						key={resetTrigger}
					/>

					{/* Grid */}
					<Grid
						args={[50, 50]}
						position={[0, -scanVolume.height / 2, 0]}
						cellColor='#333333'
						sectionColor='#666666'
					/>

					{/* Scan Volume Visualization */}
					<ScanVolume {...scanVolume} />

					{/* Sample Model (replace with actual scan data) */}
					{!modelData && <SampleModel />}

					{/* TODO: Render actual scan data when available */}
					{modelData && <primitive object={modelData} />}
				</Canvas>

				{/* Control Buttons Overlay */}
				<div className='absolute top-4 right-4 flex flex-col gap-2'>
					<Button
						variant='secondary'
						size='icon'
						onClick={resetCamera}
						className='bg-background/80 backdrop-blur-sm'
					>
						<RotateCcw className='h-4 w-4' />
					</Button>
				</div>

				{/* Info Overlay */}
				<div className='bg-background/80 absolute bottom-4 left-4 rounded-lg p-3 backdrop-blur-sm'>
					<div className='space-y-1 text-sm'>
						<div className='flex items-center gap-2'>
							<Move3D className='text-muted-foreground h-4 w-4' />
							<span className='text-muted-foreground'>
								Left click + drag to rotate
							</span>
						</div>
						<div className='flex items-center gap-2'>
							<ZoomIn className='text-muted-foreground h-4 w-4' />
							<span className='text-muted-foreground'>Scroll to zoom</span>
						</div>
						<div className='flex items-center gap-2'>
							<Move3D className='text-muted-foreground h-4 w-4' />
							<span className='text-muted-foreground'>
								Right click + drag to pan
							</span>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
