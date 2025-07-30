'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
	Plus, 
	Trash2, 
	Edit3, 
	Save, 
	X, 
	ChevronUp, 
	ChevronDown,
	Layers
} from 'lucide-react';
import { useModel3D, ScanPoint, ScanSlice } from '@/lib/model3d-context';

interface EditingPoint {
	sliceIndex: number;
	pointIndex: number;
	point: ScanPoint;
}

export function ModelEditor() {
	const { modelData, addPoint, removeSlice, clearModel, addSlice, updateSlice } = useModel3D();
	const [editingPoint, setEditingPoint] = useState<EditingPoint | null>(null);
	const [showAddForm, setShowAddForm] = useState<{
		sliceIndex: number;
		position: 'before' | 'after';
		pointIndex?: number;
	} | null>(null);
	const [newPoint, setNewPoint] = useState<ScanPoint>({
		radius: 1,
		angle: 0
	});
	const [newSliceHeight, setNewSliceHeight] = useState<number>(0);
	const [showNewSliceForm, setShowNewSliceForm] = useState(false);

	const sortedSlices = [...modelData].sort((a, b) => a.height - b.height);

	const handleEditPoint = (sliceIndex: number, pointIndex: number, point: ScanPoint) => {
		setEditingPoint({ sliceIndex, pointIndex, point: { ...point } });
	};

	const handleSaveEdit = () => {
		if (!editingPoint) return;
		
		const originalSlice = sortedSlices[editingPoint.sliceIndex];
		const updatedPoints = [...originalSlice.points];
		updatedPoints[editingPoint.pointIndex] = editingPoint.point;
		
		const updatedSlice: ScanSlice = {
			height: originalSlice.height,
			points: updatedPoints
		};
		
		updateSlice(originalSlice.height, updatedSlice);
		setEditingPoint(null);
	};

	const handleDeletePoint = (sliceIndex: number, pointIndex: number) => {
		const slice = sortedSlices[sliceIndex];
		const updatedPoints = slice.points.filter((_, i) => i !== pointIndex);
		
		if (updatedPoints.length === 0) {
			// Remove the entire slice if no points left
			removeSlice(slice.height);
		} else {
			// Update the slice with remaining points
			const updatedSlice: ScanSlice = {
				height: slice.height,
				points: updatedPoints
			};
			updateSlice(slice.height, updatedSlice);
		}
	};

	const handleAddPoint = () => {
		if (!showAddForm) return;

		const slice = sortedSlices[showAddForm.sliceIndex];
		const updatedPoints = [...slice.points];
		
		const pointToAdd: ScanPoint = {
			...newPoint
		};
		
		if (showAddForm.position === 'before' && showAddForm.pointIndex !== undefined) {
			updatedPoints.splice(showAddForm.pointIndex, 0, pointToAdd);
		} else if (showAddForm.position === 'after' && showAddForm.pointIndex !== undefined) {
			updatedPoints.splice(showAddForm.pointIndex + 1, 0, pointToAdd);
		} else {
			// Add at end
			updatedPoints.push(pointToAdd);
		}

		const updatedSlice: ScanSlice = {
			height: slice.height,
			points: updatedPoints
		};
		updateSlice(slice.height, updatedSlice);

		setShowAddForm(null);
		setNewPoint({ radius: 1, angle: 0 });
	};

	const handleAddNewSlice = () => {
		const newSlice: ScanSlice = {
			height: newSliceHeight,
			points: []
		};
		addSlice(newSlice);
		setShowNewSliceForm(false);
		setNewSliceHeight(0);
	};

	const moveSlice = (sliceIndex: number, direction: 'up' | 'down') => {
		const slice = sortedSlices[sliceIndex];
		const targetIndex = direction === 'up' ? sliceIndex - 1 : sliceIndex + 1;
		
		if (targetIndex < 0 || targetIndex >= sortedSlices.length) return;
		
		const targetSlice = sortedSlices[targetIndex];
		
		// Swap the heights of the two slices
		const slice1Updated: ScanSlice = {
			height: targetSlice.height,
			points: slice.points
		};
		
		const slice2Updated: ScanSlice = {
			height: slice.height,
			points: targetSlice.points
		};
		
		// Update both slices with their new heights
		updateSlice(slice.height, slice1Updated);
		updateSlice(targetSlice.height, slice2Updated);
	};

	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Layers className="h-5 w-5" />
					Model Editor
				</CardTitle>
				<div className="flex gap-2">
					<Button 
						variant="outline" 
						size="sm"
						onClick={() => setShowNewSliceForm(true)}
					>
						<Plus className="h-4 w-4 mr-2" />
						Add Layer
					</Button>
					<Button 
						variant="destructive" 
						size="sm"
						onClick={clearModel}
						disabled={modelData.length === 0}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Clear All
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
				{sortedSlices.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
						<p>No model data</p>
						<p className="text-sm">Add a layer to get started</p>
					</div>
				) : (
					sortedSlices.map((slice, sliceIndex) => (
						<Card key={`${slice.height}-${sliceIndex}`} className="border-l-4 border-l-blue-500">
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge variant="secondary">
											Layer {sliceIndex + 1}
										</Badge>
										<span className="text-sm font-medium">
											Height: {slice.height.toFixed(2)}
										</span>
										<span className="text-xs text-muted-foreground">
											({slice.points.length} points)
										</span>
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => moveSlice(sliceIndex, 'up')}
											disabled={sliceIndex === 0}
										>
											<ChevronUp className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => moveSlice(sliceIndex, 'down')}
											disabled={sliceIndex === sortedSlices.length - 1}
										>
											<ChevronDown className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => removeSlice(slice.height)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-2">
								{slice.points.map((point, pointIndex) => (
									<div 
										key={pointIndex}
										className="flex items-center gap-2 p-2 rounded border bg-muted/30"
									>
										<span className="text-xs text-muted-foreground w-8">
											{pointIndex + 1}
										</span>
										
										{editingPoint?.sliceIndex === sliceIndex && editingPoint?.pointIndex === pointIndex ? (
											<>
												<div className="flex gap-2 flex-1">
													<div className="flex flex-col gap-1">
														<Label className="text-xs">Radius</Label>
														<Input
															type="number"
															value={editingPoint.point.radius}
															onChange={(e) => setEditingPoint(prev => prev ? {
																...prev,
																point: { ...prev.point, radius: parseFloat(e.target.value) || 0 }
															} : null)}
															className="h-8 w-20 text-xs"
															step="0.1"
														/>
													</div>

													<div className="flex flex-col gap-1">
														<Label className="text-xs">Angle</Label>
														<Input
															type="number"
															value={editingPoint.point.angle}
															onChange={(e) => setEditingPoint(prev => prev ? {
																...prev,
																point: { ...prev.point, angle: parseFloat(e.target.value) || 0 }
															} : null)}
															className="h-8 w-20 text-xs"
															step="1"
														/>
													</div>
												</div>
												<div className="flex gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={handleSaveEdit}
													>
														<Save className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setEditingPoint(null)}
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
											</>
										) : (
											<>
												<div className="flex gap-4 flex-1 text-sm">
													<span>R: {point.radius.toFixed(2)}</span>
													<span>A: {point.angle.toFixed(1)}°</span>
												</div>
												<div className="flex gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setShowAddForm({
															sliceIndex,
															position: 'before',
															pointIndex
														})}
													>
														<Plus className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleEditPoint(sliceIndex, pointIndex, point)}
													>
														<Edit3 className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setShowAddForm({
															sliceIndex,
															position: 'after',
															pointIndex
														})}
													>
														<Plus className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleDeletePoint(sliceIndex, pointIndex)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</>
										)}
									</div>
								))}
								
								{slice.points.length === 0 && (
									<div className="text-center py-4 text-muted-foreground">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setShowAddForm({
												sliceIndex,
												position: 'after'
											})}
										>
											<Plus className="h-4 w-4 mr-2" />
											Add First Point
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					))
				)}

				{/* Add Point Form */}
				{showAddForm && (
					<Card className="border-2 border-dashed border-primary">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm">
								Add Point {showAddForm.position} {showAddForm.pointIndex !== undefined ? `point ${showAddForm.pointIndex + 1}` : 'at end'}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="space-y-2">
								<div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
									Adding to layer at height: <span className="font-medium">{sortedSlices[showAddForm.sliceIndex]?.height.toFixed(2)}</span>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<div>
										<Label className="text-xs">Radius</Label>
										<Input
											type="number"
											value={newPoint.radius}
											onChange={(e) => setNewPoint(prev => ({ ...prev, radius: parseFloat(e.target.value) || 0 }))}
											className="h-8"
											step="0.1"
										/>
									</div>
									<div>
										<Label className="text-xs">Angle (degrees)</Label>
										<Input
											type="number"
											value={newPoint.angle}
											onChange={(e) => setNewPoint(prev => ({ ...prev, angle: parseFloat(e.target.value) || 0 }))}
											className="h-8"
											step="1"
											min="-360"
											max="360"
										/>
									</div>
								</div>
							</div>
							<div className="flex gap-2 justify-end">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowAddForm(null)}
								>
									Cancel
								</Button>
								<Button
									size="sm"
									onClick={handleAddPoint}
								>
									Add Point
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Add New Slice Form */}
				{showNewSliceForm && (
					<Card className="border-2 border-dashed border-primary">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm">Add New Layer</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div>
								<Label className="text-xs">Height</Label>
								<Input
									type="number"
									value={newSliceHeight}
									onChange={(e) => setNewSliceHeight(parseFloat(e.target.value) || 0)}
									className="h-8"
									step="0.1"
									placeholder="Layer height"
								/>
							</div>
							<div className="flex gap-2 justify-end">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowNewSliceForm(false)}
								>
									Cancel
								</Button>
								<Button
									size="sm"
									onClick={handleAddNewSlice}
								>
									Add Layer
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</CardContent>
		</Card>
	);
}