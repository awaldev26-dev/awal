/**
 * Vérifie la configuration R2 de bout en bout, avant toute publication.
 *
 * Contrôle successivement : les variables, l'accès en écriture et lecture par
 * l'API S3, l'accès public par HTTP, et la règle CORS. Chaque échec indique
 * quoi corriger et où — découvrir un identifiant erroné au milieu de l'envoi
 * de 243 fichiers coûte bien plus cher.
 *
 *   pnpm tsx seed/verifier-r2.ts
 */
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { StockageR2 } from '../src/stockage/r2.js'

const OBLIGATOIRES = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_URL_PUBLIQUE',
] as const

const ORIGINE_TEST = process.env.ORIGINE_TEST ?? 'http://localhost:3002'
const CLE_TEST = 'verification/essai.txt'

let echecs = 0

function ok(message: string) {
  console.log(`  ✅ ${message}`)
}

function ko(message: string, remede: string) {
  echecs += 1
  console.log(`  ❌ ${message}`)
  console.log(`     → ${remede}`)
}

console.log('\n1. Variables d’environnement')
const manquantes = OBLIGATOIRES.filter((nom) => !process.env[nom])
if (manquantes.length > 0) {
  ko(
    `manquantes : ${manquantes.join(', ')}`,
    'les renseigner dans apps/studio/.env.local, puis « set -a && . ./.env.local && set +a »',
  )
  process.exit(1)
}
ok(`les ${OBLIGATOIRES.length} variables sont présentes`)

if (process.env.STOCKAGE !== 'r2') {
  ko(
    `STOCKAGE vaut « ${process.env.STOCKAGE ?? 'rien' } », pas « r2 »`,
    'la publication écrirait sur le disque au lieu de R2',
  )
}

const base = process.env.R2_URL_PUBLIQUE ?? ''
if (!base.endsWith('/')) {
  ko(
    `R2_URL_PUBLIQUE ne finit pas par une barre oblique : ${base}`,
    'ajouter « / » à la fin, sinon les URL audio seront collées au domaine',
  )
}

console.log('\n2. Écriture et lecture par l’API S3')
const stockage = new StockageR2(
  process.env.R2_BUCKET!,
  base,
  process.env.R2_ACCOUNT_ID!,
  process.env.R2_ACCESS_KEY_ID!,
  process.env.R2_SECRET_ACCESS_KEY!,
)

const contenu = new TextEncoder().encode('awal')
try {
  await stockage.ecrire(CLE_TEST, contenu, 'text/plain')
  ok('écriture acceptée')
} catch (cause) {
  ko(
    `écriture refusée : ${String(cause).slice(0, 120)}`,
    'vérifier R2_ACCOUNT_ID, les clés, et que le jeton a le droit « Object Read & Write »',
  )
  process.exit(1)
}

const relu = await stockage.lire(CLE_TEST)
if (relu && new TextDecoder().decode(relu) === 'awal') ok('relecture conforme')
else ko('relecture incorrecte', 'le bucket répond mais ne rend pas ce qui a été écrit')

console.log('\n3. Accès public par HTTP')
const urlTest = `${base}${CLE_TEST}`
let reponse: Response | null = null
try {
  reponse = await fetch(urlTest)
} catch (cause) {
  ko(`URL injoignable : ${String(cause).slice(0, 80)}`, `vérifier que ${base} est bien l’URL publique`)
}

if (reponse) {
  if (reponse.ok) {
    ok(`accessible publiquement (${reponse.status})`)
  } else {
    ko(
      `accès public refusé (${reponse.status})`,
      'activer l’accès public du bucket : R2 → Settings → Public Development URL, ou un domaine personnalisé',
    )
  }
}

console.log('\n4. Règle CORS')
try {
  const preflight = await fetch(urlTest, {
    method: 'OPTIONS',
    headers: {
      Origin: ORIGINE_TEST,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'range',
    },
  })
  const autorise = preflight.headers.get('access-control-allow-origin')
  const entetes = preflight.headers.get('access-control-allow-headers') ?? ''

  if (!autorise) {
    ko(
      `aucun en-tête Access-Control-Allow-Origin pour ${ORIGINE_TEST}`,
      'coller la règle de docs/cors-r2.json dans R2 → Settings → CORS Policy',
    )
  } else if (autorise !== '*' && autorise !== ORIGINE_TEST) {
    ko(
      `origine autorisée « ${autorise} », attendue « ${ORIGINE_TEST} »`,
      'ajouter cette origine dans AllowedOrigins',
    )
  } else {
    ok(`origine ${ORIGINE_TEST} autorisée`)
  }

  if (autorise && !entetes.toLowerCase().includes('range')) {
    ko(
      'l’en-tête Range n’est pas autorisé',
      'ajouter "range" dans AllowedHeaders — sans lui, les audios ne se mettront pas en cache',
    )
  } else if (autorise) {
    ok('en-tête Range autorisé')
  }
} catch (cause) {
  ko(`requête préalable impossible : ${String(cause).slice(0, 80)}`, 'vérifier l’URL publique')
}

// Ménage : on ne laisse pas traîner le fichier d'essai.
await new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})
  .send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: CLE_TEST }))
  .catch(() => undefined)

console.log(
  echecs === 0
    ? '\nR2 est prêt. Tu peux générer les audios puis publier.\n'
    : `\n${echecs} point(s) à corriger avant de publier.\n`,
)
process.exit(echecs === 0 ? 0 : 1)
