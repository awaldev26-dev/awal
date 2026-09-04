import { describe, expect, it } from 'vitest'
import { corpusMinimal } from '../fixtures/corpus-minimal'
import { schemaArtefact } from '../src/artefact'
import { validerStructure } from '../src/validation'

describe('corpusMinimal', () => {
  it('est conforme au schéma', () => {
    expect(() => schemaArtefact.parse(corpusMinimal)).not.toThrow()
  })

  it('ne présente aucun problème structurel', () => {
    expect(validerStructure(corpusMinimal)).toEqual([])
  })

  it('couvre les cas utiles aux tests des deux applications', () => {
    expect(corpusMinimal.themes.length).toBeGreaterThanOrEqual(2)
    expect(corpusMinimal.entrees.some((e) => e.type === 'phrase')).toBe(true)
    expect(corpusMinimal.entrees.some((e) => e.pluriel !== undefined)).toBe(true)
    expect(corpusMinimal.entrees.some((e) => e.kabyleStd !== undefined)).toBe(true)
    expect(new Set(corpusMinimal.entrees.map((e) => e.niveau)).size).toBeGreaterThanOrEqual(2)
  })
})
