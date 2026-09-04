import { schemaArtefact } from '../src/artefact.js'
import type { Artefact } from '../src/artefact.js'

/**
 * Corpus valide minimal, partagé par les tests du studio et de l'app enfant.
 * Les mots sont réels et tirés de docs/corpus-v1.md ; les clés audio et pictos
 * sont fictives — les tests injectent leur propre VerificateurMedias.
 */
export const corpusMinimal: Artefact = schemaArtefact.parse({
  version: 1,
  publieLe: '2026-09-01T18:00:00.000Z',
  urlBaseMedias: 'https://media.awal.test/',
  themes: [
    { id: 'manger-et-boire', nom: 'Manger et boire', picto: 'openmoji:1F35E', couleur: '#c94f3d' },
    { id: 'les-animaux', nom: 'Les animaux', picto: 'openmoji:1F408', couleur: '#3d7ec9' },
  ],
  entrees: [
    {
      id: 'aghroum',
      type: 'mot',
      kabyle: 'aghroum',
      kabyleStd: 'aɣrum',
      fr: 'le pain',
      audio: 'audio/aghroum.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F35E',
      themes: ['manger-et-boire'],
      niveau: 1,
      pluriel: 'ighroumen',
    },
    {
      id: 'aman',
      type: 'mot',
      kabyle: 'aman',
      fr: "l'eau",
      audio: 'audio/aman.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F4A7',
      themes: ['manger-et-boire'],
      niveau: 1,
      notes: 'toujours au pluriel en kabyle',
    },
    {
      id: 'amchich',
      type: 'mot',
      kabyle: 'amchich',
      fr: 'le chat',
      audio: 'audio/amchich.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F408',
      themes: ['les-animaux'],
      niveau: 1,
    },
    {
      id: 'aydi',
      type: 'mot',
      kabyle: 'aydi',
      fr: 'le chien',
      audio: 'audio/aydi.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F415',
      themes: ['les-animaux'],
      niveau: 1,
    },
    {
      id: 'etch',
      type: 'mot',
      kabyle: 'etch',
      fr: 'mange',
      audio: 'audio/etch.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F374',
      themes: ['manger-et-boire'],
      niveau: 2,
    },
    {
      id: 'etch-aghroum',
      type: 'phrase',
      kabyle: 'etch aghroum',
      fr: 'mange le pain',
      audio: 'audio/etch-aghroum.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F35E',
      themes: ['manger-et-boire'],
      niveau: 2,
      contient: ['etch', 'aghroum'],
    },
  ],
})
