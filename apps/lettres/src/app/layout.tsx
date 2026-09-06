import type { ReactNode } from 'react'
import { Baloo_2 } from 'next/font/google'
import { AvisParole } from '@/interface/AvisParole'
import { EnregistrerSW } from './EnregistrerSW'
import './globals.css'

/**
 * Une police ronde et épaisse. Les formes des lettres sont le sujet même de
 * l'application : une graisse trop fine les rendrait difficiles à lire de
 * loin, et les empattements ajouteraient des détails à ignorer.
 */
const ronde = Baloo_2({
  subsets: ['latin'],
  variable: '--police',
  display: 'swap',
})

export const metadata = {
  title: 'Les lettres',
  description: 'Découvrir l’alphabet français',
  manifest: '/manifest.webmanifest',
}

export const viewport = {
  themeColor: '#fffdf7',
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={ronde.variable}>
      <body className="min-h-dvh" style={{ fontFamily: 'var(--police), system-ui, sans-serif' }}>
        {children}
        <AvisParole />
        <EnregistrerSW />
      </body>
    </html>
  )
}
