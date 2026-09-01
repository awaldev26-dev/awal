# Plan B — Studio de contenu

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un back-office privé où le père saisit une entrée, enregistre sa voix dans le navigateur, et publie un artefact de corpus validé que l'app enfant consommera.

**Architecture:** Next.js 15 App Router. Postgres est la source de vérité éditable, accédée via Drizzle. Les médias passent par une interface `StockageMedias` avec deux implémentations — disque local en développement, R2 en production — choisies par variable d'environnement. La publication lit la base, construit un `Artefact`, le fait valider par `@awal/corpus`, et n'écrit le fichier que si la validation ne remonte aucun problème.

**Tech Stack:** Next.js 15, React 19, Drizzle ORM, postgres-js, Zod, jose (session signée), @aws-sdk/client-s3 (compatible R2), Vitest.

## Global Constraints

- **Domaine nommé en français** : `Entree`, `validerStructure`, `construireArtefact`, `publier`.
- **`@awal/corpus` est consommé en TypeScript source** : déclarer `transpilePackages: ['@awal/corpus']` dans `next.config.ts`.
- **Le studio est mono-utilisateur.** Un seul mot de passe, dans `STUDIO_MOT_DE_PASSE`. Pas de table utilisateurs, pas d'inscription.
- **Aucun secret dans le dépôt.** Tout passe par `.env.local`, documenté dans `.env.example`.
- **Les pictos sont des codepoints emoji**, référencés `openmoji:XXXX` (ou `openmoji:XXXX-XXXX` pour les séquences). Rendus nativement, aucun fichier image n'est stocké.
- **Rien ne se publie sans validation.** `validerStructure` et `validerMedias` doivent tous deux revenir vides.
- **TDD** sur toute la logique. Pas de test automatisé sur l'interface.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `apps/studio/docker-compose.yml` | Postgres local de développement |
| `apps/studio/.env.example` | toutes les variables, documentées |
| `apps/studio/drizzle.config.ts` | configuration des migrations |
| `apps/studio/src/db/schema.ts` | tables `themes`, `entrees`, `publications` |
| `apps/studio/src/db/index.ts` | connexion, instance Drizzle |
| `apps/studio/src/auth/session.ts` | signature et vérification du cookie de session |
| `apps/studio/src/middleware.ts` | protège toutes les routes sauf la connexion |
| `apps/studio/src/stockage/types.ts` | interface `StockageMedias` |
| `apps/studio/src/stockage/disque.ts` | implémentation disque, développement |
| `apps/studio/src/stockage/r2.ts` | implémentation R2, production |
| `apps/studio/src/stockage/index.ts` | fabrique selon `STOCKAGE` |
| `apps/studio/src/stockage/pictos.ts` | validation d'une référence de picto |
| `apps/studio/src/publication/construire.ts` | base → `Artefact` |
| `apps/studio/src/publication/publier.ts` | valide, incrémente la version, écrit |
| `apps/studio/src/app/**` | pages et actions serveur |
| `apps/studio/seed/extraire.ts` | `docs/corpus-v1.md` → `seed/entrees.json` |
| `apps/studio/seed/pictos.ts` | table de correspondance id → emoji |
| `apps/studio/seed/run.ts` | insertion en base + audios de remplacement |

Séparation par responsabilité : `stockage/` ne connaît pas la base, `publication/` ne connaît pas HTTP, `app/` ne contient que du glue et de l'affichage.

---

### Task 1: Squelette du studio et Postgres local

**Files:**
- Create: `apps/studio/package.json`, `apps/studio/tsconfig.json`, `apps/studio/next.config.ts`
- Create: `apps/studio/docker-compose.yml`, `apps/studio/.env.example`
- Create: `apps/studio/vitest.config.ts`
- Create: `apps/studio/src/app/layout.tsx`, `apps/studio/src/app/page.tsx`
- Create: `apps/studio/src/app/globals.css`
- Test: `apps/studio/test/fumee.test.ts`

**Interfaces:**
- Consumes: `@awal/corpus` (`VERSION_CONTRAT`)
- Produces: application démarrable par `pnpm --filter studio dev` sur le port 3001, Postgres local sur 5433

- [ ] **Step 1: Écrire le test de fumée**

`apps/studio/test/fumee.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { VERSION_CONTRAT } from '@awal/corpus'

describe('studio', () => {
  it('consomme le paquet corpus', () => {
    expect(VERSION_CONTRAT).toBe(1)
  })
})
```

- [ ] **Step 2: Créer les fichiers de configuration**

`apps/studio/package.json` :

```json
{
  "name": "studio",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "db:generer": "drizzle-kit generate",
    "db:appliquer": "drizzle-kit migrate",
    "db:seed": "tsx seed/run.ts"
  },
  "dependencies": {
    "@awal/corpus": "workspace:*",
    "@aws-sdk/client-s3": "^3.700.0",
    "drizzle-orm": "^0.36.0",
    "jose": "^5.9.0",
    "next": "^15.1.0",
    "postgres": "^3.4.5",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "vitest": "^2.1.0"
  }
}
```

`apps/studio/next.config.ts` :

```ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@awal/corpus'],
  serverExternalPackages: ['postgres'],
  webpack: (config) => {
    // Le monorepo importe en « ./x.js » des fichiers sources « ./x.ts ».
    // tsc et Vitest le résolvent seuls ; webpack a besoin qu'on le lui dise.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    }
    return config
  },
}

export default config
```

`apps/studio/tsconfig.json` :

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "noEmit": true,
    "allowJs": true,
    "incremental": true,
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["src", "test", "seed", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/studio/docker-compose.yml` :

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: awal-postgres
    environment:
      POSTGRES_USER: awal
      POSTGRES_PASSWORD: awal
      POSTGRES_DB: awal
    ports:
      - '5433:5432'
    volumes:
      - awal-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U awal']
      interval: 5s
      retries: 10

volumes:
  awal-pgdata:
```

`apps/studio/.env.example` :

```bash
# ── Base de données ───────────────────────────────────────────────
# En développement : Postgres local lancé par `docker compose up -d`.
# En production : chaîne fournie par Neon ou Supabase.
DATABASE_URL=postgres://awal:awal@localhost:5433/awal

# ── Accès au studio ───────────────────────────────────────────────
# Mot de passe unique. Le studio n'a pas d'autre utilisateur.
STUDIO_MOT_DE_PASSE=change-moi

# Clé de signature du cookie de session. Générer avec :
#   openssl rand -base64 32
SESSION_SECRET=change-moi-aussi

# ── Stockage des médias ───────────────────────────────────────────
# `disque` en développement, `r2` en production.
STOCKAGE=disque

# Utilisé uniquement si STOCKAGE=disque. Chemin relatif à apps/studio.
STOCKAGE_DISQUE_RACINE=./medias

# Utilisés uniquement si STOCKAGE=r2. Console Cloudflare > R2 > Manage API tokens.
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=awal-medias

# URL publique du bucket, avec la barre finale. Elle est inscrite dans
# l'artefact publié : c'est par elle que l'app enfant chargera les audios.
R2_URL_PUBLIQUE=https://medias.exemple.com/
```

`apps/studio/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': new URL('./src/', import.meta.url).pathname },
  },
})
```

`apps/studio/src/app/globals.css` :

```css
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}
```

`apps/studio/src/app/layout.tsx` :

```tsx
import type { ReactNode } from 'react'
import './globals.css'

export const metadata = { title: 'Studio Awal' }

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
```

`apps/studio/src/app/page.tsx` :

```tsx
export default function Accueil() {
  return <main style={{ padding: 24 }}><h1>Studio Awal</h1></main>
}
```

- [ ] **Step 3: Installer et vérifier que le test passe**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
pnpm install
pnpm --filter studio test
```

Attendu : SUCCÈS — 1 test.

- [ ] **Step 4: Démarrer Postgres et vérifier**

```bash
cd apps/studio
cp .env.example .env.local
docker compose up -d
docker compose ps
```

Attendu : le conteneur `awal-postgres` est `healthy`.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "chore(studio): squelette Next.js et Postgres local"
```

---

### Task 2: Schéma de base et connexion

**Files:**
- Create: `apps/studio/src/db/schema.ts`, `apps/studio/src/db/index.ts`
- Create: `apps/studio/drizzle.config.ts`
- Test: `apps/studio/test/schema.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - tables `themes`, `entrees`, `publications`
  - `type LigneEntree`, `type LigneTheme` — inférés par Drizzle
  - `db` — instance Drizzle, importée par tout le reste

La colonne `entrees.themes` est un tableau de texte plutôt qu'une table de liaison : le corpus est petit, une entrée porte un à trois thèmes, et la table de liaison n'apporterait ici que de la cérémonie.

- [ ] **Step 1: Écrire le test**

`apps/studio/test/schema.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { entrees, themes, publications } from '@/db/schema.js'

describe('schéma de base', () => {
  it('déclare les colonnes d’une entrée', () => {
    const colonnes = Object.keys(entrees)
    for (const attendue of [
      'id', 'type', 'kabyle', 'kabyleStd', 'fr', 'audio', 'variante',
      'picto', 'themes', 'niveau', 'pluriel', 'contient', 'notes', 'aValider',
    ]) {
      expect(colonnes).toContain(attendue)
    }
  })

  it('déclare les colonnes d’un thème', () => {
    expect(Object.keys(themes)).toEqual(
      expect.arrayContaining(['id', 'nom', 'picto', 'couleur', 'ordre']),
    )
  })

  it('déclare les colonnes d’une publication', () => {
    expect(Object.keys(publications)).toEqual(
      expect.arrayContaining(['version', 'publieLe', 'nbEntrees']),
    )
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : ÉCHEC — module `@/db/schema.js` introuvable.

- [ ] **Step 3: Implémenter**

`apps/studio/src/db/schema.ts` :

```ts
import { integer, pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const themes = pgTable('themes', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  picto: text('picto').notNull(),
  couleur: text('couleur').notNull(),
  ordre: integer('ordre').notNull().default(0),
})

export const entrees = pgTable('entrees', {
  id: text('id').primaryKey(),
  type: text('type').notNull().default('mot'),
  kabyle: text('kabyle').notNull(),
  kabyleStd: text('kabyle_std'),
  fr: text('fr').notNull(),
  audio: text('audio'),
  variante: text('variante').notNull().default('kabyle-nord'),
  picto: text('picto').notNull(),
  themes: text('themes').array().notNull().default([]),
  niveau: integer('niveau').notNull().default(1),
  pluriel: text('pluriel'),
  contient: text('contient').array().notNull().default([]),
  notes: text('notes').notNull().default(''),
  /** Vrai tant que le locuteur natif n'a pas confirmé la forme. */
  aValider: boolean('a_valider').notNull().default(true),
  creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
})

export const publications = pgTable('publications', {
  version: integer('version').primaryKey(),
  publieLe: timestamp('publie_le', { withTimezone: true }).notNull().defaultNow(),
  nbEntrees: integer('nb_entrees').notNull(),
})

export type LigneEntree = typeof entrees.$inferSelect
export type LigneTheme = typeof themes.$inferSelect
```

`apps/studio/src/db/index.ts` :

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL manquante. Copier .env.example vers .env.local.')

const client = postgres(url, { max: 5 })

export const db = drizzle(client, { schema })
export { schema }
```

`apps/studio/drizzle.config.ts` :

```ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
} satisfies Config
```

Noter que `audio` est nullable en base alors que le schéma du corpus l'exige : une entrée existe en base avant d'être enregistrée. C'est la publication qui refuse les entrées sans audio.

- [ ] **Step 4: Vérifier et générer la migration**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
cd apps/studio && set -a && source .env.local && set +a && pnpm db:generer && pnpm db:appliquer
```

Attendu : tests au vert, migration créée dans `drizzle/`, tables créées en base.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(studio): schéma de base et connexion Drizzle"
```

---

### Task 3: Authentification par mot de passe unique

**Files:**
- Create: `apps/studio/src/auth/session.ts`
- Create: `apps/studio/src/middleware.ts`
- Create: `apps/studio/src/app/connexion/page.tsx`, `apps/studio/src/app/connexion/actions.ts`
- Test: `apps/studio/test/session.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `creerSession(): Promise<string>` — renvoie un jeton signé valable 30 jours
  - `verifierSession(jeton: string | undefined): Promise<boolean>`
  - `NOM_COOKIE = 'awal_session'`

- [ ] **Step 1: Écrire le test**

`apps/studio/test/session.test.ts` :

```ts
import { beforeAll, describe, expect, it } from 'vitest'
import { creerSession, verifierSession, NOM_COOKIE } from '@/auth/session.js'

beforeAll(() => {
  process.env.SESSION_SECRET = 'secret-de-test-suffisamment-long-pour-hs256'
})

describe('session du studio', () => {
  it('accepte un jeton qu’elle vient d’émettre', async () => {
    expect(await verifierSession(await creerSession())).toBe(true)
  })

  it('refuse un jeton absent', async () => {
    expect(await verifierSession(undefined)).toBe(false)
  })

  it('refuse un jeton bricolé', async () => {
    expect(await verifierSession('pas.un.jwt')).toBe(false)
  })

  it('refuse un jeton signé avec une autre clé', async () => {
    const jeton = await creerSession()
    process.env.SESSION_SECRET = 'une-tout-autre-cle-de-signature-aussi-longue'
    expect(await verifierSession(jeton)).toBe(false)
    process.env.SESSION_SECRET = 'secret-de-test-suffisamment-long-pour-hs256'
  })

  it('expose un nom de cookie stable', () => {
    expect(NOM_COOKIE).toBe('awal_session')
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : ÉCHEC — module `@/auth/session.js` introuvable.

- [ ] **Step 3: Implémenter**

`apps/studio/src/auth/session.ts` :

```ts
import { SignJWT, jwtVerify } from 'jose'

export const NOM_COOKIE = 'awal_session'

const DUREE = '30d'

function cle(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET manquante.')
  return new TextEncoder().encode(secret)
}

/** Émet un jeton signé. Le studio étant mono-utilisateur, il ne porte aucune identité. */
export async function creerSession(): Promise<string> {
  return new SignJWT({ studio: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(DUREE)
    .sign(cle())
}

export async function verifierSession(jeton: string | undefined): Promise<boolean> {
  if (!jeton) return false
  try {
    await jwtVerify(jeton, cle())
    return true
  } catch {
    return false
  }
}
```

`apps/studio/src/middleware.ts` :

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { NOM_COOKIE, verifierSession } from './auth/session.js'

export async function middleware(requete: NextRequest) {
  if (await verifierSession(requete.cookies.get(NOM_COOKIE)?.value)) {
    return NextResponse.next()
  }
  const url = requete.nextUrl.clone()
  url.pathname = '/connexion'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!connexion|_next/static|_next/image|favicon.ico|medias).*)'],
}
```

`apps/studio/src/app/connexion/actions.ts` :

```ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NOM_COOKIE, creerSession } from '@/auth/session.js'

export async function seConnecter(_etat: string | null, donnees: FormData): Promise<string | null> {
  const attendu = process.env.STUDIO_MOT_DE_PASSE
  if (!attendu) return 'STUDIO_MOT_DE_PASSE n’est pas configurée.'
  if (donnees.get('motDePasse') !== attendu) return 'Mot de passe incorrect.'

  const magasin = await cookies()
  magasin.set(NOM_COOKIE, await creerSession(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect('/')
}
```

`apps/studio/src/app/connexion/page.tsx` :

```tsx
'use client'

import { useActionState } from 'react'
import { seConnecter } from './actions.js'

export default function Connexion() {
  const [erreur, action, enCours] = useActionState(seConnecter, null)
  return (
    <main style={{ padding: 24, maxWidth: 360 }}>
      <h1>Studio Awal</h1>
      <form action={action}>
        <input
          type="password"
          name="motDePasse"
          placeholder="Mot de passe"
          autoFocus
          style={{ width: '100%', padding: 8, fontSize: 16 }}
        />
        <button type="submit" disabled={enCours} style={{ marginTop: 12, padding: '8px 16px' }}>
          Entrer
        </button>
      </form>
      {erreur ? <p style={{ color: '#c0392b' }}>{erreur}</p> : null}
    </main>
  )
}
```

- [ ] **Step 4: Vérifier**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : SUCCÈS — 6 tests au total.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(studio): authentification par mot de passe unique"
```

---

### Task 4: Stockage des médias

**Files:**
- Create: `apps/studio/src/stockage/types.ts`, `disque.ts`, `r2.ts`, `index.ts`, `pictos.ts`
- Test: `apps/studio/test/stockage.test.ts`, `apps/studio/test/pictos.test.ts`

**Interfaces:**
- Consumes: `VerificateurMedias` de `@awal/corpus`
- Produces:
  - `interface StockageMedias { ecrire(cle, donnees, typeMime): Promise<void>; lire(cle): Promise<Uint8Array | null>; existe(cle): Promise<boolean>; urlPublique(): string }`
  - `creerStockage(): StockageMedias` — lit `STOCKAGE`
  - `creerVerificateur(stockage: StockageMedias): VerificateurMedias`
  - `pictoValide(reference: string): boolean`

`StockageDisque` sert aussi bien au développement qu'aux tests, ce qui évite d'écrire un troisième faux.

- [ ] **Step 1: Écrire les tests**

`apps/studio/test/pictos.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { pictoValide, emojiDepuisPicto } from '@/stockage/pictos.js'

describe('pictoValide', () => {
  it('accepte un codepoint simple', () => {
    expect(pictoValide('openmoji:1F35E')).toBe(true)
  })

  it('accepte une séquence de codepoints', () => {
    expect(pictoValide('openmoji:1F468-1F3FE')).toBe(true)
  })

  it('refuse une référence sans préfixe', () => {
    expect(pictoValide('1F35E')).toBe(false)
  })

  it('refuse un codepoint qui n’est pas hexadécimal', () => {
    expect(pictoValide('openmoji:ZZZZ')).toBe(false)
  })

  it('refuse un codepoint hors du plan Unicode', () => {
    expect(pictoValide('openmoji:20000000')).toBe(false)
  })
})

describe('emojiDepuisPicto', () => {
  it('rend le caractère correspondant', () => {
    expect(emojiDepuisPicto('openmoji:1F35E')).toBe('🍞')
  })

  it('rend une séquence complète', () => {
    expect(emojiDepuisPicto('openmoji:1F441-1F5E8')).toBe('👁🗨')
  })

  it('rend une chaîne vide sur référence invalide', () => {
    expect(emojiDepuisPicto('nimportequoi')).toBe('')
  })
})
```

`apps/studio/test/stockage.test.ts` :

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { StockageDisque } from '@/stockage/disque.js'
import { creerVerificateur } from '@/stockage/index.js'

const racines: string[] = []

function stockage() {
  const racine = mkdtempSync(join(tmpdir(), 'awal-'))
  racines.push(racine)
  return new StockageDisque(racine, 'http://localhost:3001/medias/')
}

afterEach(() => {
  for (const racine of racines.splice(0)) rmSync(racine, { recursive: true, force: true })
})

describe('StockageDisque', () => {
  it('écrit puis relit le même contenu', async () => {
    const s = stockage()
    await s.ecrire('audio/aman.webm', new Uint8Array([1, 2, 3]), 'audio/webm')
    expect(Array.from((await s.lire('audio/aman.webm')) ?? [])).toEqual([1, 2, 3])
  })

  it('signale l’absence d’une clé inconnue', async () => {
    expect(await stockage().existe('audio/absent.webm')).toBe(false)
  })

  it('renvoie null en lecture sur une clé inconnue', async () => {
    expect(await stockage().lire('audio/absent.webm')).toBeNull()
  })

  it('crée les dossiers intermédiaires', async () => {
    const s = stockage()
    await s.ecrire('corpus/v1/artefact.json', new Uint8Array([123]), 'application/json')
    expect(await s.existe('corpus/v1/artefact.json')).toBe(true)
  })

  it('refuse une clé qui tente de sortir de la racine', async () => {
    await expect(stockage().ecrire('../evasion', new Uint8Array([1]), 'text/plain')).rejects.toThrow()
  })

  it('expose son url publique', () => {
    expect(stockage().urlPublique()).toBe('http://localhost:3001/medias/')
  })
})

describe('creerVerificateur', () => {
  it('confirme un audio présent et refuse un absent', async () => {
    const s = stockage()
    await s.ecrire('audio/aman.webm', new Uint8Array([1]), 'audio/webm')
    const v = creerVerificateur(s)
    expect(await v.audioExiste('audio/aman.webm')).toBe(true)
    expect(await v.audioExiste('audio/rien.webm')).toBe(false)
  })

  it('valide les pictos sans toucher au stockage', async () => {
    const v = creerVerificateur(stockage())
    expect(await v.pictoExiste('openmoji:1F35E')).toBe(true)
    expect(await v.pictoExiste('cassé')).toBe(false)
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : ÉCHEC — modules de `@/stockage/` introuvables.

- [ ] **Step 3: Implémenter**

`apps/studio/src/stockage/pictos.ts` :

```ts
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
```

`apps/studio/src/stockage/types.ts` :

```ts
export interface StockageMedias {
  ecrire(cle: string, donnees: Uint8Array, typeMime: string): Promise<void>
  lire(cle: string): Promise<Uint8Array | null>
  existe(cle: string): Promise<boolean>
  /** Base d'URL publique, barre finale comprise. Inscrite dans l'artefact publié. */
  urlPublique(): string
}
```

`apps/studio/src/stockage/disque.ts` :

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import type { StockageMedias } from './types.js'

/** Stockage sur disque, pour le développement et les tests. */
export class StockageDisque implements StockageMedias {
  constructor(
    private readonly racine: string,
    private readonly base: string,
  ) {}

  private chemin(cle: string): string {
    const resolu = resolve(this.racine, cle)
    const dedans = relative(resolve(this.racine), resolu)
    if (dedans.startsWith('..')) throw new Error(`Clé hors de la racine : ${cle}`)
    return resolu
  }

  async ecrire(cle: string, donnees: Uint8Array, _typeMime: string): Promise<void> {
    const chemin = this.chemin(cle)
    await mkdir(dirname(chemin), { recursive: true })
    await writeFile(chemin, donnees)
  }

  async lire(cle: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await readFile(this.chemin(cle)))
    } catch {
      return null
    }
  }

  async existe(cle: string): Promise<boolean> {
    return (await this.lire(cle)) !== null
  }

  urlPublique(): string {
    return this.base
  }
}

export function racineParDefaut(): string {
  return join(process.cwd(), process.env.STOCKAGE_DISQUE_RACINE ?? './medias')
}
```

`apps/studio/src/stockage/r2.ts` :

```ts
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { StockageMedias } from './types.js'

/** R2 parle le protocole S3 : un client S3 pointé sur l'endpoint du compte suffit. */
export class StockageR2 implements StockageMedias {
  private readonly client: S3Client

  constructor(
    private readonly bucket: string,
    private readonly base: string,
    compteId: string,
    accessKeyId: string,
    secretAccessKey: string,
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${compteId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  async ecrire(cle: string, donnees: Uint8Array, typeMime: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: cle, Body: donnees, ContentType: typeMime }),
    )
  }

  async lire(cle: string): Promise<Uint8Array | null> {
    try {
      const reponse = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: cle }))
      const octets = await reponse.Body?.transformToByteArray()
      return octets ? new Uint8Array(octets) : null
    } catch {
      return null
    }
  }

  async existe(cle: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: cle }))
      return true
    } catch {
      return false
    }
  }

  urlPublique(): string {
    return this.base
  }
}
```

`apps/studio/src/stockage/index.ts` :

```ts
import type { VerificateurMedias } from '@awal/corpus'
import { StockageDisque, racineParDefaut } from './disque.js'
import { StockageR2 } from './r2.js'
import { pictoValide } from './pictos.js'
import type { StockageMedias } from './types.js'

export * from './types.js'
export { StockageDisque } from './disque.js'
export { StockageR2 } from './r2.js'
export { pictoValide, emojiDepuisPicto } from './pictos.js'

function exige(nom: string): string {
  const valeur = process.env[nom]
  if (!valeur) throw new Error(`${nom} manquante alors que STOCKAGE=r2.`)
  return valeur
}

export function creerStockage(): StockageMedias {
  if (process.env.STOCKAGE === 'r2') {
    return new StockageR2(
      exige('R2_BUCKET'),
      exige('R2_URL_PUBLIQUE'),
      exige('R2_ACCOUNT_ID'),
      exige('R2_ACCESS_KEY_ID'),
      exige('R2_SECRET_ACCESS_KEY'),
    )
  }
  return new StockageDisque(racineParDefaut(), 'http://localhost:3001/medias/')
}

/**
 * Branche le stockage sur l'interface attendue par @awal/corpus.
 * Les pictos étant des codepoints, leur vérification est purement syntaxique.
 */
export function creerVerificateur(stockage: StockageMedias): VerificateurMedias {
  return {
    audioExiste: (cle) => stockage.existe(cle),
    pictoExiste: async (reference) => pictoValide(reference),
  }
}
```

- [ ] **Step 4: Vérifier**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : SUCCÈS — 22 tests au total.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(studio): stockage des médias, disque et R2"
```

---

### Task 5: Construction de l'artefact depuis la base

**Files:**
- Create: `apps/studio/src/publication/construire.ts`
- Test: `apps/studio/test/construire.test.ts`

**Interfaces:**
- Consumes: `LigneEntree`, `LigneTheme` de la tâche 2, `schemaArtefact` de `@awal/corpus`
- Produces:
  - `construireArtefact(entrees: LigneEntree[], themes: LigneTheme[], options: { version: number; publieLe: Date; urlBaseAudio: string }): Artefact`
  - `EntreeIncomplete` — erreur portant `entreeId` et `raison`

Fonction pure : elle reçoit des lignes déjà lues, ce qui la rend testable sans base.

- [ ] **Step 1: Écrire le test**

`apps/studio/test/construire.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { construireArtefact, EntreeIncomplete } from '@/publication/construire.js'
import type { LigneEntree, LigneTheme } from '@/db/schema.js'

const theme: LigneTheme = {
  id: 'les-animaux', nom: 'Les animaux', picto: 'openmoji:1F408', couleur: '#3d7ec9', ordre: 0,
}

function ligne(reste: Partial<LigneEntree> = {}): LigneEntree {
  return {
    id: 'amchich', type: 'mot', kabyle: 'amchich', kabyleStd: null, fr: 'le chat',
    audio: 'audio/amchich.webm', variante: 'kabyle-nord', picto: 'openmoji:1F408',
    themes: ['les-animaux'], niveau: 1, pluriel: null, contient: [], notes: '',
    aValider: true, creeLe: new Date('2026-09-01T18:00:00.000Z'), ...reste,
  }
}

const options = {
  version: 3,
  publieLe: new Date('2026-09-01T18:00:00.000Z'),
  urlBaseAudio: 'https://medias.awal.app/',
}

describe('construireArtefact', () => {
  it('produit un artefact conforme', () => {
    const artefact = construireArtefact([ligne()], [theme], options)
    expect(artefact.version).toBe(3)
    expect(artefact.publieLe).toBe('2026-09-01T18:00:00.000Z')
    expect(artefact.urlBaseAudio).toBe('https://medias.awal.app/')
    expect(artefact.entrees).toHaveLength(1)
  })

  it('convertit les null de la base en champs absents', () => {
    const artefact = construireArtefact([ligne()], [theme], options)
    expect(artefact.entrees[0]).not.toHaveProperty('kabyleStd')
    expect(artefact.entrees[0]).not.toHaveProperty('pluriel')
  })

  it('conserve les champs optionnels renseignés', () => {
    const artefact = construireArtefact(
      [ligne({ kabyleStd: 'amcic', pluriel: 'imcac' })], [theme], options,
    )
    expect(artefact.entrees[0]?.kabyleStd).toBe('amcic')
    expect(artefact.entrees[0]?.pluriel).toBe('imcac')
  })

  it('n’expose pas les colonnes internes', () => {
    const artefact = construireArtefact([ligne()], [theme], options)
    expect(artefact.entrees[0]).not.toHaveProperty('aValider')
    expect(artefact.entrees[0]).not.toHaveProperty('creeLe')
  })

  it('refuse une entrée sans audio en nommant le coupable', () => {
    expect(() => construireArtefact([ligne({ audio: null })], [theme], options))
      .toThrow(EntreeIncomplete)
    try {
      construireArtefact([ligne({ id: 'muet', audio: null })], [theme], options)
    } catch (erreur) {
      expect((erreur as EntreeIncomplete).entreeId).toBe('muet')
    }
  })

  it('trie les thèmes par ordre', () => {
    const second: LigneTheme = { ...theme, id: 'manger', nom: 'Manger', ordre: -1 }
    const artefact = construireArtefact(
      [ligne({ themes: ['les-animaux'] })], [theme, second], options,
    )
    expect(artefact.themes.map((t) => t.id)).toEqual(['manger', 'les-animaux'])
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : ÉCHEC — `@/publication/construire.js` introuvable.

- [ ] **Step 3: Implémenter**

`apps/studio/src/publication/construire.ts` :

```ts
import { schemaArtefact, type Artefact } from '@awal/corpus'
import type { LigneEntree, LigneTheme } from '@/db/schema.js'

/** Une entrée en base n'est pas encore publiable — le plus souvent parce qu'elle n'a pas d'audio. */
export class EntreeIncomplete extends Error {
  constructor(
    readonly entreeId: string,
    readonly raison: string,
  ) {
    super(`Entrée « ${entreeId} » : ${raison}`)
    this.name = 'EntreeIncomplete'
  }
}

export interface OptionsArtefact {
  version: number
  publieLe: Date
  urlBaseAudio: string
}

/**
 * Traduit des lignes de base en artefact publiable, et le valide au passage.
 * Pure : ne lit rien, ce qui la rend testable sans Postgres.
 */
export function construireArtefact(
  entrees: LigneEntree[],
  themes: LigneTheme[],
  options: OptionsArtefact,
): Artefact {
  return schemaArtefact.parse({
    version: options.version,
    publieLe: options.publieLe.toISOString(),
    urlBaseAudio: options.urlBaseAudio,
    themes: [...themes]
      .sort((a, b) => a.ordre - b.ordre)
      .map(({ id, nom, picto, couleur }) => ({ id, nom, picto, couleur })),
    entrees: entrees.map((ligne) => {
      if (!ligne.audio) throw new EntreeIncomplete(ligne.id, 'aucun audio enregistré')
      return {
        id: ligne.id,
        type: ligne.type,
        kabyle: ligne.kabyle,
        ...(ligne.kabyleStd ? { kabyleStd: ligne.kabyleStd } : {}),
        fr: ligne.fr,
        audio: ligne.audio,
        variante: ligne.variante,
        picto: ligne.picto,
        themes: ligne.themes,
        niveau: ligne.niveau,
        ...(ligne.pluriel ? { pluriel: ligne.pluriel } : {}),
        contient: ligne.contient,
        notes: ligne.notes,
      }
    }),
  })
}
```

- [ ] **Step 4: Vérifier**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : SUCCÈS — 28 tests au total.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(studio): construction de l'artefact depuis la base"
```

---

### Task 6: Publication

**Files:**
- Create: `apps/studio/src/publication/publier.ts`
- Test: `apps/studio/test/publier.test.ts`

**Interfaces:**
- Consumes: `construireArtefact`, `StockageMedias`, `validerStructure` et `validerMedias` de `@awal/corpus`
- Produces:
  - `type ResultatPublication = { ok: true; version: number; cle: string } | { ok: false; problemes: ProblemeValidation[] }`
  - `publierArtefact(artefact, stockage): Promise<ResultatPublication>`
  - `CLE_ACTUEL = 'corpus/actuel.json'`

Écrit deux fichiers : `corpus/v{n}.json` qui est immuable, et `corpus/actuel.json` qui est écrasé. L'app enfant ne lit que le second, mais l'historique permet de revenir en arrière si une publication est mauvaise.

- [ ] **Step 1: Écrire le test**

`apps/studio/test/publier.test.ts` :

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { schemaArtefact, type Artefact } from '@awal/corpus'
import { StockageDisque } from '@/stockage/disque.js'
import { CLE_ACTUEL, publierArtefact } from '@/publication/publier.js'

const racines: string[] = []

function stockage() {
  const racine = mkdtempSync(join(tmpdir(), 'awal-pub-'))
  racines.push(racine)
  return new StockageDisque(racine, 'https://medias.awal.test/')
}

afterEach(() => {
  for (const racine of racines.splice(0)) rmSync(racine, { recursive: true, force: true })
})

function artefact(reste: Partial<Artefact> = {}): Artefact {
  return schemaArtefact.parse({
    version: 2,
    publieLe: '2026-09-01T18:00:00.000Z',
    urlBaseAudio: 'https://medias.awal.test/',
    themes: [{ id: 'animaux', nom: 'Animaux', picto: 'openmoji:1F408', couleur: '#3d7ec9' }],
    entrees: [{
      id: 'amchich', type: 'mot', kabyle: 'amchich', fr: 'le chat',
      audio: 'audio/amchich.webm', variante: 'kabyle-nord',
      picto: 'openmoji:1F408', themes: ['animaux'],
    }],
    ...reste,
  })
}

async function avecAudio() {
  const s = stockage()
  await s.ecrire('audio/amchich.webm', new Uint8Array([1, 2, 3]), 'audio/webm')
  return s
}

describe('publierArtefact', () => {
  it('publie quand tout est valide', async () => {
    const s = await avecAudio()
    const resultat = await publierArtefact(artefact(), s)
    expect(resultat.ok).toBe(true)
    if (resultat.ok) {
      expect(resultat.version).toBe(2)
      expect(resultat.cle).toBe('corpus/v2.json')
    }
  })

  it('écrit la version figée et le fichier actuel', async () => {
    const s = await avecAudio()
    await publierArtefact(artefact(), s)
    expect(await s.existe('corpus/v2.json')).toBe(true)
    expect(await s.existe(CLE_ACTUEL)).toBe(true)
  })

  it('écrit un JSON relisible et conforme', async () => {
    const s = await avecAudio()
    await publierArtefact(artefact(), s)
    const octets = await s.lire(CLE_ACTUEL)
    const relu = JSON.parse(new TextDecoder().decode(octets ?? new Uint8Array()))
    expect(() => schemaArtefact.parse(relu)).not.toThrow()
    expect(relu.entrees[0].kabyle).toBe('amchich')
  })

  it('refuse de publier un mot muet et n’écrit rien', async () => {
    const s = stockage()
    const resultat = await publierArtefact(artefact(), s)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.problemes.map((p) => p.code)).toEqual(['audio-absent'])
    expect(await s.existe(CLE_ACTUEL)).toBe(false)
  })

  it('refuse un artefact structurellement invalide', async () => {
    const s = await avecAudio()
    const casse = artefact({
      entrees: [{
        id: 'amchich', type: 'mot', kabyle: 'amchich', fr: 'le chat',
        audio: 'audio/amchich.webm', variante: 'kabyle-nord',
        picto: 'openmoji:1F408', themes: ['theme-fantome'], niveau: 1,
        contient: [], notes: '',
      }],
    })
    const resultat = await publierArtefact(casse, s)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) expect(resultat.problemes.map((p) => p.code)).toContain('theme-inconnu')
  })

  it('remonte tous les problèmes d’un coup', async () => {
    const s = stockage()
    const casse = artefact({
      entrees: [{
        id: 'amchich', type: 'mot', kabyle: 'amchich', fr: 'le chat',
        audio: 'audio/amchich.webm', variante: 'kabyle-nord',
        picto: 'cassé', themes: ['theme-fantome'], niveau: 1, contient: [], notes: '',
      }],
    })
    const resultat = await publierArtefact(casse, s)
    expect(resultat.ok).toBe(false)
    if (!resultat.ok) {
      expect(resultat.problemes.map((p) => p.code).sort())
        .toEqual(['audio-absent', 'picto-absent', 'theme-inconnu'])
    }
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : ÉCHEC — `@/publication/publier.js` introuvable.

- [ ] **Step 3: Implémenter**

`apps/studio/src/publication/publier.ts` :

```ts
import {
  validerMedias,
  validerStructure,
  type Artefact,
  type ProblemeValidation,
} from '@awal/corpus'
import { creerVerificateur } from '@/stockage/index.js'
import type { StockageMedias } from '@/stockage/types.js'

/** Fichier que l'app enfant interroge. Écrasé à chaque publication. */
export const CLE_ACTUEL = 'corpus/actuel.json'

export type ResultatPublication =
  | { ok: true; version: number; cle: string }
  | { ok: false; problemes: ProblemeValidation[] }

/**
 * Valide puis écrit. Les deux validations tournent avant toute écriture :
 * une publication partielle laisserait l'app enfant avec un corpus incohérent.
 */
export async function publierArtefact(
  artefact: Artefact,
  stockage: StockageMedias,
): Promise<ResultatPublication> {
  const problemes = [
    ...validerStructure(artefact),
    ...(await validerMedias(artefact, creerVerificateur(stockage))),
  ]
  if (problemes.length > 0) return { ok: false, problemes }

  const contenu = new TextEncoder().encode(JSON.stringify(artefact))
  const cle = `corpus/v${artefact.version}.json`
  await stockage.ecrire(cle, contenu, 'application/json')
  await stockage.ecrire(CLE_ACTUEL, contenu, 'application/json')

  return { ok: true, version: artefact.version, cle }
}
```

- [ ] **Step 4: Vérifier**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : SUCCÈS — 34 tests au total.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(studio): publication validée de l'artefact"
```

---

### Task 7: Interface de saisie et enregistrement audio

**Files:**
- Create: `apps/studio/src/app/actions.ts`
- Create: `apps/studio/src/app/entrees/page.tsx`
- Create: `apps/studio/src/app/entrees/[id]/page.tsx`
- Create: `apps/studio/src/app/entrees/[id]/Editeur.tsx`
- Create: `apps/studio/src/app/Enregistreur.tsx`
- Create: `apps/studio/src/app/medias/[...cle]/route.ts`
- Modify: `apps/studio/src/app/page.tsx`

**Interfaces:**
- Consumes: `db`, `creerStockage`, `construireArtefact`, `publierArtefact`, `emojiDepuisPicto`
- Produces (actions serveur) :
  - `enregistrerEntree(donnees: FormData): Promise<void>`
  - `televerserAudio(id: string, fichier: File): Promise<{ cle: string }>`
  - `lancerPublication(): Promise<ResultatPublication>`

L'enregistrement passe par `MediaRecorder`. Le type MIME diffère selon le navigateur — `audio/webm` sur Chrome, `audio/mp4` sur Safari — donc l'extension est déduite du blob et non imposée.

- [ ] **Step 1: Écrire les actions serveur**

`apps/studio/src/app/actions.ts` :

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db/index.js'
import { entrees, publications, themes } from '@/db/schema.js'
import { creerStockage } from '@/stockage/index.js'
import { construireArtefact } from '@/publication/construire.js'
import { publierArtefact, type ResultatPublication } from '@/publication/publier.js'

export async function enregistrerEntree(donnees: FormData): Promise<void> {
  const id = String(donnees.get('id'))
  await db
    .update(entrees)
    .set({
      kabyle: String(donnees.get('kabyle')).trim(),
      fr: String(donnees.get('fr')).trim(),
      pluriel: String(donnees.get('pluriel') ?? '').trim() || null,
      notes: String(donnees.get('notes') ?? '').trim(),
      niveau: Number(donnees.get('niveau') ?? 1),
      aValider: donnees.get('aValider') === 'on',
    })
    .where(eq(entrees.id, id))
  revalidatePath('/entrees')
  revalidatePath(`/entrees/${id}`)
}

export async function televerserAudio(id: string, fichier: File): Promise<{ cle: string }> {
  const extension = fichier.type.includes('mp4') ? 'mp4' : 'webm'
  const cle = `audio/${id}.${extension}`
  const stockage = creerStockage()
  await stockage.ecrire(cle, new Uint8Array(await fichier.arrayBuffer()), fichier.type)
  await db.update(entrees).set({ audio: cle }).where(eq(entrees.id, id))
  revalidatePath('/entrees')
  revalidatePath(`/entrees/${id}`)
  return { cle }
}

export async function lancerPublication(): Promise<ResultatPublication> {
  const [lignes, listeThemes, derniere] = await Promise.all([
    db.select().from(entrees),
    db.select().from(themes),
    db.select().from(publications),
  ])
  const version = Math.max(0, ...derniere.map((p) => p.version)) + 1
  const stockage = creerStockage()

  const publiables = lignes.filter((ligne) => ligne.audio !== null)
  if (publiables.length === 0) {
    return { ok: false, problemes: [{ code: 'audio-absent', message: 'Aucune entrée enregistrée.' }] }
  }

  const artefact = construireArtefact(publiables, listeThemes, {
    version,
    publieLe: new Date(),
    urlBaseAudio: stockage.urlPublique(),
  })

  const resultat = await publierArtefact(artefact, stockage)
  if (resultat.ok) {
    await db.insert(publications).values({ version, nbEntrees: publiables.length })
    revalidatePath('/')
  }
  return resultat
}
```

- [ ] **Step 2: Écrire la route de service des médias en développement**

`apps/studio/src/app/medias/[...cle]/route.ts` :

```ts
import { creerStockage } from '@/stockage/index.js'

/** Sert les médias en développement, quand le stockage est sur disque. */
export async function GET(_requete: Request, contexte: { params: Promise<{ cle: string[] }> }) {
  const { cle } = await contexte.params
  const octets = await creerStockage().lire(cle.join('/'))
  if (!octets) return new Response('introuvable', { status: 404 })
  // Uint8Array<ArrayBufferLike> n'est pas un BodyInit valide depuis TypeScript 5.9 :
  // on passe l'ArrayBuffer sous-jacent, que Response accepte.
  const corps = octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer
  return new Response(corps, { headers: { 'content-type': 'audio/webm' } })
}
```

- [ ] **Step 3: Écrire l'enregistreur**

`apps/studio/src/app/Enregistreur.tsx` :

```tsx
'use client'

import { useRef, useState } from 'react'
import { televerserAudio } from './actions.js'

export function Enregistreur({ id, audioActuel }: { id: string; audioActuel: string | null }) {
  const [etat, setEtat] = useState<'pret' | 'enregistre' | 'envoi'>('pret')
  const [apercu, setApercu] = useState<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const morceaux = useRef<Blob[]>([])

  async function demarrer() {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: true })
    morceaux.current = []
    const enregistreur = new MediaRecorder(flux)
    enregistreur.ondataavailable = (evenement) => morceaux.current.push(evenement.data)
    enregistreur.onstop = async () => {
      for (const piste of flux.getTracks()) piste.stop()
      const blob = new Blob(morceaux.current, { type: enregistreur.mimeType })
      setApercu(URL.createObjectURL(blob))
      setEtat('envoi')
      const extension = enregistreur.mimeType.includes('mp4') ? 'mp4' : 'webm'
      await televerserAudio(id, new File([blob], `${id}.${extension}`, { type: enregistreur.mimeType }))
      setEtat('pret')
    }
    recorder.current = enregistreur
    enregistreur.start()
    setEtat('enregistre')
  }

  function arreter() {
    recorder.current?.stop()
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
      {etat === 'enregistre' ? (
        <button type="button" onClick={arreter} style={{ padding: '8px 16px' }}>
          ⏹ Arrêter
        </button>
      ) : (
        <button type="button" onClick={demarrer} disabled={etat === 'envoi'} style={{ padding: '8px 16px' }}>
          {etat === 'envoi' ? 'Envoi…' : '⏺ Enregistrer'}
        </button>
      )}
      {apercu ? <audio controls src={apercu} /> : null}
      {!apercu && audioActuel ? <audio controls src={`/medias/${audioActuel}`} /> : null}
      {!apercu && !audioActuel ? <span style={{ color: '#b0413e' }}>aucun audio</span> : null}
    </div>
  )
}
```

- [ ] **Step 4: Écrire les pages**

`apps/studio/src/app/entrees/page.tsx` :

```tsx
import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { db } from '@/db/index.js'
import { entrees } from '@/db/schema.js'
import { emojiDepuisPicto } from '@/stockage/index.js'

export const dynamic = 'force-dynamic'

export default async function ListeEntrees() {
  const lignes = await db.select().from(entrees).orderBy(asc(entrees.id))
  const enregistrees = lignes.filter((l) => l.audio).length

  return (
    <main style={{ padding: 24 }}>
      <h1>Entrées</h1>
      <p>
        {enregistrees} / {lignes.length} enregistrées
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 4 }}>
        {lignes.map((ligne) => (
          <li key={ligne.id}>
            <Link
              href={`/entrees/${ligne.id}`}
              style={{ display: 'flex', gap: 12, padding: 8, textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ fontSize: 24 }}>{emojiDepuisPicto(ligne.picto)}</span>
              <strong style={{ minWidth: 160 }}>{ligne.kabyle}</strong>
              <span style={{ opacity: 0.7, flex: 1 }}>{ligne.fr}</span>
              <span>{ligne.audio ? '🔊' : '—'}</span>
              <span>{ligne.aValider ? '⚠️' : '✅'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

`apps/studio/src/app/entrees/[id]/page.tsx` :

```tsx
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db } from '@/db/index.js'
import { entrees } from '@/db/schema.js'
import { Editeur } from './Editeur.js'

export const dynamic = 'force-dynamic'

export default async function PageEntree(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const [ligne] = await db.select().from(entrees).where(eq(entrees.id, id))
  if (!ligne) notFound()
  return <Editeur ligne={ligne} />
}
```

`apps/studio/src/app/entrees/[id]/Editeur.tsx` :

```tsx
import Link from 'next/link'
import type { LigneEntree } from '@/db/schema.js'
import { emojiDepuisPicto } from '@/stockage/index.js'
import { enregistrerEntree } from '@/app/actions.js'
import { Enregistreur } from '@/app/Enregistreur.js'

const champ = { width: '100%', padding: 8, fontSize: 16, marginBottom: 12 } as const

export function Editeur({ ligne }: { ligne: LigneEntree }) {
  return (
    <main style={{ padding: 24, maxWidth: 560 }}>
      <Link href="/entrees">← toutes les entrées</Link>
      <h1 style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 40 }}>{emojiDepuisPicto(ligne.picto)}</span>
        {ligne.kabyle}
      </h1>

      <Enregistreur id={ligne.id} audioActuel={ligne.audio} />

      <form action={enregistrerEntree} style={{ marginTop: 24 }}>
        <input type="hidden" name="id" value={ligne.id} />
        <label>
          Kabyle
          <input name="kabyle" defaultValue={ligne.kabyle} style={champ} />
        </label>
        <label>
          Français
          <input name="fr" defaultValue={ligne.fr} style={champ} />
        </label>
        <label>
          Pluriel
          <input name="pluriel" defaultValue={ligne.pluriel ?? ''} style={champ} />
        </label>
        <label>
          Niveau
          <input type="number" name="niveau" min={1} max={3} defaultValue={ligne.niveau} style={champ} />
        </label>
        <label>
          Notes
          <input name="notes" defaultValue={ligne.notes} style={champ} />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <input type="checkbox" name="aValider" defaultChecked={ligne.aValider} /> à valider
        </label>
        <button type="submit" style={{ padding: '8px 16px' }}>Enregistrer</button>
      </form>
    </main>
  )
}
```

`apps/studio/src/app/page.tsx` (remplace le contenu de la tâche 1) :

```tsx
import Link from 'next/link'
import { db } from '@/db/index.js'
import { entrees, publications } from '@/db/schema.js'
import { Publication } from './Publication.js'

export const dynamic = 'force-dynamic'

export default async function Accueil() {
  const [lignes, faites] = await Promise.all([
    db.select().from(entrees),
    db.select().from(publications),
  ])
  const enregistrees = lignes.filter((l) => l.audio).length
  const derniere = faites.sort((a, b) => b.version - a.version)[0]

  return (
    <main style={{ padding: 24, maxWidth: 560 }}>
      <h1>Studio Awal</h1>
      <p>
        <strong>{enregistrees}</strong> entrées enregistrées sur <strong>{lignes.length}</strong>.
      </p>
      <p>
        {derniere
          ? `Dernière publication : v${derniere.version}, ${derniere.nbEntrees} entrées.`
          : 'Jamais publié.'}
      </p>
      <p><Link href="/entrees">Saisir et enregistrer →</Link></p>
      <Publication />
    </main>
  )
}
```

`apps/studio/src/app/Publication.tsx` :

```tsx
'use client'

import { useState } from 'react'
import { lancerPublication } from './actions.js'
import type { ResultatPublication } from '@/publication/publier.js'

export function Publication() {
  const [resultat, setResultat] = useState<ResultatPublication | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function publier() {
    setEnCours(true)
    setResultat(await lancerPublication())
    setEnCours(false)
  }

  return (
    <section style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #ccc' }}>
      <button type="button" onClick={publier} disabled={enCours} style={{ padding: '8px 16px' }}>
        {enCours ? 'Publication…' : 'Publier le corpus'}
      </button>
      {resultat?.ok ? (
        <p style={{ color: '#1e7a3c' }}>Publié en v{resultat.version}.</p>
      ) : null}
      {resultat && !resultat.ok ? (
        <ul style={{ color: '#b0413e' }}>
          {resultat.problemes.map((probleme, index) => (
            <li key={index}>{probleme.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
```

- [ ] **Step 5: Vérifier la compilation**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio typecheck && pnpm --filter studio build
```

Attendu : typecheck propre et build réussi.

- [ ] **Step 6: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(studio): saisie, enregistrement audio et publication"
```

---

### Task 8: Peuplement du corpus et audios de remplacement

**Files:**
- Create: `apps/studio/seed/extraire.ts`
- Create: `apps/studio/seed/pictos.ts`
- Create: `apps/studio/seed/run.ts`
- Test: `apps/studio/test/extraire.test.ts`

**Interfaces:**
- Consumes: `docs/corpus-v1.md`, `db`, `creerStockage`
- Produces:
  - `extraireCorpus(markdown: string): { themes: ThemeSeed[]; entrees: EntreeSeed[] }`
  - `type EntreeSeed = { id: string; kabyle: string; fr: string; theme: string; notes: string; aValider: boolean }`

L'extraction lit les tableaux du document plutôt que de ressaisir 213 entrées à la main : le document reste la source, et une correction s'y répercute par un simple re-seed.

Les identifiants sont dérivés du kabyle par translittération en slug — `3` devient `3`, les espaces des tirets. En cas de collision, un suffixe numérique est ajouté.

- [ ] **Step 1: Écrire le test**

`apps/studio/test/extraire.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extraireCorpus, versSlug } from '../seed/extraire.js'

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

  it('trouve les onze thèmes', () => {
    expect(themes).toHaveLength(11)
    expect(themes.map((t) => t.nom)).toContain('Les verbes')
  })

  it('extrait toutes les entrées du document', () => {
    expect(entrees.length).toBe(213)
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

  it('renseigne toujours kabyle et français', () => {
    expect(entrees.every((e) => e.kabyle.length > 0 && e.fr.length > 0)).toBe(true)
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Attendu : ÉCHEC — `../seed/extraire.js` introuvable.

- [ ] **Step 3: Implémenter l'extraction**

`apps/studio/seed/extraire.ts` :

```ts
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
    if (/^-+:?$/.test(premiere.replace(/[-: ]/g, '') || '-')) continue
    if (premiere.startsWith('---') || seconde.startsWith('---')) continue
    if (premiere === 'Français' || premiere === 'Fr' || premiere === 'Son') continue

    const kabyle = nettoyer(seconde)
    const fr = nettoyer(premiere)
    if (!kabyle || !fr) continue

    const notes = nettoyer(cellules[2] ?? '')
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

function nettoyer(cellule: string): string {
  return cellule.replace(/`/g, '').replace(/\*\*/g, '').trim()
}
```

- [ ] **Step 4: Vérifier l'extraction et ajuster**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm --filter studio test
```

Si le compte diffère de 213, afficher le détail par thème et corriger le filtrage plutôt que le nombre attendu :

```bash
cd apps/studio && pnpm tsx -e "
import { readFileSync } from 'node:fs'
import { extraireCorpus } from './seed/extraire.ts'
const { themes, entrees } = extraireCorpus(readFileSync('../../docs/corpus-v1.md','utf8'))
for (const t of themes) console.log(t.nom.padEnd(30), entrees.filter(e => e.theme === t.id).length)
console.log('TOTAL', entrees.length)
"
```

- [ ] **Step 5: Écrire la table des pictos et le seed**

`apps/studio/seed/pictos.ts` : une correspondance `id → codepoint`, avec un défaut par thème pour les entrées abstraites.

```ts
/** Emoji par entrée. Les absents reçoivent le défaut de leur thème. */
export const PICTOS: Record<string, string> = {
  baba: '1F468', yemma: '1F469', aghroum: '1F35E', aman: '1F4A7',
  amchich: '1F408', aydi: '1F415', thafoukth: '2600', ayyour: '1F319',
}

export const PICTO_PAR_THEME: Record<string, string> = {
  'la-famille': '1F46A',
  'le-corps': '1F464',
  'les-animaux': '1F43E',
  'manger-et-boire': '1F374',
  'les-couleurs': '1F3A8',
  'les-nombres': '1F522',
  'la-maison': '1F3E0',
  'dehors-et-le-temps': '1F30D',
  'les-vetements': '1F455',
  'les-verbes': '1F3C3',
  'politesse-et-mots-outils': '1F4AC',
}

export const COULEUR_PAR_THEME: Record<string, string> = {
  'la-famille': '#c94f7c',
  'le-corps': '#c97a4f',
  'les-animaux': '#3d7ec9',
  'manger-et-boire': '#c94f3d',
  'les-couleurs': '#8e4fc9',
  'les-nombres': '#4f8ec9',
  'la-maison': '#8a6d3b',
  'dehors-et-le-temps': '#2e8b57',
  'les-vetements': '#b8860b',
  'les-verbes': '#c9564f',
  'politesse-et-mots-outils': '#4f6dc9',
}

export function pictoPour(id: string, theme: string): string {
  return `openmoji:${PICTOS[id] ?? PICTO_PAR_THEME[theme] ?? '2753'}`
}
```

`apps/studio/seed/run.ts` :

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { db } from '../src/db/index.js'
import { entrees, themes } from '../src/db/schema.js'
import { extraireCorpus } from './extraire.js'
import { COULEUR_PAR_THEME, pictoPour } from './pictos.js'

const markdown = readFileSync(join(import.meta.dirname, '../../../docs/corpus-v1.md'), 'utf8')
const corpus = extraireCorpus(markdown)

await db
  .insert(themes)
  .values(
    corpus.themes.map((theme) => ({
      id: theme.id,
      nom: theme.nom,
      picto: pictoPour('', theme.id),
      couleur: COULEUR_PAR_THEME[theme.id] ?? '#666666',
      ordre: theme.ordre,
    })),
  )
  .onConflictDoNothing()

await db
  .insert(entrees)
  .values(
    corpus.entrees.map((entree) => ({
      id: entree.id,
      type: 'mot' as const,
      kabyle: entree.kabyle,
      fr: entree.fr,
      picto: pictoPour(entree.id, entree.theme),
      themes: [entree.theme],
      notes: entree.notes,
      aValider: entree.aValider,
    })),
  )
  .onConflictDoNothing()

console.log(`${corpus.themes.length} thèmes, ${corpus.entrees.length} entrées insérés.`)
process.exit(0)
```

- [ ] **Step 6: Exécuter le seed et vérifier**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/apps/studio
set -a && source .env.local && set +a
pnpm db:seed
```

Attendu : `11 thèmes, 213 entrées insérés.`

- [ ] **Step 7: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(studio): extraction du corpus et peuplement de la base"
```

---

## Ce que ce plan ne fait pas

- **Détection d'un audio silencieux** : reportée. Le geste d'enregistrement inclut une réécoute immédiate, ce qui la rend largement redondante.
- **Suppression et création d'entrées depuis l'interface** : le corpus vient du document, la retouche se fait par re-seed. Le studio sert à enregistrer et corriger, pas à administrer.
- **Génération des audios de remplacement synthétiques** : traitée dans la vérification finale, avec l'app enfant, puisque c'est elle qui en a besoin pour être testable.
