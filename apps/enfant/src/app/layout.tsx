import type { ReactNode } from 'react'
import { Baloo_2, Fredoka } from 'next/font/google'
import { FournisseurAwal } from './contexte/FournisseurAwal'
import './globals.css'

// Fredoka pour l'interface : très arrondie, franche, lisible de loin.
const jeu = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--police-jeu',
  display: 'swap',
})

// Baloo pour les mots kabyles : arrondie aussi, mais avec des formes plus
// ouvertes — utile quand on apprend à lire.
const mot = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--police-mot',
  display: 'swap',
})

export const metadata = {
  title: 'Awal',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.png', apple: '/icone-192.png' },
}

export const viewport = {
  themeColor: '#c9503d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${jeu.variable} ${mot.variable}`}>
      <body className="min-h-dvh">
        <FournisseurAwal>{children}</FournisseurAwal>
      </body>
    </html>
  )
}
