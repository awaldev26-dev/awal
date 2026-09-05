import { cookies } from 'next/headers'
import { NOM_COOKIE, verifierSession } from './session'

export { verifierSession as sessionValide }

/**
 * Refuse l'exécution si la session n'est pas valide.
 *
 * Le proxy redirige déjà les visiteurs non connectés, mais la documentation de
 * Next déconseille d'en faire la seule autorisation : une action serveur est un
 * point d'entrée à part entière, appelable directement. Le studio pouvant
 * écrire dans le stockage et republier le corpus, chaque action qui modifie
 * quelque chose revérifie ici.
 */
export async function exigerSession(): Promise<void> {
  const magasin = await cookies()
  if (!(await verifierSession(magasin.get(NOM_COOKIE)?.value))) {
    throw new Error('Session absente ou expirée.')
  }
}
