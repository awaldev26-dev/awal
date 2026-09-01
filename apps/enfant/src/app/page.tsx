'use client'

import dynamique from 'next/dynamic'

// L'application entière dépend de localStorage et de l'audio : la rendre
// côté serveur n'apporterait rien et provoquerait un décalage d'hydratation.
const Application = dynamique(
  () => import('./Application.js').then((module) => module.Application),
  { ssr: false },
)

export default function Page() {
  return <Application />
}
