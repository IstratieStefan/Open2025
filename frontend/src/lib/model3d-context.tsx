'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface ScanPoint {
	radius: number;
	angle: number;
}

export interface ScanSlice {
	height: number;
	points: ScanPoint[];
}

interface Model3DContextType {
	modelData: ScanSlice[];
	addPoint: (point: ScanPoint, height: number) => void;
	addSlice: (slice: ScanSlice) => void;
	updateSlice: (originalHeight: number, updatedSlice: ScanSlice) => void;
	removeSlice: (height: number) => void;
	clearModel: () => void;
	exportModelData: () => ScanSlice[];
	hasModelData: boolean;
}

const Model3DContext = createContext<Model3DContextType | undefined>(undefined);

export function useModel3D() {
	const context = useContext(Model3DContext);
	if (context === undefined) {
		throw new Error('useModel3D must be used within a Model3DProvider');
	}
	return context;
}

interface Model3DProviderProps {
	children: ReactNode;
}

export function Model3DProvider({ children }: Model3DProviderProps) {
	const [modelData, setModelData] = useState<ScanSlice[]>([
		// Example tetrahedron data - using cylindrical coordinates
		
	]);

    console.log(modelData);

	const addPoint = (point: ScanPoint, height: number) => {

        console.log(point, height);
		setModelData(prev => {
			const existingSliceIndex = prev.findIndex(slice => slice.height === height);
			
			if (existingSliceIndex >= 0) {
				// Add point to existing slice
				const newData = [...prev];
				newData[existingSliceIndex] = {
					...newData[existingSliceIndex],
					points: [...newData[existingSliceIndex].points, point]
				};
				return newData;
			} else {
				// Create new slice
				const newSlice: ScanSlice = {
					height: height,
					points: [point]
				};
				// Insert slice in height order
				const newData = [...prev, newSlice].sort((a, b) => a.height - b.height);
				return newData;
			}
		});
	};

	const addSlice = (slice: ScanSlice) => {
		setModelData(prev => {
			// Remove any existing slice at the same height and add the new one
			const filtered = prev.filter(s => s.height !== slice.height);
			const newData = [...filtered, slice].sort((a, b) => a.height - b.height);
			return newData;
		});
	};

	const updateSlice = (originalHeight: number, updatedSlice: ScanSlice) => {
		setModelData(prev => {
			const filtered = prev.filter(s => s.height !== originalHeight);
			const newData = [...filtered, updatedSlice].sort((a, b) => a.height - b.height);
			return newData;
		});
	};

	const removeSlice = (height: number) => {
		setModelData(prev => prev.filter(slice => slice.height !== height));
	};

	const clearModel = () => {
		setModelData([]);
	};

	const exportModelData = () => {
		return [...modelData];
	};

	const hasModelData = modelData.length > 0 && modelData.some(slice => slice.points.length > 0);

	const value: Model3DContextType = {
		modelData,
		addPoint,
		addSlice,
		updateSlice,
		removeSlice,
		clearModel,
		exportModelData,
		hasModelData
	};

	return (
		<Model3DContext.Provider value={value}>
			{children}
		</Model3DContext.Provider>
	);
}