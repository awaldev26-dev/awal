export interface StockageMedias {
  ecrire(cle: string, donnees: Uint8Array, typeMime: string): Promise<void>
  lire(cle: string): Promise<Uint8Array | null>
  existe(cle: string): Promise<boolean>
  /** Base d'URL publique, barre finale comprise. Inscrite dans l'artefact publié. */
  urlPublique(): string
}
