import { describe, expect, it } from 'vitest'
import { corpusMinimal } from '@awal/corpus/fixtures'
import { chargerCorpus, urlAudio } from '@/corpus/charger.js'

describe('chargerCorpus', () => {
  it('valide et renvoie un artefact conforme', async () => {
    const recu = await chargerCorpus(async () => new Response(JSON.stringify(corpusMinimal)))
    expect(recu.entrees).toHaveLength(corpusMinimal.entrees.length)
  })

  it('rejette un artefact non conforme', async () => {
    await expect(
      chargerCorpus(async () => new Response(JSON.stringify({ version: 1 }))),
    ).rejects.toThrow()
  })

  it('rejette une réponse en erreur', async () => {
    await expect(
      chargerCorpus(async () => new Response('nope', { status: 404 })),
    ).rejects.toThrow()
  })
})

describe('urlAudio', () => {
  it('concatène la base et la clé', () => {
    const entree = corpusMinimal.entrees[0]!
    expect(urlAudio(corpusMinimal, entree)).toBe(`${corpusMinimal.urlBaseMedias}${entree.audio}`)
  })

  it('ne double pas la barre oblique', () => {
    const artefact = { ...corpusMinimal, urlBaseMedias: 'https://x.test/' }
    const entree = { ...corpusMinimal.entrees[0]!, audio: '/audio/a.webm' }
    expect(urlAudio(artefact, entree)).toBe('https://x.test/audio/a.webm')
  })
})
