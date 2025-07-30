'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Gauge, 
  ArrowUpDown, 
  RotateCw,
  MapPin,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react'

interface DeviceStatus {
  sensorY: number // Y position of distance sensor (0-100)
  plateRotation: number // Rotation angle of plate (0-360 degrees)
  isConnected: boolean
  lastUpdate: Date
  batteryLevel?: number
  temperature?: number
}

interface DeviceMonitorProps {
  deviceStatus?: DeviceStatus
  maxSensorRange?: number
  onCalibrate?: () => void
}

// Mock data generator for demo purposes
const generateMockData = (): DeviceStatus => ({
  sensorY: Math.random() * 100,
  plateRotation: Math.random() * 360,
  isConnected: Math.random() > 0.1, // 90% chance of being connected
  lastUpdate: new Date(),
  batteryLevel: 85 + Math.random() * 15,
  temperature: 20 + Math.random() * 10
})

export function DeviceMonitor({
  deviceStatus,
  maxSensorRange = 100,
  onCalibrate = () => {}
}: DeviceMonitorProps) {
  const [status, setStatus] = useState<DeviceStatus>(
    deviceStatus || generateMockData()
  )

  // Simulate real-time updates for demo
  useEffect(() => {
    if (!deviceStatus) {
      const interval = setInterval(() => {
        setStatus(generateMockData())
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [deviceStatus])

  // Update status when prop changes
  useEffect(() => {
    if (deviceStatus) {
      setStatus(deviceStatus)
    }
  }, [deviceStatus])

  const getConnectionBadge = () => {
    if (status.isConnected) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          Connected
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Disconnected
        </Badge>
      )
    }
  }

  const formatRotation = (angle: number) => {
    return `${angle.toFixed(1)}°`
  }

  const formatPosition = (position: number) => {
    return `${position.toFixed(1)} mm`
  }

  const timeSinceUpdate = () => {
    const now = new Date()
    const diffMs = now.getTime() - status.lastUpdate.getTime()
    const seconds = Math.floor(diffMs / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Device Monitor
          </div>
          {getConnectionBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status Alert */}
        {!status.isConnected && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                Device connection lost. Check hardware connections.
              </span>
            </div>
          </div>
        )}

        {/* Distance Sensor Position */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Distance Sensor Y Position</span>
            </div>
            <span className="text-sm font-mono">{formatPosition(status.sensorY)}</span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={(status.sensorY / maxSensorRange) * 100} 
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 mm</span>
              <span>{maxSensorRange} mm</span>
            </div>
          </div>
        </div>

        {/* Plate Rotation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Plate Rotation</span>
            </div>
            <span className="text-sm font-mono">{formatRotation(status.plateRotation)}</span>
          </div>
          
          {/* Circular Progress Indicator */}
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(status.plateRotation / 360) * 283} 283`}
                  className="text-primary"
                />
                {/* Center dot */}
                <circle
                  cx="50"
                  cy="50"
                  r="2"
                  fill="currentColor"
                  className="text-primary"
                />
                {/* Position indicator */}
                <circle
                  cx={50 + 40 * Math.cos((status.plateRotation - 90) * Math.PI / 180)}
                  cy={50 + 40 * Math.sin((status.plateRotation - 90) * Math.PI / 180)}
                  r="3"
                  fill="currentColor"
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-mono">{formatRotation(status.plateRotation)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Last Update</div>
            <div className="text-sm font-mono">{timeSinceUpdate()}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="text-sm">Active</span>
            </div>
          </div>

          {status.batteryLevel && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Battery</div>
              <div className="text-sm font-mono">{status.batteryLevel.toFixed(0)}%</div>
            </div>
          )}

          {status.temperature && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Temperature</div>
              <div className="text-sm font-mono">{status.temperature.toFixed(1)}°C</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 