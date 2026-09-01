import Link from 'next/link'
import type { LigneEntree } from '@/db/schema.js'
import { emojiDepuisPicto } from '@/stockage/index.js'
import { enregistrerEntree } from '@/app/actions.js'
import { Enregistreur } from '@/app/Enregistreur.js'

const champ = { width: '100%', padding: 8, fontSize: 16, marginBottom: 12 } as const

export function Editeur({ ligne }: { ligne: LigneEntree }) {
  return (
    <main style={{ padding: 24, maxWidth: 560 }}>
      <Link href="/entrees">← toutes les entrées</Link>
      <h1 style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 40 }}>{emojiDepuisPicto(ligne.picto)}</span>
        {ligne.kabyle}
      </h1>

      <Enregistreur id={ligne.id} audioActuel={ligne.audio} />

      <form action={enregistrerEntree} style={{ marginTop: 24 }}>
        <input type="hidden" name="id" value={ligne.id} />
        <label>
          Kabyle
          <input name="kabyle" defaultValue={ligne.kabyle} style={champ} />
        </label>
        <label>
          Français
          <input name="fr" defaultValue={ligne.fr} style={champ} />
        </label>
        <label>
          Pluriel
          <input name="pluriel" defaultValue={ligne.pluriel ?? ''} style={champ} />
        </label>
        <label>
          Niveau
          <input type="number" name="niveau" min={1} max={3} defaultValue={ligne.niveau} style={champ} />
        </label>
        <label>
          Notes
          <input name="notes" defaultValue={ligne.notes} style={champ} />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <input type="checkbox" name="aValider" defaultChecked={ligne.aValider} /> à valider
        </label>
        <button type="submit" style={{ padding: '8px 16px' }}>Enregistrer</button>
      </form>
    </main>
  )
}
