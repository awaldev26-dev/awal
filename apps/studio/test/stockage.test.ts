import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { StockageDisque } from '@/stockage/disque'
import { creerVerificateur } from '@/stockage/index'

const racines: string[] = []

function stockage() {
  const racine = mkdtempSync(join(tmpdir(), 'awal-'))
  racines.push(racine)
  return new StockageDisque(racine, 'http://localhost:3001/medias/')
}

afterEach(() => {
  for (const racine of racines.splice(0)) rmSync(racine, { recursive: true, force: true })
})

describe('StockageDisque', () => {
  it('écrit puis relit le même contenu', async () => {
    const s = stockage()
    await s.ecrire('audio/aman.webm', new Uint8Array([1, 2, 3]), 'audio/webm')
    expect(Array.from((await s.lire('audio/aman.webm')) ?? [])).toEqual([1, 2, 3])
  })

  it('signale l’absence d’une clé inconnue', async () => {
    expect(await stockage().existe('audio/absent.webm')).toBe(false)
  })

  it('renvoie null en lecture sur une clé inconnue', async () => {
    expect(await stockage().lire('audio/absent.webm')).toBeNull()
  })

  it('crée les dossiers intermédiaires', async () => {
    const s = stockage()
    await s.ecrire('corpus/v1/artefact.json', new Uint8Array([123]), 'application/json')
    expect(await s.existe('corpus/v1/artefact.json')).toBe(true)
  })

  it('refuse une clé qui tente de sortir de la racine', async () => {
    await expect(stockage().ecrire('../evasion', new Uint8Array([1]), 'text/plain')).rejects.toThrow()
  })

  it('expose son url publique', () => {
    expect(stockage().urlPublique()).toBe('http://localhost:3001/medias/')
  })
})

describe('creerVerificateur', () => {
  it('confirme un audio présent et refuse un absent', async () => {
    const s = stockage()
    await s.ecrire('audio/aman.webm', new Uint8Array([1]), 'audio/webm')
    const v = creerVerificateur(s)
    expect(await v.audioExiste('audio/aman.webm')).toBe(true)
    expect(await v.audioExiste('audio/rien.webm')).toBe(false)
  })

  it('valide les pictos sans toucher au stockage', async () => {
    const v = creerVerificateur(stockage())
    expect(await v.pictoExiste('openmoji:1F35E')).toBe(true)
    expect(await v.pictoExiste('cassé')).toBe(false)
  })
})
