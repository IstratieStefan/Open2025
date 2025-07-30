'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	AlertCircle,
	CheckCircle,
	Clock,
	Cloud,
	Download,
	FileText,
	HardDrive,
	Settings,
	Upload
} from 'lucide-react';
import { saveAs } from 'file-saver';

export type ExportFormat = 'stl' | 'obj' | 'ply' | 'glb' | 'gltf';

interface ExportControlsProps {
	modelData?: any;
	onExport?: (options: any, location: 'local' | 'cloud') => void;
	isExporting?: boolean;
	exportProgress?: number;
}

const formatConfigs = {
	stl: {
		name: 'STL',
		description: 'Standard for 3D printing',
		extension: '.stl',
		supportsColors: false,
		supportsTextures: false
	},
	obj: {
		name: 'OBJ',
		description: 'Universal 3D format',
		extension: '.obj',
		supportsColors: true,
		supportsTextures: true
	},
	ply: {
		name: 'PLY',
		description: 'Polygon file format',
		extension: '.ply',
		supportsColors: true,
		supportsTextures: false
	},
	glb: {
		name: 'GLB',
		description: 'Binary glTF',
		extension: '.glb',
		supportsColors: true,
		supportsTextures: true
	},
	gltf: {
		name: 'glTF',
		description: 'GL Transmission Format',
		extension: '.gltf',
		supportsColors: true,
		supportsTextures: true
	}
};

export function ExportControls({
	modelData,
	onExport = () => {},
	isExporting = false,
	exportProgress = 0
}: ExportControlsProps) {
	const [exportOptions, setExportOptions] = useState({
		format: 'stl' as ExportFormat,
		fileName: 'scan_model',
		quality: 'high' as 'low' | 'medium' | 'high',
		includeTextures: true,
		includeColors: true
	});
	const [lastExport, setLastExport] = useState<{
		format: ExportFormat;
		timestamp: Date;
	} | null>(null);

	const handleExport = async (location: 'local' | 'cloud') => {
		try {
			await onExport(exportOptions, location);

			setLastExport({ format: exportOptions.format, timestamp: new Date() });
				if (location === 'local') {
					const config = formatConfigs[exportOptions.format];
					const blob = new Blob(['# Mock 3D model data'], {
						type: 'text/plain'
					});
					saveAs(blob, `${exportOptions.fileName}${config.extension}`);
				}
		} catch (error) {
			console.error('Export failed:', error);
		}
	};

	const updateOption = (key: string, value: any) => {
		setExportOptions((prev) => ({ ...prev, [key]: value }));
	};

	const currentFormat = formatConfigs[exportOptions.format];
	const hasModelData = Boolean(modelData);

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Download className='h-5 w-5' />
					Export & Storage
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Model Status */}
				<div className='bg-muted/50 flex items-center justify-between rounded-lg p-3'>
					<div className='flex items-center gap-2'>
						<FileText className='text-muted-foreground h-4 w-4' />
						<span className='text-sm'>Model Status</span>
					</div>
					<Badge variant={hasModelData ? 'default' : 'secondary'}>
						{hasModelData ? 'Ready' : 'No Data'}
					</Badge>
				</div>

				{!hasModelData && (
					<div className='rounded-md border border-amber-500/20 bg-amber-500/10 p-3'>
						<div className='flex items-center gap-2'>
							<AlertCircle className='h-4 w-4 text-amber-600' />
							<span className='text-sm text-amber-700 dark:text-amber-400'>
								Complete a scan first to enable export functionality.
							</span>
						</div>
					</div>
				)}

				<Tabs defaultValue='export' className='w-full'>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='export'>Export Options</TabsTrigger>
						<TabsTrigger value='history'>Export History</TabsTrigger>
					</TabsList>

					<TabsContent value='export' className='space-y-4'>
						{/* File Name */}
						<div className='space-y-2'>
							<Label htmlFor='fileName'>File Name</Label>
							<Input
								id='fileName'
								value={exportOptions.fileName}
								onChange={(e) => updateOption('fileName', e.target.value)}
								placeholder='scan_model'
							/>
						</div>

						{/* Format Selection */}
						<div className='space-y-3'>
							<Label>Export Format</Label>
							<div className='grid grid-cols-2 gap-2'>
								{(Object.keys(formatConfigs) as ExportFormat[]).map(
									(format) => {
										const config = formatConfigs[format];
										const isSelected = exportOptions.format === format;

										return (
											<div
												key={format}
												className={`cursor-pointer rounded-lg border p-3 transition-colors ${
													isSelected
														? 'border-primary bg-primary/5'
														: 'border-border hover:border-primary/50'
												}`}
												onClick={() => updateOption('format', format)}
											>
												<div className='font-medium'>{config.name}</div>
												<div className='text-muted-foreground text-xs'>
													{config.description}
												</div>
												<div className='mt-1 flex gap-1'>
													{config.supportsColors && (
														<Badge variant='outline' className='text-xs'>
															Colors
														</Badge>
													)}
													{config.supportsTextures && (
														<Badge variant='outline' className='text-xs'>
															Textures
														</Badge>
													)}
												</div>
											</div>
										);
									}
								)}
							</div>
						</div>

						{/* Quality Settings */}
						<div className='space-y-3'>
							<Label>Quality</Label>
							<div className='flex gap-2'>
								{(['low', 'medium', 'high'] as const).map((quality) => (
									<Button
										key={quality}
										variant={
											exportOptions.quality === quality ? 'default' : 'outline'
										}
										size='sm'
										onClick={() => updateOption('quality', quality)}
										className='flex-1'
									>
										{quality.charAt(0).toUpperCase() + quality.slice(1)}
									</Button>
								))}
							</div>
						</div>

						{/* Format-specific options */}
						{(currentFormat.supportsColors ||
							currentFormat.supportsTextures) && (
							<div className='space-y-3'>
								<Label>Additional Options</Label>
								<div className='space-y-2'>
									{currentFormat.supportsColors && (
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Include Colors</span>
											<input
												type='checkbox'
												checked={exportOptions.includeColors}
												onChange={(e) =>
													updateOption('includeColors', e.target.checked)
												}
												className='h-4 w-4'
											/>
										</div>
									)}
									{currentFormat.supportsTextures && (
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Include Textures</span>
											<input
												type='checkbox'
												checked={exportOptions.includeTextures}
												onChange={(e) =>
													updateOption('includeTextures', e.target.checked)
												}
												className='h-4 w-4'
											/>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Export Progress */}
						{isExporting && (
							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<Settings className='h-4 w-4 animate-spin' />
									<span className='text-sm'>Exporting...</span>
									<span className='font-mono text-sm'>
										{Math.round(exportProgress)}%
									</span>
								</div>
								<div className='bg-muted h-2 w-full rounded-full'>
									<div
										className='bg-primary h-2 rounded-full transition-all duration-300'
										style={{ width: `${exportProgress}%` }}
									/>
								</div>
							</div>
						)}

						{/* Export Buttons */}
						<div className='flex gap-2'>
							<Button
								onClick={() => handleExport('local')}
								disabled={!hasModelData || isExporting}
								className='flex-1'
							>
								<HardDrive className='mr-2 h-4 w-4' />
								Save Locally
							</Button>
							<Button
								onClick={() => handleExport('cloud')}
								disabled={!hasModelData || isExporting}
								variant='outline'
								className='flex-1'
							>
								<Cloud className='mr-2 h-4 w-4' />
								Save to Cloud
							</Button>
						</div>
					</TabsContent>

					<TabsContent value='history' className='space-y-4'>
						{lastExport ? (
							<div className='space-y-3'>
								<div className='flex items-center justify-between rounded-lg border p-3'>
									<div className='flex items-center gap-2'>
										<CheckCircle className='h-4 w-4 text-green-500' />
										<div>
											<div className='font-medium'>
												{formatConfigs[lastExport.format].name} Export
											</div>
											<div className='text-muted-foreground text-sm'>
												{lastExport.timestamp.toLocaleString()}
											</div>
										</div>
									</div>
									<Badge variant='outline'>Success</Badge>
								</div>

								<Button variant='outline' className='w-full'>
									<Upload className='mr-2 h-4 w-4' />
									View Export History
								</Button>
							</div>
						) : (
							<div className='text-muted-foreground py-8 text-center'>
								<Clock className='mx-auto mb-2 h-8 w-8' />
								<p>No exports yet</p>
								<p className='text-sm'>
									Complete a scan and export to see history
								</p>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
