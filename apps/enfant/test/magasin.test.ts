import { beforeEach, describe, expect, it } from 'vitest'
import { MagasinLocal } from '@/stockage/local.js'
import { progressionVide } from '@/moteur/types.js'

const idir = { id: 'idir', prenom: 'Idir', avatar: '🦊', age: 6 }

beforeEach(() => localStorage.clear())

describe('MagasinLocal', () => {
  it('part sans aucun profil', () => {
    expect(new MagasinLocal().profils()).toEqual([])
  })

  it('ajoute puis relit un profil', () => {
    const m = new MagasinLocal()
    m.ajouterProfil(idir)
    expect(new MagasinLocal().profils()).toEqual([idir])
  })

  it('remplace un profil de même identifiant', () => {
    const m = new MagasinLocal()
    m.ajouterProfil(idir)
    m.ajouterProfil({ ...idir, age: 7 })
    expect(m.profils()).toHaveLength(1)
    expect(m.profils()[0]?.age).toBe(7)
  })

  it('supprime un profil et sa progression', () => {
    const m = new MagasinLocal()
    m.ajouterProfil(idir)
    m.enregistrer('idir', { ...progressionVide(), joursJoues: ['2026-09-07'] })
    m.supprimerProfil('idir')
    expect(m.profils()).toEqual([])
    expect(new MagasinLocal().progression('idir').joursJoues).toEqual([])
  })

  it('rend une progression vide pour un profil inconnu', () => {
    expect(new MagasinLocal().progression('personne')).toEqual(progressionVide())
  })

  it('conserve la progression d’une instance à l’autre', () => {
    const m = new MagasinLocal()
    m.enregistrer('idir', {
      etats: { a: { boite: 3, prochaine: '2026-09-09' } },
      nouveauxParJour: { '2026-09-07': 2 },
      joursJoues: ['2026-09-07'],
    })
    const relu = new MagasinLocal().progression('idir')
    expect(relu.etats.a?.boite).toBe(3)
    expect(relu.nouveauxParJour['2026-09-07']).toBe(2)
  })

  it('sépare les progressions de deux profils', () => {
    const m = new MagasinLocal()
    m.enregistrer('idir', { ...progressionVide(), joursJoues: ['2026-09-07'] })
    m.enregistrer('lyes', { ...progressionVide(), joursJoues: ['2026-09-08'] })
    expect(m.progression('idir').joursJoues).toEqual(['2026-09-07'])
    expect(m.progression('lyes').joursJoues).toEqual(['2026-09-08'])
  })

  it('survit à des données corrompues plutôt que de planter', () => {
    localStorage.setItem('awal.progression.idir', 'ceci n’est pas du JSON')
    expect(new MagasinLocal().progression('idir')).toEqual(progressionVide())
  })
})
