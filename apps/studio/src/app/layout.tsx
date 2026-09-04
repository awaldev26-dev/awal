import type { ReactNode } from 'react'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Chargées par next/font : elles sont servies depuis le domaine du studio,
// donc disponibles même sans réseau une fois la page en cache.
const interface_ = Inter({
  subsets: ['latin'],
  variable: '--police-interface',
  display: 'swap',
})

const kabyle = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--police-kabyle',
  display: 'swap',
})

export const metadata = { title: 'Studio Awal' }

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${interface_.variable} ${kabyle.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
