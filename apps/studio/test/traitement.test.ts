import { describe, expect, it } from 'vitest'
import { bornesUtiles, gainNormalisation } from '@/audio/traitement'

const FREQUENCE = 48_000

/** Fabrique des échantillons : du silence, puis un ton, puis du silence. */
function prise({
  silenceAvant,
  parole,
  silenceApres,
  amplitude = 0.3,
}: {
  silenceAvant: number
  parole: number
  silenceApres: number
  amplitude?: number
}): Float32Array {
  const ms = (duree: number) => Math.round((duree / 1000) * FREQUENCE)
  const debut = ms(silenceAvant)
  const milieu = ms(parole)
  const echantillons = new Float32Array(debut + milieu + ms(silenceApres))
  for (let i = 0; i < milieu; i += 1) {
    echantillons[debut + i] = Math.sin((i / FREQUENCE) * 440 * 2 * Math.PI) * amplitude
  }
  return echantillons
}

const enMs = (echantillons: number) => (echantillons / FREQUENCE) * 1000

describe('bornesUtiles', () => {
  it('coupe le silence de tête et de queue', () => {
    const { debut, fin } = bornesUtiles(
      prise({ silenceAvant: 500, parole: 400, silenceApres: 800 }),
      FREQUENCE,
    )
    // Les marges conservées valent 30 ms avant et 120 ms après.
    expect(enMs(debut)).toBeGreaterThan(440)
    expect(enMs(debut)).toBeLessThan(490)
    expect(enMs(fin)).toBeGreaterThan(990)
    expect(enMs(fin)).toBeLessThan(1050)
  })

  it('garde une marge avant l’attaque, qui fait partie du mot', () => {
    const { debut } = bornesUtiles(
      prise({ silenceAvant: 200, parole: 300, silenceApres: 200 }),
      FREQUENCE,
    )
    expect(debut).toBeGreaterThan(0)
    expect(enMs(debut)).toBeLessThan(200)
  })

  it('renvoie l’intervalle entier quand rien ne dépasse le seuil', () => {
    // Une prise muette doit rester écoutable : c'est en l'entendant vide qu'on
    // comprend que le micro n'a rien capté.
    const muette = new Float32Array(FREQUENCE)
    expect(bornesUtiles(muette, FREQUENCE)).toEqual({ debut: 0, fin: FREQUENCE })
  })

  it('ne prend pas une prise douce pour du silence', () => {
    // Le seuil est relatif à la crête : une voix murmurée reste de la parole.
    const douce = prise({ silenceAvant: 300, parole: 400, silenceApres: 300, amplitude: 0.02 })
    const { debut, fin } = bornesUtiles(douce, FREQUENCE)
    expect(enMs(debut)).toBeGreaterThan(240)
    expect(enMs(fin)).toBeLessThan(douce.length)
  })

  it('résiste à un signal sans aucun silence', () => {
    const pleine = prise({ silenceAvant: 0, parole: 500, silenceApres: 0 })
    const { debut, fin } = bornesUtiles(pleine, FREQUENCE)
    expect(debut).toBe(0)
    expect(fin).toBe(pleine.length)
  })

  it('tolère un tableau vide', () => {
    expect(bornesUtiles(new Float32Array(0), FREQUENCE)).toEqual({ debut: 0, fin: 0 })
  })
})

describe('gainNormalisation', () => {
  it('amplifie une prise trop faible', () => {
    const faible = prise({ silenceAvant: 0, parole: 300, silenceApres: 0, amplitude: 0.02 })
    expect(gainNormalisation(faible)).toBeGreaterThan(1)
  })

  it('atténue une prise trop forte', () => {
    const forte = prise({ silenceAvant: 0, parole: 300, silenceApres: 0, amplitude: 0.8 })
    expect(gainNormalisation(forte)).toBeLessThan(1)
  })

  it('amène deux prises de volumes opposés au même niveau efficace', () => {
    // C'est la raison d'être de la fonction : enchaîner vingt cartes sans
    // toucher au volume du téléphone.
    const efficace = (echantillons: Float32Array, gain: number) => {
      let somme = 0
      for (const valeur of echantillons) somme += (valeur * gain) ** 2
      return Math.sqrt(somme / echantillons.length)
    }
    const douce = prise({ silenceAvant: 0, parole: 300, silenceApres: 0, amplitude: 0.05 })
    const forte = prise({ silenceAvant: 0, parole: 300, silenceApres: 0, amplitude: 0.6 })

    const niveauDouce = efficace(douce, gainNormalisation(douce))
    const niveauForte = efficace(forte, gainNormalisation(forte))

    // Les deux doivent viser la même cible à 10 % près, alors qu'elles
    // partaient d'un rapport de 1 à 12.
    expect(Math.abs(niveauDouce - niveauForte)).toBeLessThan(0.01)
    expect(niveauDouce).toBeGreaterThan(0.05)
  })

  it('ne laisse jamais la crête saturer', () => {
    const forte = prise({ silenceAvant: 0, parole: 300, silenceApres: 0, amplitude: 0.95 })
    const gain = gainNormalisation(forte)
    let crete = 0
    for (const valeur of forte) crete = Math.max(crete, Math.abs(valeur * gain))
    expect(crete).toBeLessThan(1)
  })

  it('n’amplifie pas indéfiniment une prise quasi muette', () => {
    // Sans plafond, le seul souffle du micro deviendrait le sujet principal.
    const presqueRien = prise({
      silenceAvant: 0,
      parole: 300,
      silenceApres: 0,
      amplitude: 0.0001,
    })
    expect(gainNormalisation(presqueRien)).toBeLessThanOrEqual(8)
  })

  it('laisse le silence intact plutôt que de diviser par zéro', () => {
    expect(gainNormalisation(new Float32Array(1000))).toBe(1)
  })

  it('tolère un tableau vide', () => {
    expect(gainNormalisation(new Float32Array(0))).toBe(1)
  })
})
