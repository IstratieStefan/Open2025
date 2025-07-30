'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Activity,
  Clock,
  Layers
} from 'lucide-react'

export type ScannerStatus = 'idle' | 'scanning' | 'paused' | 'error' | 'completed'

interface ScannerControlsProps {
  onStart?: () => void
  onPause?: () => void
  onStop?: () => void
  onReset?: () => void
  status?: ScannerStatus
  progress?: number
  estimatedTime?: string
  currentLayer?: number
  totalLayers?: number
}

const statusConfig = {
  idle: { label: 'Ready', color: 'default' as const, icon: Activity },
  scanning: { label: 'Scanning', color: 'default' as const, icon: Activity },
  paused: { label: 'Paused', color: 'secondary' as const, icon: Pause },
  error: { label: 'Error', color: 'destructive' as const, icon: Activity },
  completed: { label: 'Completed', color: 'default' as const, icon: Activity }
}

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
  const [isScanning, setIsScanning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const handleStart = () => {
    setIsScanning(true)
    setIsPaused(false)
    onStart()
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
    onPause()
  }

  const handleStop = () => {
    setIsScanning(false)
    setIsPaused(false)
    onStop()
  }

  const handleReset = () => {
    setIsScanning(false)
    setIsPaused(false)
    onReset()
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Scanner Controls
          <Badge variant={config.color} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleStart}
            disabled={isScanning && !isPaused}
            className="flex-1 min-w-[80px]"
            variant={isScanning && !isPaused ? "secondary" : "default"}
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
          
          <Button
            onClick={handlePause}
            disabled={!isScanning}
            variant="secondary"
            className="flex-1 min-w-[80px]"
          >
            <Pause className="h-4 w-4 mr-2" />
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          
          <Button
            onClick={handleStop}
            disabled={!isScanning}
            variant="destructive"
            className="flex-1 min-w-[80px]"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 min-w-[80px]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Progress Section */}
        {(isScanning || status === 'completed') && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Est. Time:</span>
                <span className="font-mono">{estimatedTime}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Layer:</span>
                <span className="font-mono">{currentLayer}/{totalLayers}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status === 'error' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              Scanner error detected. Please check hardware connections and try again.
            </p>
          </div>
        )}

        {status === 'completed' && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
            <p className="text-sm text-green-700 dark:text-green-400">
              Scan completed successfully! You can now export or save your model.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 