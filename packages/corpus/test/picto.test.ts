import { describe, expect, it } from 'vitest'
import { analyserPicto, clePictoImage, emojiDepuisPicto, pictoDepuisEmoji, pictoValide } from '../src/picto'

describe('analyserPicto', () => {
  it('reconnaît un emoji', () => {
    expect(analyserPicto('openmoji:1F35E')).toEqual({ type: 'emoji', codepoints: [0x1f35e] })
  })

  it('reconnaît une séquence d’emojis', () => {
    expect(analyserPicto('openmoji:1F468-1F3FD')).toEqual({
      type: 'emoji',
      codepoints: [0x1f468, 0x1f3fd],
    })
  })

  it('reconnaît une image', () => {
    expect(analyserPicto('image:pictos/lkanoun.webp')).toEqual({
      type: 'image',
      cle: 'pictos/lkanoun.webp',
    })
  })

  it('refuse une référence sans préfixe connu', () => {
    expect(analyserPicto('1F35E')).toBeNull()
    expect(analyserPicto('photo:x.png')).toBeNull()
  })

  it('refuse un codepoint non hexadécimal', () => {
    expect(analyserPicto('openmoji:ZZZZ')).toBeNull()
  })

  it('refuse un codepoint hors du plan Unicode', () => {
    expect(analyserPicto('openmoji:20000000')).toBeNull()
  })

  it('refuse une clé d’image vide', () => {
    expect(analyserPicto('image:')).toBeNull()
  })

  it('refuse une clé d’image qui remonte l’arborescence', () => {
    expect(analyserPicto('image:../secret.webp')).toBeNull()
  })
})

describe('pictoValide', () => {
  it('accepte les deux formes', () => {
    expect(pictoValide('openmoji:1F35E')).toBe(true)
    expect(pictoValide('image:pictos/x.webp')).toBe(true)
  })

  it('refuse le reste', () => {
    expect(pictoValide('cassé')).toBe(false)
  })
})

describe('emojiDepuisPicto', () => {
  it('rend le caractère', () => {
    expect(emojiDepuisPicto('openmoji:1F35E')).toBe('🍞')
  })

  it('rend une chaîne vide pour une image', () => {
    // Une image n'a pas de représentation textuelle : à l'appelant d'afficher
    // une balise img en se fondant sur analyserPicto.
    expect(emojiDepuisPicto('image:pictos/x.webp')).toBe('')
  })

  it('rend une chaîne vide sur référence invalide', () => {
    expect(emojiDepuisPicto('nimportequoi')).toBe('')
  })
})

describe('pictoDepuisEmoji', () => {
  it('convertit un emoji saisi en référence', () => {
    expect(pictoDepuisEmoji('🍞')).toBe('openmoji:1F35E')
  })

  it('convertit une séquence en gardant l’ordre', () => {
    expect(pictoDepuisEmoji('👨🏽')).toBe('openmoji:1F468-1F3FD')
  })

  it('ignore les espaces autour', () => {
    expect(pictoDepuisEmoji('  🐱  ')).toBe('openmoji:1F431')
  })

  it('rend null sur une saisie vide', () => {
    expect(pictoDepuisEmoji('   ')).toBeNull()
  })

  it('fait l’aller-retour sans perte', () => {
    for (const reference of ['openmoji:1F35E', 'openmoji:1F468-1F3FD', 'openmoji:0031-FE0F-20E3']) {
      expect(pictoDepuisEmoji(emojiDepuisPicto(reference))).toBe(reference)
    }
  })
})

describe('clePictoImage', () => {
  it('rend la clé de stockage d’une image', () => {
    expect(clePictoImage('image:pictos/x.webp')).toBe('pictos/x.webp')
  })

  it('rend null pour un emoji', () => {
    expect(clePictoImage('openmoji:1F35E')).toBeNull()
  })
})
