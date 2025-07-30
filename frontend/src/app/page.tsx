'use client'

import { useState } from 'react'
import { Model3DViewer } from '@/components/3d-viewer'
import { ScannerControls, type ScannerStatus } from '@/components/scanner-controls'
import { ScanVolumeControls } from '@/components/scan-volume-controls'
import { DeviceMonitor } from '@/components/device-monitor'
import { ExportControls } from '@/components/export-controls'
import type { ExportOptions, StorageLocation } from '@/components/export-controls'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Scan,
  Settings,
  Monitor,
  Download
} from 'lucide-react'

interface ScanVolume {
  width: number
  height: number
  depth: number
}

export default function Dashboard() {
  // Scanner state
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('idle')
  const [scanProgress, setScanProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState('--:--')
  const [currentLayer, setCurrentLayer] = useState(0)
  const [totalLayers, setTotalLayers] = useState(100)
  
  // 3D model and scan volume state
  const [scanVolume, setScanVolume] = useState<ScanVolume>({
    width: 10,
    height: 10,
    depth: 10
  })
  const [modelData, setModelData] = useState<any>(null)
  
  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  // Scanner control handlers
  const handleScanStart = () => {
    setScannerStatus('scanning')
    setScanProgress(0)
    setCurrentLayer(0)
    
    // Simulate scan progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const newProgress = prev + Math.random() * 5
        if (newProgress >= 100) {
          clearInterval(interval)
          setScannerStatus('completed')
          setModelData({ type: 'mock-scan-data' }) // Mock data for demo
          return 100
        }
        
        // Update estimated time and layer
        const remaining = (100 - newProgress) / 5 * 2 // rough estimate
        const minutes = Math.floor(remaining / 60)
        const seconds = Math.floor(remaining % 60)
        setEstimatedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
        setCurrentLayer(Math.floor((newProgress / 100) * totalLayers))
        
        return newProgress
      })
    }, 2000)
  }

  const handleScanPause = () => {
    setScannerStatus(scannerStatus === 'paused' ? 'scanning' : 'paused')
  }

  const handleScanStop = () => {
    setScannerStatus('idle')
    setScanProgress(0)
    setCurrentLayer(0)
    setEstimatedTime('--:--')
  }

  const handleScanReset = () => {
    setScannerStatus('idle')
    setScanProgress(0)
    setCurrentLayer(0)
    setEstimatedTime('--:--')
    setModelData(null)
  }

  // Volume control handlers
  const handleVolumeChange = (volume: ScanVolume) => {
    setScanVolume(volume)
    // Update total layers based on volume
    const newTotalLayers = Math.ceil((volume.width * volume.height * volume.depth) / 10)
    setTotalLayers(Math.max(50, Math.min(500, newTotalLayers)))
  }

  const handleVolumeReset = () => {
    setScanVolume({ width: 10, height: 10, depth: 10 })
    setTotalLayers(100)
  }

  // Export handlers
  const handleExport = async (options: ExportOptions, location: StorageLocation): Promise<boolean> => {
    setIsExporting(true)
    setExportProgress(0)
    
    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      console.log(`Exporting ${options.format} file to ${location}:`, options)
      return true
    } catch (error) {
      console.error('Export failed:', error)
      return false
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Scan className="h-6 w-6" />
            <h1 className="text-2xl font-bold">3D Scanner Control Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Left Panel - 3D Viewer */}
          <div className="xl:col-span-2">
            <Model3DViewer 
              modelData={modelData}
              scanVolume={scanVolume}
            />
          </div>

          {/* Right Panel - Controls */}
          <div className="xl:col-span-1">
            <Tabs defaultValue="scanner" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scanner" className="flex items-center gap-1">
                  <Scan className="h-4 w-4" />
                  <span className="hidden sm:inline">Scan</span>
                </TabsTrigger>
                <TabsTrigger value="volume" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Volume</span>
                </TabsTrigger>
                <TabsTrigger value="monitor" className="flex items-center gap-1">
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">Monitor</span>
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 mt-4 overflow-auto">
                <TabsContent value="scanner" className="h-full mt-0">
                  <ScannerControls
                    onStart={handleScanStart}
                    onPause={handleScanPause}
                    onStop={handleScanStop}
                    onReset={handleScanReset}
                    status={scannerStatus}
                    progress={scanProgress}
                    estimatedTime={estimatedTime}
                    currentLayer={currentLayer}
                    totalLayers={totalLayers}
                  />
                </TabsContent>

                <TabsContent value="volume" className="h-full mt-0">
                  <ScanVolumeControls
                    width={scanVolume.width}
                    height={scanVolume.height}
                    depth={scanVolume.depth}
                    onVolumeChange={handleVolumeChange}
                    onReset={handleVolumeReset}
                    minSize={1}
                    maxSize={50}
                  />
                </TabsContent>

                <TabsContent value="monitor" className="h-full mt-0">
                  <DeviceMonitor />
                </TabsContent>

                <TabsContent value="export" className="h-full mt-0">
                  <ExportControls
                    modelData={modelData}
                    onExport={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
