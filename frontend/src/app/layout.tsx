import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ScannerProvider } from '@/lib/scanner-context'
import { LoggingProvider } from '@/lib/logging-context'
import { Model3DProvider } from '@/lib/model3d-context'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '3D Scanner Dashboard',
  description: 'Control and monitor your 3D scanner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <Model3DProvider>
        <LoggingProvider>
          <ScannerProvider>
            
              {children}
              <Toaster />
          </ScannerProvider>
        </LoggingProvider>
        </Model3DProvider>
      </body>
    </html>
  )
}
