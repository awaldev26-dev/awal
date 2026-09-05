import { describe, expect, it } from 'vitest'
import { hacher, verifier } from '@/auth/motDePasse'

describe('hacher', () => {
  it('produit une empreinte reconnaissable', async () => {
    const empreinte = await hacher('un mot de passe')
    expect(empreinte.startsWith('scrypt:')).toBe(true)
    expect(empreinte.split(':')).toHaveLength(4)
  })

  it('produit deux empreintes différentes pour le même mot de passe', async () => {
    // Le sel doit être tiré au hasard : sans lui, une même empreinte
    // trahirait que deux comptes partagent le mot de passe, et une table
    // précalculée suffirait à le retrouver.
    const a = await hacher('identique')
    const b = await hacher('identique')
    expect(a).not.toBe(b)
  })
})

describe('verifier', () => {
  it('accepte le bon mot de passe', async () => {
    const empreinte = await hacher('aghroum-2026')
    expect(await verifier('aghroum-2026', empreinte)).toBe(true)
  })

  it('refuse un mot de passe erroné', async () => {
    const empreinte = await hacher('aghroum-2026')
    expect(await verifier('aghroum-2027', empreinte)).toBe(false)
  })

  it('refuse une saisie vide', async () => {
    const empreinte = await hacher('quelque chose')
    expect(await verifier('', empreinte)).toBe(false)
  })

  it('distingue la casse', async () => {
    const empreinte = await hacher('Awal')
    expect(await verifier('awal', empreinte)).toBe(false)
  })

  it('accepte les caractères accentués et les espaces', async () => {
    const empreinte = await hacher('thanemmirth à tous')
    expect(await verifier('thanemmirth à tous', empreinte)).toBe(true)
  })

  it('n’emploie pas le dollar, illisible dans un fichier .env', async () => {
    // `$32768` serait pris pour une variable par le shell comme par Next,
    // et l'empreinte arriverait tronquée.
    expect(await hacher('essai')).not.toContain('$')
  })

  it('refuse une empreinte mal formée sans lever d’exception', async () => {
    // Une variable d'environnement mal renseignée doit refuser l'accès,
    // pas faire tomber la page de connexion.
    for (const cassee of ['', 'nimportequoi', 'scrypt:1:2', 'md5:sel:hash']) {
      expect(await verifier('essai', cassee)).toBe(false)
    }
  })

  it('refuse une empreinte dont le hachage n’est pas hexadécimal', async () => {
    expect(await verifier('essai', 'scrypt:32768:abcd:pas-du-hex')).toBe(false)
  })

  it('prend un temps notable, ce qui est le but', async () => {
    // La lenteur est la protection : sans limitation de tentatives, c'est
    // elle qui rend le bourrinage impraticable.
    const empreinte = await hacher('mesure')
    const depart = performance.now()
    await verifier('mesure', empreinte)
    expect(performance.now() - depart).toBeGreaterThan(20)
  })
})
