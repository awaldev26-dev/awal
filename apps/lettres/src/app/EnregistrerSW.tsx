'use client'

import { useEffect } from 'react'

/**
 * Enregistre le service worker.
 *
 * Isolé dans son composant plutôt que glissé dans une page : le layout est un
 * composant serveur, et cet enregistrement doit tourner dans le navigateur.
 *
 * Seulement en production : en développement, un service worker sert des
 * fichiers périmés et fait croire à des bugs qui n'existent pas.
 */
export function EnregistrerSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  }, [])

  return null
}
