'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, Grid, OrbitControls } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dot, Grid3X3, Move3D, RotateCcw, ZoomIn, Circle, Square, Zap } from 'lucide-react';

interface ScanPoint {
	azimuth: number;
	polar: number;
	distance: number;
}

interface ScanSlice {
	height: number; // Y coordinate of this slice
	points: ScanPoint[];
}

interface Model3DViewerProps {
	modelData?: ScanSlice[]; // Array of scan slices, each containing points at a specific height
	scanVolume?: {
		width: number;
		height: number;
		depth: number;
	};
	showPoints?: boolean; // Show point cloud
	showFaces?: boolean; // Show solid faces
	showEdges?: boolean; // Show edges/wireframe
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

const CLOUD_RADIUS = 5;

// Reference sphere to visualize the scanning volume
function ReferenceSphere() {
	return (
		<mesh position={[0, 0, 0]} renderOrder={-1}>
			<sphereGeometry args={[CLOUD_RADIUS, 32, 32]} />
			<meshStandardMaterial
				color='#ffffff'
				transparent
				opacity={0.05}
				wireframe={true}
				depthWrite={false}
			/>
		</mesh>
	);
}

// Helper function to convert spherical to Cartesian coordinates
function sphericalToCartesian(
	azimuth: number,
	polar: number,
	distance: number,
	height: number
): [number, number, number] {
	const theta = ((polar) * Math.PI) / 180; // polar angle from vertical
	const phi = (azimuth * Math.PI) / 180; // azimuth angle from x-axis
	const r = CLOUD_RADIUS - distance;
	const x = r * Math.sin(theta) * Math.cos(phi);
	const y = height; // Use the slice height directly
	const z = r * Math.sin(theta) * Math.sin(phi);
	return [x, y, z];
}

// PointCloud component: renders points from scan slices
function PointCloud({ slices }: { slices: ScanSlice[] }) {
	const positions = useMemo(() => {
		return slices.flatMap((slice) =>
			slice.points.flatMap((point) =>
				sphericalToCartesian(
					point.azimuth,
					point.polar,
					point.distance,
					slice.height
				)
			)
		);
	}, [slices]);

	const positionsArray = useMemo(
		() => new Float32Array(positions),
		[positions]
	);

	return (
		<points>
			<bufferGeometry>
				<bufferAttribute
					attach='attributes-position'
					args={[positionsArray, 3]}
				/>
			</bufferGeometry>
			<pointsMaterial size={0.15} color='#00ff99' sizeAttenuation />
		</points>
	);
}

// Helper function to triangulate a slice (create faces within a slice)
function triangulateSlice(pointCount: number, startIndex: number, reverse: boolean = false): number[] {
	if (pointCount < 3) return [];
	
	const indices: number[] = [];
	
	// Create a fan triangulation from the first point
	for (let i = 1; i < pointCount - 1; i++) {
		if (reverse) {
			// Reverse winding for bottom faces
			indices.push(startIndex, startIndex + i + 1, startIndex + i);
		} else {
			// Normal winding for top faces  
			indices.push(startIndex, startIndex + i, startIndex + i + 1);
		}
	}
	
	return indices;
}

// Helper function to connect two slices with different point counts
function connectSlices(
	slice1Start: number, 
	slice1Count: number,
	slice2Start: number, 
	slice2Count: number
): number[] {
	const indices: number[] = [];
	
	if (slice1Count === 1 && slice2Count > 1) {
		// Single point to multiple points (like pyramid tip to base)
		const apex = slice1Start;
		for (let i = 0; i < slice2Count; i++) {
			const next = (i + 1) % slice2Count;
			indices.push(apex, slice2Start + i, slice2Start + next);
		}
	} else if (slice1Count > 1 && slice2Count === 1) {
		// Multiple points to single point (like base to pyramid tip)
		const apex = slice2Start;
		for (let i = 0; i < slice1Count; i++) {
			const next = (i + 1) % slice1Count;
			indices.push(slice1Start + i, apex, slice1Start + next);
		}
	} else if (slice1Count === slice2Count) {
		// Equal point counts - create quads
		for (let i = 0; i < slice1Count; i++) {
			const next = (i + 1) % slice1Count;
			
			const a = slice1Start + i;
			const b = slice1Start + next;
			const c = slice2Start + i;
			const d = slice2Start + next;
			
			// Triangle 1: a, c, b
			indices.push(a, c, b);
			// Triangle 2: b, c, d  
			indices.push(b, c, d);
		}
	} else {
		// Different point counts - interpolate connections
		const ratio1 = slice1Count / Math.max(slice1Count, slice2Count);
		const ratio2 = slice2Count / Math.max(slice1Count, slice2Count);
		
		for (let i = 0; i < Math.max(slice1Count, slice2Count); i++) {
			const idx1 = Math.floor((i * ratio1) % slice1Count);
			const idx2 = Math.floor((i * ratio2) % slice2Count);
			const next1 = (idx1 + 1) % slice1Count;
			const next2 = (idx2 + 1) % slice2Count;
			
			const a = slice1Start + idx1;
			const b = slice1Start + next1;
			const c = slice2Start + idx2;
			const d = slice2Start + next2;
			
			indices.push(a, c, b);
			if (next2 !== idx2) {
				indices.push(b, c, d);
			}
		}
	}
	
	return indices;
}

// Helper function to generate mesh geometry data
function generateMeshGeometry(slices: ScanSlice[]) {
	if (slices.length === 0) return { vertices: [], indices: [] };

	const vertices: number[] = [];
	const indices: number[] = [];

	// Convert all points to vertices and track slice info
	const sliceInfo: { start: number; count: number }[] = [];
	let currentVertexIndex = 0;
	
	slices.forEach((slice) => {
		const sliceStart = currentVertexIndex;
		const sliceCount = slice.points.length;
		
		slice.points.forEach((point) => {
			const [x, y, z] = sphericalToCartesian(
				point.azimuth,
				point.polar,
				point.distance,
				slice.height
			);
			vertices.push(x, y, z);
			currentVertexIndex++;
		});
		
		sliceInfo.push({ start: sliceStart, count: sliceCount });
	});

	// Create faces within each slice (top and bottom caps)
	sliceInfo.forEach((slice, sliceIndex) => {
		if (slice.count >= 3) {
			if (sliceIndex === 0) {
				// Bottom slice - reverse winding
				indices.push(...triangulateSlice(slice.count, slice.start, true));
			} else if (sliceIndex === sliceInfo.length - 1) {
				// Top slice - normal winding
				indices.push(...triangulateSlice(slice.count, slice.start, false));
			}
		}
	});

	// Create side faces between adjacent slices
	for (let i = 0; i < sliceInfo.length - 1; i++) {
		const currentSlice = sliceInfo[i];
		const nextSlice = sliceInfo[i + 1];
		
		const connectionIndices = connectSlices(
			currentSlice.start,
			currentSlice.count,
			nextSlice.start,
			nextSlice.count
		);
		
		indices.push(...connectionIndices);
	}

	return { vertices, indices };
}

// Solid faces component
function MeshFaces({ slices }: { slices: ScanSlice[] }) {
	const { vertices, indices } = useMemo(() => generateMeshGeometry(slices), [slices]);
	const verticesArray = useMemo(() => new Float32Array(vertices), [vertices]);
	const indicesArray = useMemo(() => new Uint16Array(indices), [indices]);

	if (vertices.length === 0) return null;

	return (
		<mesh renderOrder={1}>
			<bufferGeometry>
				<bufferAttribute
					attach='attributes-position'
					args={[verticesArray, 3]}
				/>
				<bufferAttribute attach='index' args={[indicesArray, 1]} />
			</bufferGeometry>
			<meshStandardMaterial
				color='#4f46e5'
				side={2} // DoubleSide
			/>
		</mesh>
	);
}

// Wireframe edges component
function MeshEdges({ slices }: { slices: ScanSlice[] }) {
	const { vertices, indices } = useMemo(() => generateMeshGeometry(slices), [slices]);
	const verticesArray = useMemo(() => new Float32Array(vertices), [vertices]);
	const indicesArray = useMemo(() => new Uint16Array(indices), [indices]);

	if (vertices.length === 0) return null;

	return (
		<mesh renderOrder={2}>
			<bufferGeometry>
				<bufferAttribute
					attach='attributes-position'
					args={[verticesArray, 3]}
				/>
				<bufferAttribute attach='index' args={[indicesArray, 1]} />
			</bufferGeometry>
			<meshStandardMaterial
				color='#ff6b35'
				wireframe={true}
				side={2} // DoubleSide
			/>
		</mesh>
	);
}

export function Model3DViewer({
	modelData,
	scanVolume = { width: 10, height: 10, depth: 10 },
	showPoints: initialShowPoints = true,
	showFaces: initialShowFaces = true,
	showEdges: initialShowEdges = false
}: Model3DViewerProps) {
	const controlsRef = useRef<any>(null);
	const [resetTrigger, setResetTrigger] = useState(0);
	const [showPoints, setShowPoints] = useState(initialShowPoints);
	const [showFaces, setShowFaces] = useState(initialShowFaces);
	const [showEdges, setShowEdges] = useState(initialShowEdges);
	const [showReferenceSphere, setShowReferenceSphere] = useState(true);

	const resetCamera = () => {
		if (controlsRef.current) {
			controlsRef.current.reset();
			setResetTrigger((prev) => prev + 1);
		}
	};

	// Example tetrahedron data - 4 slices with points forming a tetrahedron
	const exampleTetrahedron: ScanSlice[] = [
		{
			height: 0,
			points: [
				{
					azimuth: (-2.356194490192345 * 180) / Math.PI,
					polar: (1.5707963267948966 * 180) / Math.PI,
					distance: 3.585786437626905
				},
				{
					azimuth: (-0.7853981633974483 * 180) / Math.PI,
					polar: (1.5707963267948966 * 180) / Math.PI,
					distance: 3.585786437626905
				},
				{
					azimuth: (0.7853981633974483 * 180) / Math.PI,
					polar: (1.5707963267948966 * 180) / Math.PI,
					distance: 3.585786437626905
				},
				{
					azimuth: (2.356194490192345 * 180) / Math.PI,
					polar: (1.5707963267948966 * 180) / Math.PI,
					distance: 3.585786437626905
				}
			]
		},
		{
			height: 1,
			points: [
				{ azimuth: 0, polar: 0, distance: 2 }
			]
		}
	];

	// Use example data if no real data is provided
	const dataToRender = modelData || exampleTetrahedron;

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

					{/* Reference sphere to show scanning volume */}
					{showReferenceSphere && <ReferenceSphere />}

					{/* Sample Model (only show if no data) */}
					{!dataToRender && <SampleModel />}

					{/* Render scan data */}
					{dataToRender && dataToRender.length > 0 && (
						<>
							{/* Show point cloud if requested */}
							{showPoints && <PointCloud slices={dataToRender} />}

							{/* Show solid faces if requested */}
							{showFaces && <MeshFaces slices={dataToRender} />}

							{/* Show wireframe edges if requested */}
							{showEdges && <MeshEdges slices={dataToRender} />}
						</>
					)}
				</Canvas>

				{/* Control Buttons Overlay */}
				<div className='absolute top-4 right-4 flex flex-col gap-2'>
					<Button
						variant='secondary'
						size='icon'
						onClick={resetCamera}
						className='bg-background/80 backdrop-blur-sm'
						title='Reset Camera'
					>
						<RotateCcw className='h-4 w-4' />
					</Button>

					{dataToRender && (
						<>
							<Button
								variant={showPoints ? 'default' : 'secondary'}
								size='icon'
								onClick={() => setShowPoints(!showPoints)}
								className='bg-background/80 backdrop-blur-sm'
								title={showPoints ? 'Hide Points' : 'Show Points'}
							>
								<Dot className='h-4 w-4' />
							</Button>

							<Button
								variant={showFaces ? 'default' : 'secondary'}
								size='icon'
								onClick={() => setShowFaces(!showFaces)}
								className='bg-background/80 backdrop-blur-sm'
								title={showFaces ? 'Hide Faces' : 'Show Faces'}
							>
								<Square className='h-4 w-4' />
							</Button>

							<Button
								variant={showEdges ? 'default' : 'secondary'}
								size='icon'
								onClick={() => setShowEdges(!showEdges)}
								className='bg-background/80 backdrop-blur-sm'
								title={showEdges ? 'Hide Edges' : 'Show Edges'}
							>
								<Zap className='h-4 w-4' />
							</Button>
							
							<Button
								variant={showReferenceSphere ? 'default' : 'secondary'}
								size='icon'
								onClick={() => setShowReferenceSphere(!showReferenceSphere)}
								className='bg-background/80 backdrop-blur-sm'
								title={showReferenceSphere ? 'Hide Reference Sphere' : 'Show Reference Sphere'}
							>
								<Circle className='h-4 w-4' />
							</Button>
						</>
					)}
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
