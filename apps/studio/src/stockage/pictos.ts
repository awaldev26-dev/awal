const REFERENCE = /^openmoji:([0-9A-Fa-f]{4,6})(-[0-9A-Fa-f]{4,6})*$/

/** Un picto est une suite de codepoints Unicode valides, rendue nativement par le système. */
export function pictoValide(reference: string): boolean {
  if (!REFERENCE.test(reference)) return false
  return codepoints(reference).every((point) => point >= 0 && point <= 0x10ffff)
}

export function emojiDepuisPicto(reference: string): string {
  if (!pictoValide(reference)) return ''
  return String.fromCodePoint(...codepoints(reference))
}

function codepoints(reference: string): number[] {
  return reference.slice('openmoji:'.length).split('-').map((part) => Number.parseInt(part, 16))
}
