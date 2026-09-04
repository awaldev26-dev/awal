import { schemaArtefact, type Artefact, type Entree } from '@awal/corpus'

export const URL_CORPUS = process.env.NEXT_PUBLIC_URL_CORPUS ?? '/corpus/actuel.json'

type Fetcher = (url: string) => Promise<Response>

/**
 * Télécharge l'artefact publié et le valide avant usage. Le service worker
 * s'occupe du cache : ici on suppose simplement que la requête aboutit,
 * en ligne comme hors ligne.
 */
export async function chargerCorpus(fetcher: Fetcher = (url) => fetch(url)): Promise<Artefact> {
  const reponse = await fetcher(URL_CORPUS)
  if (!reponse.ok) throw new Error(`Corpus indisponible (${reponse.status}).`)
  return schemaArtefact.parse(await reponse.json())
}

export function urlAudio(artefact: Artefact, entree: Entree): string {
  const base = artefact.urlBaseMedias.replace(/\/+$/, '')
  const cle = entree.audio.replace(/^\/+/, '')
  return `${base}/${cle}`
}
