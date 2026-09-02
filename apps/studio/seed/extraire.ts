export interface ThemeSeed {
  id: string
  nom: string
  ordre: number
}

export interface EntreeSeed {
  id: string
  type: 'mot' | 'phrase'
  kabyle: string
  fr: string
  theme: string
  /** Identifiants des mots employés. Vide pour un mot. */
  contient: string[]
  notes: string
  aValider: boolean
}

/** Titres de section à ignorer : ils ne décrivent pas des thèmes de vocabulaire. */
const SECTIONS_HORS_CORPUS = /^(Critère|Convention|Volumétrie|Ce qui a été retiré)/

/** Nom de la section dont les entrées sont des phrases et non des mots. */
const SECTION_PHRASES = 'Phrases'

/**
 * Repère, dans une phrase, les mots du corpus qu'elle emploie.
 *
 * Deux passes, car deux difficultés distinctes : les expressions de plusieurs
 * mots (« ar toufath ») se cherchent par inclusion, tandis qu'un mot simple
 * peut porter un pronom suffixé (« efk-iyi », « anda-t ») et se cherche donc
 * comme préfixe de token. La forme la plus longue gagne, pour que « as-ed »
 * ne soit pas réduit à autre chose.
 *
 * @param connus forme kabyle → identifiant
 */
export function normaliser(texte: string): string {
  return texte.toLowerCase().replace(/[?!.,;:]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function motsContenus(phrase: string, connus: Map<string, string>): string[] {
  const nettoyee = normaliser(phrase)
  const trouves: string[] = []
  let restant = ` ${nettoyee} `

  const expressions = [...connus.keys()]
    .filter((forme) => forme.includes(' '))
    .sort((a, b) => b.length - a.length)

  for (const forme of expressions) {
    if (restant.includes(` ${forme} `)) {
      const id = connus.get(forme)
      if (id && !trouves.includes(id)) trouves.push(id)
      restant = restant.replace(` ${forme} `, '  ')
    }
  }

  const simples = [...connus.keys()]
    .filter((forme) => !forme.includes(' '))
    .sort((a, b) => b.length - a.length)

  for (const token of restant.trim().split(' ').filter(Boolean)) {
    const forme = simples.find((candidate) => token.startsWith(candidate))
    if (!forme) continue
    const id = connus.get(forme)
    if (id && !trouves.includes(id)) trouves.push(id)
  }

  return trouves
}

export function versSlug(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Lit les tableaux « Français | Kabyle | … » du document de corpus.
 * Le document reste la source de vérité éditoriale ; le seed n'en est qu'une projection.
 */
export function extraireCorpus(markdown: string): { themes: ThemeSeed[]; entrees: EntreeSeed[] } {
  const themes: ThemeSeed[] = []
  const entrees: EntreeSeed[] = []
  const idsPris = new Set<string>()
  // Renseigné au fil de la lecture ; les phrases arrivent après les mots,
  // ce qui garantit que le vocabulaire est déjà connu quand on les traite.
  const formes = new Map<string, string>()

  let themeCourant: ThemeSeed | null = null

  for (const brute of markdown.split('\n')) {
    const ligne = brute.trim()

    const titre = /^## (?:\d+\.\s*)?(.+)$/.exec(ligne)
    if (titre?.[1]) {
      const nom = titre[1].trim()
      if (SECTIONS_HORS_CORPUS.test(nom)) {
        themeCourant = null
      } else {
        themeCourant = { id: versSlug(nom), nom, ordre: themes.length }
        themes.push(themeCourant)
      }
      continue
    }

    if (!themeCourant || !ligne.startsWith('|')) continue

    const cellules = ligne.split('|').slice(1, -1).map((c) => c.trim())
    if (cellules.length < 2) continue

    const [premiere, seconde] = cellules
    if (!premiere || !seconde) continue
    if (/^[-: ]+$/.test(premiere)) continue
    if (premiere === 'Français' || premiere === 'Fr' || premiere === 'Son') continue

    // Certaines cellules portent une précision entre parenthèses — « yiwen (fém. yiwet) ».
    // Elle appartient aux notes, pas au mot affiché à l'enfant.
    const [kabyleBrut, precision] = separerPrecision(nettoyer(seconde))
    const kabyle = kabyleBrut
    const fr = nettoyer(premiere)
    if (!kabyle || !fr) continue

    const notes = [precision, nettoyer(cellules[2] ?? '')].filter(Boolean).join(' — ')
    const base = versSlug(kabyle)
    if (!base) continue

    let id = base
    let suffixe = 2
    while (idsPris.has(id)) id = `${base}-${suffixe++}`
    idsPris.add(id)

    const estPhrase = themeCourant.nom === SECTION_PHRASES
    // Les mots interrogatifs sont notés « anda ? » dans le document : sans
    // normalisation, leur point d'interrogation les ferait passer pour des
    // expressions de plusieurs mots et ils ne seraient jamais reconnus.
    if (!estPhrase) formes.set(normaliser(kabyle), id)

    entrees.push({
      id,
      type: estPhrase ? 'phrase' : 'mot',
      kabyle,
      fr,
      theme: themeCourant.id,
      contient: estPhrase ? motsContenus(kabyle, formes) : [],
      notes,
      aValider: notes.includes('⚠️'),
    })
  }

  return { themes, entrees }
}

function separerPrecision(valeur: string): [string, string] {
  const trouve = /^([^(]+)\(([^)]*)\)\s*$/.exec(valeur)
  if (!trouve?.[1]) return [valeur, '']
  return [trouve[1].trim(), (trouve[2] ?? '').trim()]
}

function nettoyer(cellule: string): string {
  return cellule.replace(/`/g, '').replace(/\*\*/g, '').trim()
}
