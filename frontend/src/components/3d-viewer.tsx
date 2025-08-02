'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, Grid, OrbitControls } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dot, Grid3X3, Move3D, RotateCcw, ZoomIn, Circle, Square, Zap, Plus } from 'lucide-react';
import { useModel3D, ScanPoint, ScanSlice } from '@/lib/model3d-context';
import * as THREE from 'three';

interface Model3DViewerProps {
	showPoints?: boolean; // Show point cloud
	showFaces?: boolean; // Show solid faces
	showEdges?: boolean; // Show edges/wireframe
}

// Helper function to convert cylindrical to Cartesian coordinates
function cylindricalToCartesian(
	radius: number,
	height: number,
	angle: number
): [number, number, number] {
	const theta = (angle * Math.PI) / 180; // angle around central axis
	const x = radius * Math.cos(theta);
	const y = height; // height is vertical position
	const z = radius * Math.sin(theta);
	return [x, y, z];
}

// PointCloud component: renders points from scan slices
function PointCloud({ slices }: { slices: ScanSlice[] }) {
	const positions = useMemo(() => {
		// Sort slices by height for consistency with mesh generation
		const sortedSlices = [...slices].sort((a, b) => a.height - b.height);
		return sortedSlices.flatMap((slice) =>
			slice.points.flatMap((point) =>
				cylindricalToCartesian(
					point.radius,
					slice.height,
					point.angle
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



// Helper function to create bridge geometry between two slices using convex hull

// Helper function to compute 2D convex hull for a slice (projecting to XZ plane)
function computeSliceConvexHull(sliceIndices: number[], vertices: number[]): number[] {
	if (sliceIndices.length < 3) return sliceIndices;

	// Project points to 2D (XZ plane) for convex hull computation
	const points2D = sliceIndices.map(idx => ({
		originalIndex: idx,
		x: vertices[idx * 3],     // X coordinate
		z: vertices[idx * 3 + 2]  // Z coordinate (Y is height, we ignore for 2D hull)
	}));

	// Simple 2D convex hull algorithm (Graham scan)
	// Find bottom-most point (or left-most if tie)
	let bottomPoint = points2D[0];
	for (let i = 1; i < points2D.length; i++) {
		if (points2D[i].z < bottomPoint.z || 
			(points2D[i].z === bottomPoint.z && points2D[i].x < bottomPoint.x)) {
			bottomPoint = points2D[i];
		}
	}

	// Sort points by polar angle with respect to bottom point
	const sortedPoints = points2D.filter(p => p !== bottomPoint);
	sortedPoints.sort((a, b) => {
		const angleA = Math.atan2(a.z - bottomPoint.z, a.x - bottomPoint.x);
		const angleB = Math.atan2(b.z - bottomPoint.z, b.x - bottomPoint.x);
		return angleA - angleB;
	});

	// Graham scan
	const hull = [bottomPoint];
	for (const point of sortedPoints) {
		// Remove points that create clockwise turn
		while (hull.length > 1) {
			const cross = crossProduct(
				hull[hull.length - 2], hull[hull.length - 1], point
			);
			if (cross <= 0) {
				hull.pop();
			} else {
				break;
			}
		}
		hull.push(point);
	}

	return hull.map(p => p.originalIndex);
}

// Helper function for cross product in 2D
function crossProduct(o: {x: number, z: number}, a: {x: number, z: number}, b: {x: number, z: number}): number {
	return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
}

// Helper function to bridge between two convex hull boundaries
function bridgeConvexHulls(hull1: number[], hull2: number[]): number[] {
	const indices: number[] = [];
	
	if (hull1.length === 0 || hull2.length === 0) return indices;

	// Create bridges between the two convex hull boundaries
	const count1 = hull1.length;
	const count2 = hull2.length;

	if (count1 === 1 && count2 > 1) {
		// Single point to multiple points (cone)
		const apex = hull1[0];
		for (let i = 0; i < count2; i++) {
			const current = hull2[i];
			const next = hull2[(i + 1) % count2];
			indices.push(apex, current, next);
		}
	} else if (count1 > 1 && count2 === 1) {
		// Multiple points to single point (cone)
		const apex = hull2[0];
		for (let i = 0; i < count1; i++) {
			const current = hull1[i];
			const next = hull1[(i + 1) % count1];
			indices.push(current, apex, next);
		}
	} else {
		// Bridge between two polygonal boundaries
		for (let i = 0; i < Math.max(count1, count2); i++) {
			const i1 = Math.floor((i / Math.max(count1, count2)) * count1) % count1;
			const i2 = Math.floor((i / Math.max(count1, count2)) * count2) % count2;
			const next1 = (i1 + 1) % count1;
			const next2 = (i2 + 1) % count2;

			const a = hull1[i1];
			const b = hull1[next1];
			const c = hull2[i2];
			const d = hull2[next2];

			// Create quad as two triangles
			indices.push(a, c, b);
			indices.push(b, c, d);
		}
	}

	return indices;
}

// Helper function to create bridge geometry between two slices using convex hulls
function bridgeSlices(
	slice1Start: number,
	slice1Count: number, 
	slice2Start: number,
	slice2Count: number,
	vertices: number[]
): number[] {
	// Compute convex hull for each slice individually
	const slice1Indices = Array.from({ length: slice1Count }, (_, i) => slice1Start + i);
	const slice2Indices = Array.from({ length: slice2Count }, (_, i) => slice2Start + i);

	const hull1 = computeSliceConvexHull(slice1Indices, vertices);
	const hull2 = computeSliceConvexHull(slice2Indices, vertices);

	// Bridge between the two convex hulls
	return bridgeConvexHulls(hull1, hull2);
}

// Helper function to generate mesh geometry using convex hull between slices
function generateMeshGeometry(slices: ScanSlice[]) {
	if (slices.length === 0) return { vertices: [], indices: [] };

	const vertices: number[] = [];
	const indices: number[] = [];

	// Sort slices by height to ensure proper ordering
	const sortedSlices = [...slices].sort((a, b) => a.height - b.height);

	// Convert all points to vertices and track slice info
	const sliceInfo: { start: number; count: number; points: { x: number; y: number; z: number }[] }[] = [];
	let currentVertexIndex = 0;
	
	sortedSlices.forEach((slice) => {
		const sliceStart = currentVertexIndex;
		const sliceCount = slice.points.length;
		const slicePoints: { x: number; y: number; z: number }[] = [];
		
		slice.points.forEach((point) => {
			const [x, y, z] = cylindricalToCartesian(
				point.radius,
				slice.height,
				point.angle
			);
			vertices.push(x, y, z);
			slicePoints.push({ x, y, z });
			currentVertexIndex++;
		});
		
		sliceInfo.push({ start: sliceStart, count: sliceCount, points: slicePoints });
	});

	// Create bottom cap (first slice) using convex hull
	if (sliceInfo.length > 0 && sliceInfo[0].count >= 3) {
		const bottomSlice = sliceInfo[0];
		const sliceIndices = Array.from({ length: bottomSlice.count }, (_, i) => bottomSlice.start + i);
		const hullIndices = computeSliceConvexHull(sliceIndices, vertices);
		
		// Triangulate the convex hull (fan triangulation from first vertex)
		for (let i = 1; i < hullIndices.length - 1; i++) {
			// Reverse winding for bottom face
			indices.push(hullIndices[0], hullIndices[i + 1], hullIndices[i]);
		}
	}

	// Create top cap (last slice) using convex hull
	if (sliceInfo.length > 0 && sliceInfo[sliceInfo.length - 1].count >= 3) {
		const topSlice = sliceInfo[sliceInfo.length - 1];
		const sliceIndices = Array.from({ length: topSlice.count }, (_, i) => topSlice.start + i);
		const hullIndices = computeSliceConvexHull(sliceIndices, vertices);
		
		// Triangulate the convex hull (fan triangulation from first vertex)
		for (let i = 1; i < hullIndices.length - 1; i++) {
			// Normal winding for top face
			indices.push(hullIndices[0], hullIndices[i], hullIndices[i + 1]);
		}
	}

	// Create bridge geometry between adjacent slices using convex hull
	for (let i = 0; i < sliceInfo.length - 1; i++) {
		const currentSlice = sliceInfo[i];
		const nextSlice = sliceInfo[i + 1];
		
		if (currentSlice.count > 0 && nextSlice.count > 0) {
			const bridgeIndices = bridgeSlices(
				currentSlice.start,
				currentSlice.count,
				nextSlice.start,
				nextSlice.count,
				vertices
			);
			indices.push(...bridgeIndices);
		}
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
				transparent={true}
				opacity={0.7}
			/>
		</mesh>
	);
}

// Wireframe edges component
function MeshEdges({ slices }: { slices: ScanSlice[] }) {
	const { vertices, indices } = useMemo(() => generateMeshGeometry(slices), [slices]);
	const verticesArray = useMemo(() => new Float32Array(vertices), [vertices]);
	const indicesArray = useMemo(() => new Uint16Array(indices), [indices]);
  
	// BufferGeometry for mesh
	const meshGeometry = useMemo(() => {
	  const geometry = new THREE.BufferGeometry();
	  geometry.setAttribute("position", new THREE.BufferAttribute(verticesArray, 3));
	  geometry.setIndex(new THREE.BufferAttribute(indicesArray, 1));
	  return geometry;
	}, [verticesArray, indicesArray]);
  
	// EdgesGeometry for wireframe
	const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(meshGeometry), [meshGeometry]);
  
	if (vertices.length === 0) return null;
  
	return (
	  <lineSegments geometry={edgesGeometry}>
		<lineBasicMaterial color="#ff6b35" linewidth={8} />
	  </lineSegments>
	);
  }

export function Model3DViewer({
	showPoints: initialShowPoints = true,
	showFaces: initialShowFaces = true,
	showEdges: initialShowEdges = false
}: Model3DViewerProps) {
	const { modelData, addPoint } = useModel3D();
	const controlsRef = useRef<any>(null);
	const [resetTrigger, setResetTrigger] = useState(0);
	const [showPoints, setShowPoints] = useState(initialShowPoints);
	const [showFaces, setShowFaces] = useState(initialShowFaces);
	const [showEdges, setShowEdges] = useState(initialShowEdges);
	const [showAddPointForm, setShowAddPointForm] = useState(false);
	const [newPoint, setNewPoint] = useState<ScanPoint>({
		radius: 1,
		angle: 0
	});
	const [newPointHeight, setNewPointHeight] = useState<number>(0);

	const resetCamera = () => {
		if (controlsRef.current) {
			controlsRef.current.reset();
			setResetTrigger((prev) => prev + 1);
		}
	};

	const handleAddPoint = () => {
		addPoint(newPoint, newPointHeight);
		setShowAddPointForm(false);
		// Reset form
		setNewPoint({ radius: 1, angle: 0 });
		setNewPointHeight(0);
	};

	// Use model data from context
	const dataToRender = modelData;

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
						position={[0, 0, 0]}
						cellColor='#333333'
						sectionColor='#666666'
					/>

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
						onClick={() => setShowAddPointForm(true)}
						className='bg-background/80 backdrop-blur-sm'
						title='Add Point'
					>
						<Plus className='h-4 w-4' />
					</Button>
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

				{/* Add Point Form Modal */}
				{showAddPointForm && (
					<div className='absolute inset-0 bg-black/50 flex items-center justify-center z-50'>
						<div className='bg-background p-6 rounded-lg shadow-lg space-y-4 w-80'>
							<h3 className='text-lg font-semibold'>Add Point</h3>
							
							<div className='space-y-3'>
								<div>
									<Label htmlFor='radius'>Radius</Label>
									<Input
										id='radius'
										type='number'
										value={newPoint.radius}
										onChange={(e) => setNewPoint(prev => ({ ...prev, radius: parseFloat(e.target.value) || 0 }))}
										step='0.1'
									/>
								</div>
								
								<div>
									<Label htmlFor='height'>Height</Label>
									<Input
										id='height'
										type='number'
										value={newPointHeight}
										onChange={(e) => setNewPointHeight(parseFloat(e.target.value) || 0)}
										step='0.1'
									/>
								</div>
								
								<div>
									<Label htmlFor='angle'>Angle (degrees)</Label>
									<Input
										id='angle'
										type='number'
										value={newPoint.angle}
										onChange={(e) => setNewPoint(prev => ({ ...prev, angle: parseFloat(e.target.value) || 0 }))}
										step='1'
										min='-360'
										max='360'
									/>
								</div>
							</div>
							
							<div className='flex gap-2 justify-end'>
								<Button variant='outline' onClick={() => setShowAddPointForm(false)}>
									Cancel
								</Button>
								<Button onClick={handleAddPoint}>
									Add Point
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
