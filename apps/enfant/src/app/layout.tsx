import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Awal',
  manifest: '/manifest.webmanifest',
}

export const viewport = {
  themeColor: '#c94f3d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
