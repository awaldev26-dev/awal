import type { ReactNode } from 'react'
import { FournisseurAwal } from './contexte/FournisseurAwal.js'
import './globals.css'

export const metadata = {
  title: 'Awal',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.png', apple: '/icone-192.png' },
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
      <body>
        {/* Le fournisseur vit dans le layout : le corpus n'est donc téléchargé
            qu'une fois pour toute la navigation. */}
        <FournisseurAwal>{children}</FournisseurAwal>
      </body>
    </html>
  )
}
