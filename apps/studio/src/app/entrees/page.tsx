import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { db } from '@/db/index.js'
import { entrees } from '@/db/schema.js'
import { emojiDepuisPicto } from '@/stockage/index.js'

export const dynamic = 'force-dynamic'

export default async function ListeEntrees() {
  const lignes = await db.select().from(entrees).orderBy(asc(entrees.id))
  const enregistrees = lignes.filter((l) => l.audio).length

  return (
    <main style={{ padding: 24 }}>
      <h1>Entrées</h1>
      <p>
        {enregistrees} / {lignes.length} enregistrées
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 4 }}>
        {lignes.map((ligne) => (
          <li key={ligne.id}>
            <Link
              href={`/entrees/${ligne.id}`}
              style={{ display: 'flex', gap: 12, padding: 8, textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ fontSize: 24 }}>{emojiDepuisPicto(ligne.picto)}</span>
              <strong style={{ minWidth: 160 }}>{ligne.kabyle}</strong>
              <span style={{ opacity: 0.7, flex: 1 }}>{ligne.fr}</span>
              <span>{ligne.audio ? '🔊' : '—'}</span>
              <span>{ligne.aValider ? '⚠️' : '✅'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
