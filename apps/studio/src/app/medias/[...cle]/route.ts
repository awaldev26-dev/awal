import { creerStockage } from '@/stockage/index.js'

/**
 * Types servis. Le MediaRecorder produit du webm sur Chrome et du mp4 sur
 * Safari, et les audios de remplacement sont en wav : annoncer un type
 * erroné suffit à ce que Safari refuse de lire le fichier.
 */
const TYPES: Record<string, string> = {
  webm: 'audio/webm',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  json: 'application/json',
}

/** Sert les médias en développement, quand le stockage est sur disque. */
export async function GET(_requete: Request, contexte: { params: Promise<{ cle: string[] }> }) {
  const { cle } = await contexte.params
  const chemin = cle.join('/')
  const octets = await creerStockage().lire(chemin)
  if (!octets) return new Response('introuvable', { status: 404 })

  const extension = chemin.split('.').pop()?.toLowerCase() ?? ''
  // Uint8Array<ArrayBufferLike> n'est pas un BodyInit valide depuis TypeScript 5.9 :
  // on passe l'ArrayBuffer sous-jacent, que Response accepte.
  const corps = octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer
  return new Response(corps, {
    headers: { 'content-type': TYPES[extension] ?? 'application/octet-stream' },
  })
}
