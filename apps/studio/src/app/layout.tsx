import type { ReactNode } from 'react'
import './globals.css'

export const metadata = { title: 'Studio Awal' }

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
