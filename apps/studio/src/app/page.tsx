import Link from 'next/link'
import { db } from '@/db/index.js'
import { entrees, publications } from '@/db/schema.js'
import { Publication } from './Publication.js'

export const dynamic = 'force-dynamic'

export default async function Accueil() {
  const [lignes, faites] = await Promise.all([
    db.select().from(entrees),
    db.select().from(publications),
  ])
  const enregistrees = lignes.filter((l) => l.audio).length
  const derniere = faites.sort((a, b) => b.version - a.version)[0]

  return (
    <main style={{ padding: 24, maxWidth: 560 }}>
      <h1>Studio Awal</h1>
      <p>
        <strong>{enregistrees}</strong> entrées enregistrées sur <strong>{lignes.length}</strong>.
      </p>
      <p>
        {derniere
          ? `Dernière publication : v${derniere.version}, ${derniere.nbEntrees} entrées.`
          : 'Jamais publié.'}
      </p>
      <p><Link href="/entrees">Saisir et enregistrer →</Link></p>
      <Publication />
    </main>
  )
}
