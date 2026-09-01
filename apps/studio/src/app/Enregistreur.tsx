'use client'

import { useRef, useState } from 'react'
import { televerserAudio } from './actions.js'

export function Enregistreur({ id, audioActuel }: { id: string; audioActuel: string | null }) {
  const [etat, setEtat] = useState<'pret' | 'enregistre' | 'envoi'>('pret')
  const [apercu, setApercu] = useState<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const morceaux = useRef<Blob[]>([])

  async function demarrer() {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: true })
    morceaux.current = []
    const enregistreur = new MediaRecorder(flux)
    enregistreur.ondataavailable = (evenement) => morceaux.current.push(evenement.data)
    enregistreur.onstop = async () => {
      for (const piste of flux.getTracks()) piste.stop()
      const blob = new Blob(morceaux.current, { type: enregistreur.mimeType })
      setApercu(URL.createObjectURL(blob))
      setEtat('envoi')
      const extension = enregistreur.mimeType.includes('mp4') ? 'mp4' : 'webm'
      await televerserAudio(id, new File([blob], `${id}.${extension}`, { type: enregistreur.mimeType }))
      setEtat('pret')
    }
    recorder.current = enregistreur
    enregistreur.start()
    setEtat('enregistre')
  }

  function arreter() {
    recorder.current?.stop()
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
      {etat === 'enregistre' ? (
        <button type="button" onClick={arreter} style={{ padding: '8px 16px' }}>
          ⏹ Arrêter
        </button>
      ) : (
        <button type="button" onClick={demarrer} disabled={etat === 'envoi'} style={{ padding: '8px 16px' }}>
          {etat === 'envoi' ? 'Envoi…' : '⏺ Enregistrer'}
        </button>
      )}
      {apercu ? <audio controls src={apercu} /> : null}
      {!apercu && audioActuel ? <audio controls src={`/medias/${audioActuel}`} /> : null}
      {!apercu && !audioActuel ? <span style={{ color: '#b0413e' }}>aucun audio</span> : null}
    </div>
  )
}
