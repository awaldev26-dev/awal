const REFERENCE = /^openmoji:([0-9A-Fa-f]{4,6})(-[0-9A-Fa-f]{4,6})*$/

/** Rend le picto sous forme d'emoji natif. Même règle que dans le studio. */
export function emoji(reference: string): string {
  if (!REFERENCE.test(reference)) return '❓'
  const points = reference.slice('openmoji:'.length).split('-').map((p) => Number.parseInt(p, 16))
  return String.fromCodePoint(...points)
}
