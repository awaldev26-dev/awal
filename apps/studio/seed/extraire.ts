export interface ThemeSeed {
  id: string
  nom: string
  ordre: number
}

export interface EntreeSeed {
  id: string
  kabyle: string
  fr: string
  theme: string
  notes: string
  aValider: boolean
}

/** Titres de section à ignorer : ils ne décrivent pas des thèmes de vocabulaire. */
const SECTIONS_HORS_CORPUS = /^(Critère|Convention|Volumétrie|Ce qui a été retiré)/

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

    entrees.push({
      id,
      kabyle,
      fr,
      theme: themeCourant.id,
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
