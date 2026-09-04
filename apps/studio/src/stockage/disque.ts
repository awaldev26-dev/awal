import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import type { StockageMedias } from './types'

/** Stockage sur disque, pour le développement et les tests. */
export class StockageDisque implements StockageMedias {
  constructor(
    private readonly racine: string,
    private readonly base: string,
  ) {}

  private chemin(cle: string): string {
    const resolu = resolve(this.racine, cle)
    const dedans = relative(resolve(this.racine), resolu)
    if (dedans.startsWith('..')) throw new Error(`Clé hors de la racine : ${cle}`)
    return resolu
  }

  async ecrire(cle: string, donnees: Uint8Array, _typeMime: string): Promise<void> {
    const chemin = this.chemin(cle)
    await mkdir(dirname(chemin), { recursive: true })
    await writeFile(chemin, donnees)
  }

  async lire(cle: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await readFile(this.chemin(cle)))
    } catch {
      return null
    }
  }

  async existe(cle: string): Promise<boolean> {
    return (await this.lire(cle)) !== null
  }

  urlPublique(): string {
    return this.base
  }
}

export function racineParDefaut(): string {
  return join(process.cwd(), process.env.STOCKAGE_DISQUE_RACINE ?? './medias')
}
