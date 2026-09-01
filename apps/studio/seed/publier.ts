import { publierDepuisBase } from '../src/publication/depuisBase.js'

const resultat = await publierDepuisBase()
if (resultat.ok) {
  console.log(`Publié en v${resultat.version} → ${resultat.cle}`)
} else {
  console.error(`${resultat.problemes.length} problème(s) :`)
  for (const probleme of resultat.problemes.slice(0, 10)) console.error('  -', probleme.message)
}
process.exit(resultat.ok ? 0 : 1)
