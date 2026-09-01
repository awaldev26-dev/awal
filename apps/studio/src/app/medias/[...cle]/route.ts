import { creerStockage } from '@/stockage/index.js'

/** Sert les médias en développement, quand le stockage est sur disque. */
export async function GET(_requete: Request, contexte: { params: Promise<{ cle: string[] }> }) {
  const { cle } = await contexte.params
  const octets = await creerStockage().lire(cle.join('/'))
  if (!octets) return new Response('introuvable', { status: 404 })
  // Uint8Array<ArrayBufferLike> n'est pas un BodyInit valide depuis TypeScript 5.9 :
  // on passe l'ArrayBuffer sous-jacent, que Response accepte.
  const corps = octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer
  return new Response(corps, { headers: { 'content-type': 'audio/webm' } })
}
