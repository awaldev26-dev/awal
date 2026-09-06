/**
 * Enregistrement de la voix de l'enfant, pour l'Écho.
 *
 * Rien n'est conservé. La prise vit en mémoire le temps de la réécoute, puis
 * son URL est révoquée. Ce n'est pas une limite subie mais un choix : il n'y a
 * ainsi ni quota à surveiller, ni purge à écrire, ni voix d'enfant qui reste
 * sur l'appareil.
 *
 * La prise n'est pas traitée, contrairement à celles du studio : l'enfant doit
 * s'entendre tel qu'il est, c'est tout l'intérêt de l'exercice.
 */

/**
 * Durée au-delà de laquelle la prise s'arrête d'elle-même. Un enfant peut
 * très bien lancer l'enregistrement puis poser l'appareil et s'en aller.
 */
export const DUREE_MAX_S = 6

/** Le micro a été refusé, ou aucun n'est disponible. */
export class MicroRefuse extends Error {
  constructor() {
    super('micro refusé')
    this.name = 'MicroRefuse'
  }
}

export class Micro {
  private graveur: MediaRecorder | null = null
  private flux: MediaStream | null = null
  private morceaux: Blob[] = []

  /**
   * Vrai si l'appareil sait enregistrer. Faux sur un navigateur ancien, et
   * faux aussi en HTTP hors localhost, où l'accès au micro est interdit.
   */
  static disponible(): boolean {
    return (
      typeof MediaRecorder !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function'
    )
  }

  get enCours(): boolean {
    return this.graveur?.state === 'recording'
  }

  /** Ouvre le micro et commence à enregistrer. */
  async demarrer(): Promise<void> {
    this.annuler()

    let flux: MediaStream
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      // Refus de l'utilisateur, absence de micro, page non sécurisée : du point
      // de vue de l'écran, ces cas se traitent tous de la même façon.
      throw new MicroRefuse()
    }

    const morceaux: Blob[] = []
    const graveur = new MediaRecorder(flux)
    graveur.ondataavailable = (evenement) => {
      if (evenement.data.size > 0) morceaux.push(evenement.data)
    }

    this.morceaux = morceaux
    this.flux = flux
    this.graveur = graveur
    graveur.start()
  }

  /**
   * Arrête la prise et renvoie une URL jouable.
   *
   * À révoquer par l'appelant dès qu'elle ne sert plus : c'est lui qui sait
   * quand la réécoute est terminée.
   */
  arreter(): Promise<string> {
    const graveur = this.graveur
    if (!graveur || graveur.state === 'inactive') {
      return Promise.reject(new Error('aucune prise en cours'))
    }

    return new Promise((resoudre) => {
      graveur.onstop = () => {
        this.fermerFlux()
        this.graveur = null
        resoudre(URL.createObjectURL(new Blob(this.morceaux, { type: graveur.mimeType })))
      }
      graveur.stop()
    })
  }

  /** Referme le micro sans rien produire. À appeler en quittant l'écran. */
  annuler(): void {
    if (this.graveur && this.graveur.state !== 'inactive') {
      this.graveur.onstop = null
      this.graveur.stop()
    }
    this.graveur = null
    this.morceaux = []
    this.fermerFlux()
  }

  /**
   * Libère le micro. Sans cela, l'indicateur d'enregistrement du système reste
   * allumé après l'exercice, ce qui inquiète à juste titre.
   */
  private fermerFlux(): void {
    if (!this.flux) return
    for (const piste of this.flux.getTracks()) piste.stop()
    this.flux = null
  }
}
