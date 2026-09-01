import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db } from '@/db/index.js'
import { entrees } from '@/db/schema.js'
import { Editeur } from './Editeur.js'

export const dynamic = 'force-dynamic'

export default async function PageEntree(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const [ligne] = await db.select().from(entrees).where(eq(entrees.id, id))
  if (!ligne) notFound()
  return <Editeur ligne={ligne} />
}
