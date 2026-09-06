/**
 * Lecture audio robuste sur mobile.
 *
 * Deux contraintes dictent ce code : Safari iOS refuse toute lecture qui ne
 * descend pas d'un geste utilisateur, et 300 ms de latence suffisent à rendre
 * un jeu poussif. D'où le déverrouillage au premier tap et le préchargement.
 */
export class Lecteur {
  private readonly cache = new Map<string, HTMLAudioElement>()
  private deverrouille = false

  /** À appeler depuis un gestionnaire de clic, une seule fois par session. */
  deverrouiller(): void {
    if (this.deverrouille) return
    const silence = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    )
    void silence.play().catch(() => undefined)
    this.deverrouille = true
  }

  async precharger(urls: string[]): Promise<void> {
    await Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resoudre) => {
            if (this.cache.has(url)) return resoudre()
            const audio = new Audio()
            // Sans crossOrigin, une requête média vers une autre origine part
            // en no-cors et contourne le service worker : le fichier se lit,
            // mais ne se met jamais en cache — donc pas de son hors ligne.
            audio.crossOrigin = 'anonymous'
            audio.preload = 'auto'
            const fini = () => resoudre()
            audio.addEventListener('canplaythrough', fini, { once: true })
            // Un audio manquant ne doit pas bloquer le démarrage de la session.
            audio.addEventListener('error', fini, { once: true })
            audio.src = url
            this.cache.set(url, audio)
          }),
      ),
    )
  }

  async jouer(url: string): Promise<void> {
    let audio = this.cache.get(url)
    if (!audio) {
      audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.src = url
      this.cache.set(url, audio)
    }
    audio.currentTime = 0
    try {
      await audio.play()
    } catch {
      // Lecture refusée par le navigateur : on ne casse pas le jeu pour autant.
    }
  }
}

/**
 * Joue un son et n'attend pas son démarrage mais sa fin.
 *
 * `Lecteur.jouer` rend la main dès que la lecture commence, ce qui suffit à un
 * jeu mais pas à enchaîner deux sons : l'Écho doit faire entendre le modèle
 * puis la voix de l'enfant, dans cet ordre et sans chevauchement.
 *
 * Hors du cache du Lecteur, volontairement : une URL `blob:` est révoquée après
 * usage, et la garder en cache ferait grossir une table d'entrées mortes.
 *
 * Une erreur de lecture résout au lieu de rejeter — un son manquant ne doit pas
 * interrompre l'exercice.
 */
export function jouerJusquAuBout(url: string): Promise<void> {
  return new Promise((resoudre) => {
    const audio = new Audio()
    // Seules les URL distantes ont besoin du mode CORS ; l'imposer à un blob
    // local n'apporte rien et échoue sur certains navigateurs.
    if (!url.startsWith('blob:')) audio.crossOrigin = 'anonymous'

    const finir = () => resoudre()
    audio.addEventListener('ended', finir, { once: true })
    audio.addEventListener('error', finir, { once: true })

    audio.src = url
    void audio.play().catch(finir)
  })
}
