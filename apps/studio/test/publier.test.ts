import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { schemaArtefact, type Artefact } from '@awal/corpus'
import { StockageDisque } from '@/stockage/disque'
import { CLE_ACTUEL, publierArtefact } from '@/publication/publier'

const racines: string[] = []

function stockage() {
  const racine = mkdtempSync(join(tmpdir(), 'awal-pub-'))
  racines.push(racine)
  return new StockageDisque(racine, 'https://medias.awal.test/')
}

afterEach(() => {
  for (const racine of racines.splice(0)) rmSync(racine, { recursive: true, force: true })
})

function artefact(reste: Partial<Artefact> = {}): Artefact {
  return schemaArtefact.parse({
    version: 2,
    publieLe: '2026-09-01T18:00:00.000Z',
    urlBaseMedias: 'https://medias.awal.test/',
    themes: [{ id: 'animaux', nom: 'Animaux', picto: 'openmoji:1F408', couleur: '#3d7ec9' }],
    entrees: [{
      id: 'amchich', type: 'mot', kabyle: 'amchich', fr: 'le chat',
      audio: 'audio/amchich.webm', variante: 'kabyle-nord',
      picto: 'openmoji:1F408', themes: ['animaux'],
    }],
    ...reste,
  })
}

async function avecAudio() {
  const s = stockage()
  await s.ecrire('audio/amchich.webm', new Uint8Array([1, 2, 3]), 'audio/webm')
  return s
}

describe('publierArtefact', () => {
  it('publie quand tout est valide', async () => {
    const s = await avecAudio()
    const resultat = await publierArtefact(artefact(), s)
    expect(resultat.ok).toBe(true)
    if (resultat.ok) {
      expect(resultat.version).toBe(2)
      expect(resultat.cle).toBe('corpus/v2.json')
    }
  })

  it('écrit la version figée et le fichier actuel', async () => {
    const s = await avecAudio()
    await publierArtefact(artefact(), s)
    expect(await s.existe('corpus/v2.json')).toBe(true)
    expect(await s.existe(CLE_ACTUEL)).toBe(true)
  })

  it('écrit un JSON relisible et conforme', async () => {
    const s = await avecAudio()
    await publierArtefact(artefact(), s)
    const octets = await s.lire(CLE_ACTUEL)
    const relu = JSON.parse(new TextDecoder().decode(octets ?? new Uint8Array()))
    expect(() => schemaArtefact.parse(relu)).not.toThrow()
    expect(relu.entrees[0].kabyle).toBe('amchich')
  })

  it('refuse de publier un mot muet et n’écrit rien', async () => {
    const s = stockage()
    const resultat = await publierArtefact(artefact(), s)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.problemes.map((p) => p.code)).toEqual(['audio-absent'])
    expect(await s.existe(CLE_ACTUEL)).toBe(false)
  })

  it('refuse un artefact structurellement invalide', async () => {
    const s = await avecAudio()
    const casse = artefact({
      entrees: [{
        id: 'amchich', type: 'mot', kabyle: 'amchich', fr: 'le chat',
        audio: 'audio/amchich.webm', variante: 'kabyle-nord',
        picto: 'openmoji:1F408', themes: ['theme-fantome'], niveau: 1,
        contient: [], notes: '',
      }],
    })
    const resultat = await publierArtefact(casse, s)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.problemes.map((p) => p.code)).toContain('theme-inconnu')
  })

  it('signale une image de picto manquante', async () => {
    // Un picto emoji vaut par sa seule syntaxe ; une image doit exister dans
    // le stockage. C'est le seul cas où « picto-absent » a un sens, une
    // référence mal formée étant refusée plus tôt par le schéma.
    const s = await avecAudio()
    const avecImage = artefact({
      entrees: [{
        id: 'amchich', type: 'mot', kabyle: 'amchich', fr: 'le chat',
        audio: 'audio/amchich.webm', variante: 'kabyle-nord',
        picto: 'image:pictos/amchich.webp', themes: ['animaux'],
        niveau: 1, contient: [], notes: '',
      }],
    })
    const resultat = await publierArtefact(avecImage, s)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.problemes.map((p) => p.code)).toEqual(['picto-absent'])
  })

  it('publie quand l’image du picto est présente', async () => {
    const s = await avecAudio()
    await s.ecrire('pictos/amchich.webp', new Uint8Array([1, 2]), 'image/webp')
    const avecImage = artefact({
      entrees: [{
        id: 'amchich', type: 'mot', kabyle: 'amchich', fr: 'le chat',
        audio: 'audio/amchich.webm', variante: 'kabyle-nord',
        picto: 'image:pictos/amchich.webp', themes: ['animaux'],
        niveau: 1, contient: [], notes: '',
      }],
    })
    expect((await publierArtefact(avecImage, s)).ok).toBe(true)
  })

  it('remonte tous les problèmes d’un coup', async () => {
    const s = stockage()
    const casse = artefact({
      entrees: [{
        id: 'amchich', type: 'mot', kabyle: 'amchich', fr: 'le chat',
        audio: 'audio/amchich.webm', variante: 'kabyle-nord',
        picto: 'image:pictos/absente.webp', themes: ['theme-fantome'],
        niveau: 1, contient: [], notes: '',
      }],
    })
    const resultat = await publierArtefact(casse, s)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) {
      expect(resultat.problemes.map((p) => p.code).sort())
        .toEqual(['audio-absent', 'picto-absent', 'theme-inconnu'])
    }
  })
})
