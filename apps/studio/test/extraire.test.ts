import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extraireCorpus, motsContenus, versSlug } from '../seed/extraire.js'

const markdown = readFileSync(
  join(import.meta.dirname, '../../../docs/corpus-v1.md'),
  'utf8',
)

describe('versSlug', () => {
  it('met en minuscules et remplace les espaces', () => {
    expect(versSlug('amek thellidh ?')).toBe('amek-thellidh')
  })

  it('conserve le chiffre 3 qui note une consonne', () => {
    expect(versSlug('a3oudiw')).toBe('a3oudiw')
  })

  it('supprime la ponctuation', () => {
    expect(versSlug('d achou-t ?')).toBe('d-achou-t')
  })
})

describe('extraireCorpus', () => {
  const { themes, entrees } = extraireCorpus(markdown)

  it('trouve les douze thèmes', () => {
    expect(themes).toHaveLength(12)
    expect(themes.map((t) => t.nom)).toContain('Les verbes')
  })

  it('extrait toutes les entrées du document', () => {
    expect(entrees.length).toBe(243)
  })

  it('produit des identifiants uniques', () => {
    expect(new Set(entrees.map((e) => e.id)).size).toBe(entrees.length)
  })

  it('rattache chaque entrée à un thème connu', () => {
    const ids = new Set(themes.map((t) => t.id))
    expect(entrees.every((e) => ids.has(e.theme))).toBe(true)
  })

  it('marque comme à valider les entrées portant un avertissement', () => {
    const setti = entrees.find((e) => e.kabyle === 'setti')
    expect(setti?.aValider).toBe(true)
  })

  it('sort la précision entre parenthèses du mot vers les notes', () => {
    const yiwen = entrees.find((e) => e.id === 'yiwen')
    expect(yiwen?.kabyle).toBe('yiwen')
    expect(yiwen?.notes).toContain('fém. yiwet')
  })

  it('suffixe les homonymes plutôt que de les écraser', () => {
    expect(entrees.find((e) => e.id === 'lekhrif')?.fr).toBe('figue')
    expect(entrees.find((e) => e.id === 'lekhrif-2')?.fr).toBe('automne')
  })

  it('renseigne toujours kabyle et français', () => {
    expect(entrees.every((e) => e.kabyle.length > 0 && e.fr.length > 0)).toBe(true)
  })
})

describe('motsContenus', () => {
  const connus = new Map([
    ['aghroum', 'aghroum'],
    ['aman', 'aman'],
    ['efk', 'efk'],
    ['anda', 'anda'],
    ['baba', 'baba'],
    ['as-ed', 'as-ed'],
    ['amek', 'amek'],
    ['amek thellidh', 'amek-thellidh'],
    ['ar toufath', 'ar-toufath'],
    ['yemma', 'yemma'],
    ['af', 'af'],
  ])

  it('trouve les mots simples', () => {
    expect(motsContenus('etch aghroum', connus)).toEqual(['aghroum'])
  })

  it('reconnaît un mot porteur d’un pronom suffixé', () => {
    // « efk-iyi » doit ramener « efk », pas être ignoré.
    expect(motsContenus('efk-iyi aman', connus).sort()).toEqual(['aman', 'efk'])
  })

  it('reconnaît anda-t comme anda', () => {
    expect(motsContenus('anda-t baba ?', connus).sort()).toEqual(['anda', 'baba'])
  })

  it('préfère la forme la plus longue', () => {
    // « as-ed » est un mot à part entière : ne pas le couper.
    expect(motsContenus('a baba, as-ed', connus).sort()).toEqual(['as-ed', 'baba'])
  })

  it('trouve les expressions de plusieurs mots', () => {
    expect(motsContenus('amek thellidh a baba ?', connus).sort()).toEqual([
      'amek-thellidh', 'baba',
    ])
  })

  it('trouve une expression en fin de phrase', () => {
    expect(motsContenus('ar toufath a yemma', connus).sort()).toEqual(['ar-toufath', 'yemma'])
  })

  it('ignore les particules qui ne sont pas du vocabulaire', () => {
    // « d » et « a » sont des particules : aucun mot ne doit être inventé.
    expect(motsContenus('d aghroum', connus)).toEqual(['aghroum'])
    expect(motsContenus('a yemma', connus)).toEqual(['yemma'])
  })

  it('ne rend jamais deux fois le même identifiant', () => {
    expect(motsContenus('aman aman', connus)).toEqual(['aman'])
  })

  it('ne rend rien sur une phrase sans mot connu', () => {
    expect(motsContenus('bonjour tout le monde', connus)).toEqual([])
  })
})

describe('extraction des phrases', () => {
  const { themes, entrees } = extraireCorpus(markdown)

  it('ajoute un douzième thème pour les phrases', () => {
    expect(themes).toHaveLength(12)
    expect(themes.map((t) => t.nom)).toContain('Phrases')
  })

  it('extrait les trente phrases', () => {
    expect(entrees.filter((e) => e.type === 'phrase')).toHaveLength(30)
  })

  it('classe tout le reste comme mots', () => {
    expect(entrees.filter((e) => e.type === 'mot')).toHaveLength(213)
  })

  it('renseigne contient pour chaque phrase', () => {
    const phrases = entrees.filter((e) => e.type === 'phrase')
    expect(phrases.every((p) => p.contient.length > 0)).toBe(true)
  })

  it('reconnaît les mots interrogatifs malgré leur point d’interrogation', () => {
    // Le document note « anda ? » : la normalisation doit le rendre trouvable.
    const ou = entrees.find((e) => e.id === 'anda-t-baba')
    expect(ou?.contient.sort()).toEqual(['anda', 'baba'])
    const comment = entrees.find((e) => e.id === 'amek-thellidh-a-baba')
    expect(comment?.contient).toContain('amek-thellidh')
  })

  it('ne fait référence qu’à des mots existants', () => {
    const idsMots = new Set(entrees.filter((e) => e.type === 'mot').map((e) => e.id))
    const orphelines = entrees
      .filter((e) => e.type === 'phrase')
      .flatMap((p) => p.contient.filter((id) => !idsMots.has(id)))
    expect(orphelines).toEqual([])
  })

  it('laisse le champ contient vide sur les mots', () => {
    expect(entrees.filter((e) => e.type === 'mot').every((e) => e.contient.length === 0)).toBe(true)
  })

  it('marque toutes les phrases à valider', () => {
    expect(entrees.filter((e) => e.type === 'phrase').every((p) => p.aValider)).toBe(true)
  })
})

describe('ordre des entrées', () => {
  const { entrees } = extraireCorpus(markdown)

  it('numérote les entrées dans l’ordre du document', () => {
    // L'ordre du document est un choix éditorial : les mots les plus courants
    // d'abord. L'imagier doit le respecter, donc l'extraction le fige.
    expect(entrees.map((e) => e.ordre)).toEqual(entrees.map((_, index) => index))
  })

  it('place la famille avant les phrases', () => {
    const baba = entrees.find((e) => e.id === 'baba')
    const phrase = entrees.find((e) => e.type === 'phrase')
    expect(baba?.ordre).toBeLessThan(phrase?.ordre ?? -1)
  })

  it('conserve l’ordre à l’intérieur d’un thème', () => {
    const animaux = entrees.filter((e) => e.theme === 'les-animaux')
    expect(animaux.map((e) => e.id).slice(0, 3)).toEqual(['amchich', 'aydi', 'thafounasth'])
  })
})
