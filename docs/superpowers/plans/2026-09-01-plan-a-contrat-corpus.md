# Plan A — Contrat de corpus

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Établir le contrat de données partagé entre le studio et l'app enfant — schémas, validation, format de l'artefact publié — sous forme d'un paquet testé.

**Architecture:** Un monorepo pnpm avec un paquet `@awal/corpus` sans dépendance d'exécution ni accès disque ou réseau. Les schémas sont définis en Zod, ce qui donne la validation à l'exécution et les types TypeScript à partir d'une source unique. La validation est scindée en deux : `validerStructure` est pure et synchrone, `validerMedias` prend une interface injectée pour vérifier la présence réelle des fichiers — ce qui permet au paquet de rester sans I/O tout en laissant le studio brancher R2.

**Tech Stack:** pnpm workspaces, TypeScript 5, Zod 3, Vitest 2.

## Global Constraints

- **Domaine nommé en français.** Types, champs et fonctions : `Entree`, `Theme`, `Artefact`, `contient`, `niveau`, `validerStructure`. Pas de mélange français/anglais dans les noms du domaine.
- **Le paquet `@awal/corpus` n'a aucun I/O.** Ni `fs`, ni `fetch`, ni accès réseau. Tout accès externe passe par une interface injectée.
- **Graphie usuelle uniquement.** Le champ `kabyle` porte la transcription usuelle (`gh`, `kh`, `ou`, `th`, `dh`, `3`, `h`). Le champ `kabyleStd` est optionnel et n'est jamais affiché.
- **Un mot muet doit être impossible à publier.** La validation des médias est une exigence, pas un confort.
- **TDD strict** : test qui échoue, puis implémentation minimale, puis commit.
- **Le paquet est consommé en TypeScript source**, sans étape de build. Les applications Next.js des plans B et C devront donc le déclarer dans `transpilePackages`.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `pnpm-workspace.yaml` | déclare `packages/*` et `apps/*` |
| `package.json` | racine du workspace, scripts `test` et `typecheck` |
| `tsconfig.base.json` | réglages TypeScript partagés |
| `packages/corpus/src/entree.ts` | schéma d'une entrée et son type |
| `packages/corpus/src/theme.ts` | schéma d'un thème et son type |
| `packages/corpus/src/artefact.ts` | schéma de l'artefact publié |
| `packages/corpus/src/validation.ts` | règles inter-entrées, pures |
| `packages/corpus/src/medias.ts` | interface `VerificateurMedias` et validation asynchrone |
| `packages/corpus/src/index.ts` | surface publique du paquet |
| `packages/corpus/fixtures/corpus-minimal.ts` | artefact valide minimal, réutilisé par les deux apps |

Découpage par responsabilité : un fichier par concept du domaine. `validation.ts` et `medias.ts` sont séparés parce que l'un est synchrone et pur, l'autre asynchrone et dépendant d'une interface — les tester ensemble mélangerait deux régimes.

---

### Task 1: Squelette du monorepo et paquet corpus

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `packages/corpus/package.json`
- Create: `packages/corpus/tsconfig.json`
- Create: `packages/corpus/vitest.config.ts`
- Create: `packages/corpus/src/index.ts`
- Test: `packages/corpus/test/fumee.test.ts`

**Interfaces:**
- Consumes: rien
- Produces: le paquet `@awal/corpus`, la commande `pnpm test` à la racine, et la constante `VERSION_CONTRAT: number` exportée depuis `src/index.ts`

- [ ] **Step 1: Write the failing test**

Créer `packages/corpus/test/fumee.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { VERSION_CONTRAT } from '../src/index.js'

describe('paquet corpus', () => {
  it('expose la version du contrat', () => {
    expect(VERSION_CONTRAT).toBe(1)
  })
})
```

- [ ] **Step 2: Créer les fichiers de configuration**

`pnpm-workspace.yaml` :

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

`package.json` à la racine :

```json
{
  "name": "awal",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

`tsconfig.base.json` :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true
  }
}
```

`.gitignore` :

```
node_modules/
dist/
.next/
.env
.env.local
.DS_Store
```

`packages/corpus/package.json` :

```json
{
  "name": "@awal/corpus",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./fixtures": "./fixtures/corpus-minimal.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

`packages/corpus/tsconfig.json` :

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "noEmit": true
  },
  "include": ["src", "test", "fixtures"]
}
```

`packages/corpus/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm install && pnpm test
```

Attendu : ÉCHEC — `Failed to resolve import "../src/index.js"`, le fichier n'existe pas.

- [ ] **Step 4: Write minimal implementation**

`packages/corpus/src/index.ts` :

```ts
/** Version du contrat de corpus. À incrémenter à chaque changement incompatible. */
export const VERSION_CONTRAT = 1
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal && pnpm test
```

Attendu : SUCCÈS — 1 test passé.

- [ ] **Step 6: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "chore: squelette du monorepo et paquet corpus"
```

---

### Task 2: Schéma d'une entrée

**Files:**
- Create: `packages/corpus/src/entree.ts`
- Modify: `packages/corpus/src/index.ts`
- Test: `packages/corpus/test/entree.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `TYPES_ENTREE: readonly ['mot', 'phrase']`
  - `CARACTERES_GRAPHIE_STANDARD: RegExp`
  - `schemaEntree: z.ZodType`
  - `type Entree` — la forme validée, avec `niveau`, `contient` et `notes` toujours présents
  - `type EntreeSaisie` — la forme acceptée en entrée, où ces trois champs sont optionnels

- [ ] **Step 1: Write the failing test**

Créer `packages/corpus/test/entree.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { schemaEntree } from '../src/entree.js'

const entreeValide = {
  id: 'aghroum',
  type: 'mot' as const,
  kabyle: 'aghroum',
  fr: 'le pain',
  audio: 'audio/aghroum.opus',
  variante: 'kabyle-nord',
  picto: 'openmoji:1F35E',
  themes: ['manger-et-boire'],
}

describe('schemaEntree', () => {
  it('accepte une entrée minimale et applique les valeurs par défaut', () => {
    const entree = schemaEntree.parse(entreeValide)
    expect(entree.niveau).toBe(1)
    expect(entree.contient).toEqual([])
    expect(entree.notes).toBe('')
    expect(entree.kabyleStd).toBeUndefined()
  })

  it('accepte les champs optionnels quand ils sont fournis', () => {
    const entree = schemaEntree.parse({
      ...entreeValide,
      kabyleStd: 'aɣrum',
      pluriel: 'ighroumen',
      niveau: 2,
      notes: 'thème du village',
    })
    expect(entree.kabyleStd).toBe('aɣrum')
    expect(entree.pluriel).toBe('ighroumen')
    expect(entree.niveau).toBe(2)
  })

  it('refuse la graphie standard dans le champ kabyle', () => {
    const resultat = schemaEntree.safeParse({ ...entreeValide, kabyle: 'aɣrum' })
    expect(resultat.success).toBe(false)
  })

  it('refuse un id qui n’est pas un slug', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, id: 'Aghroum' }).success).toBe(false)
    expect(schemaEntree.safeParse({ ...entreeValide, id: 'agh roum' }).success).toBe(false)
  })

  it('refuse une entrée sans thème', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, themes: [] }).success).toBe(false)
  })

  it('refuse une traduction vide', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, fr: '' }).success).toBe(false)
  })

  it('refuse un audio manquant', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, audio: '' }).success).toBe(false)
  })

  it('refuse un niveau hors de 1 à 3', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, niveau: 0 }).success).toBe(false)
    expect(schemaEntree.safeParse({ ...entreeValide, niveau: 4 }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test
```

Attendu : ÉCHEC — `Failed to resolve import "../src/entree.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `packages/corpus/src/entree.ts` :

```ts
import { z } from 'zod'

/** Slug stable : minuscules, chiffres, tirets. Jamais renommé après publication. */
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Caractères propres à la graphie standard. Leur présence dans `kabyle`
 * signale une confusion avec `kabyleStd`, qui est l'erreur de saisie la plus probable
 * puisque les deux champs coexistent.
 */
export const CARACTERES_GRAPHIE_STANDARD = /[ɣɛḥẓṭṣḍčǧ]/u

export const TYPES_ENTREE = ['mot', 'phrase'] as const

export const schemaEntree = z.object({
  id: z.string().regex(SLUG, 'id : minuscules, chiffres et tirets uniquement'),
  type: z.enum(TYPES_ENTREE),
  kabyle: z
    .string()
    .min(1, 'kabyle : obligatoire')
    .refine(
      (valeur) => !CARACTERES_GRAPHIE_STANDARD.test(valeur),
      'kabyle : utiliser la transcription usuelle (gh, kh, ou, th, dh, 3, h), pas la graphie standard',
    ),
  kabyleStd: z.string().min(1).optional(),
  fr: z.string().min(1, 'fr : traduction obligatoire'),
  audio: z.string().min(1, 'audio : clé obligatoire'),
  variante: z.string().min(1, 'variante : obligatoire'),
  picto: z.string().min(1, 'picto : référence obligatoire'),
  themes: z.array(z.string().min(1)).min(1, 'themes : au moins un thème'),
  niveau: z.number().int().min(1).max(3).default(1),
  pluriel: z.string().min(1).optional(),
  contient: z.array(z.string().min(1)).default([]),
  notes: z.string().default(''),
})

/** Entrée validée : les champs à valeur par défaut sont toujours présents. */
export type Entree = z.output<typeof schemaEntree>

/** Entrée telle qu'on la saisit : les champs à valeur par défaut sont optionnels. */
export type EntreeSaisie = z.input<typeof schemaEntree>
```

Modifier `packages/corpus/src/index.ts` pour y ajouter :

```ts
export * from './entree.js'
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test && pnpm typecheck
```

Attendu : SUCCÈS — 9 tests au total, aucune erreur de type.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(corpus): schéma d'une entrée"
```

---

### Task 3: Schémas du thème et de l'artefact publié

**Files:**
- Create: `packages/corpus/src/theme.ts`
- Create: `packages/corpus/src/artefact.ts`
- Modify: `packages/corpus/src/index.ts`
- Test: `packages/corpus/test/artefact.test.ts`

**Interfaces:**
- Consumes: `schemaEntree` de la tâche 2
- Produces:
  - `schemaTheme`, `type Theme` — champs `id`, `nom`, `picto`, `couleur`
  - `schemaArtefact`, `type Artefact` — champs `version`, `publieLe`, `urlBaseAudio`, `themes`, `entrees`

- [ ] **Step 1: Write the failing test**

Créer `packages/corpus/test/artefact.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { schemaTheme } from '../src/theme.js'
import { schemaArtefact } from '../src/artefact.js'

const theme = {
  id: 'manger-et-boire',
  nom: 'Manger et boire',
  picto: 'openmoji:1F35E',
  couleur: '#c94f3d',
}

const entree = {
  id: 'aghroum',
  type: 'mot' as const,
  kabyle: 'aghroum',
  fr: 'le pain',
  audio: 'audio/aghroum.opus',
  variante: 'kabyle-nord',
  picto: 'openmoji:1F35E',
  themes: ['manger-et-boire'],
}

const artefact = {
  version: 1,
  publieLe: '2026-09-01T18:00:00.000Z',
  urlBaseAudio: 'https://media.awal.app/',
  themes: [theme],
  entrees: [entree],
}

describe('schemaTheme', () => {
  it('accepte un thème valide', () => {
    expect(schemaTheme.parse(theme).nom).toBe('Manger et boire')
  })

  it('refuse une couleur qui n’est pas hexadécimale', () => {
    expect(schemaTheme.safeParse({ ...theme, couleur: 'rouge' }).success).toBe(false)
  })
})

describe('schemaArtefact', () => {
  it('accepte un artefact valide', () => {
    expect(schemaArtefact.parse(artefact).entrees).toHaveLength(1)
  })

  it('refuse un artefact sans entrée', () => {
    expect(schemaArtefact.safeParse({ ...artefact, entrees: [] }).success).toBe(false)
  })

  it('refuse une version nulle ou négative', () => {
    expect(schemaArtefact.safeParse({ ...artefact, version: 0 }).success).toBe(false)
  })

  it('refuse une date de publication mal formée', () => {
    expect(schemaArtefact.safeParse({ ...artefact, publieLe: '01/09/2026' }).success).toBe(false)
  })

  it('refuse une url de base invalide', () => {
    expect(schemaArtefact.safeParse({ ...artefact, urlBaseAudio: 'media.awal.app' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test
```

Attendu : ÉCHEC — `Failed to resolve import "../src/theme.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `packages/corpus/src/theme.ts` :

```ts
import { z } from 'zod'
import { SLUG } from './entree.js'

export const schemaTheme = z.object({
  id: z.string().regex(SLUG, 'id : minuscules, chiffres et tirets uniquement'),
  nom: z.string().min(1),
  picto: z.string().min(1),
  couleur: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'couleur : format hexadécimal, ex. #c94f3d'),
})

export type Theme = z.output<typeof schemaTheme>
```

Créer `packages/corpus/src/artefact.ts` :

```ts
import { z } from 'zod'
import { schemaEntree } from './entree.js'
import { schemaTheme } from './theme.js'

/**
 * Artefact publié par le studio et consommé par l'app enfant.
 * `version` est incrémentée à chaque publication : elle sert à l'app à
 * savoir qu'un nouveau corpus est disponible sans comparer les contenus.
 */
export const schemaArtefact = z.object({
  version: z.number().int().positive(),
  publieLe: z.string().datetime(),
  urlBaseAudio: z.string().url(),
  themes: z.array(schemaTheme).min(1),
  entrees: z.array(schemaEntree).min(1),
})

export type Artefact = z.output<typeof schemaArtefact>
```

Ajouter dans `packages/corpus/src/index.ts` :

```ts
export * from './theme.js'
export * from './artefact.js'
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test && pnpm typecheck
```

Attendu : SUCCÈS — 16 tests au total.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(corpus): schémas du thème et de l'artefact publié"
```

---

### Task 4: Validation structurelle inter-entrées

**Files:**
- Create: `packages/corpus/src/validation.ts`
- Modify: `packages/corpus/src/index.ts`
- Test: `packages/corpus/test/validation.test.ts`

**Interfaces:**
- Consumes: `type Artefact` de la tâche 3
- Produces:
  - `type CodeProbleme` — union incluant `'id-duplique'`, `'theme-inconnu'`, `'reference-inconnue'`, `'mot-avec-contient'`, `'auto-reference'`, `'audio-absent'`, `'picto-absent'`
  - `interface ProblemeValidation { code: CodeProbleme; entreeId?: string; message: string }`
  - `validerStructure(artefact: Artefact): ProblemeValidation[]` — tableau vide si tout va bien

Les codes `'audio-absent'` et `'picto-absent'` sont déclarés ici mais produits par la tâche 5 : les deux validateurs partagent un seul type de problème pour que le studio puisse concaténer leurs résultats.

- [ ] **Step 1: Write the failing test**

Créer `packages/corpus/test/validation.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { schemaArtefact } from '../src/artefact.js'
import { validerStructure } from '../src/validation.js'
import type { Artefact } from '../src/artefact.js'

function construire(entrees: unknown[], themesIds = ['manger-et-boire']): Artefact {
  return schemaArtefact.parse({
    version: 1,
    publieLe: '2026-09-01T18:00:00.000Z',
    urlBaseAudio: 'https://media.awal.app/',
    themes: themesIds.map((id) => ({ id, nom: id, picto: 'openmoji:1F35E', couleur: '#c94f3d' })),
    entrees,
  })
}

const mot = (id: string, reste: Record<string, unknown> = {}) => ({
  id,
  type: 'mot',
  kabyle: id,
  fr: id,
  audio: `audio/${id}.opus`,
  variante: 'kabyle-nord',
  picto: 'openmoji:1F35E',
  themes: ['manger-et-boire'],
  ...reste,
})

describe('validerStructure', () => {
  it('ne signale rien sur un corpus sain', () => {
    expect(validerStructure(construire([mot('aghroum'), mot('aman')]))).toEqual([])
  })

  it('signale un identifiant dupliqué', () => {
    const problemes = validerStructure(construire([mot('aman'), mot('aman')]))
    expect(problemes).toHaveLength(1)
    expect(problemes[0]?.code).toBe('id-duplique')
    expect(problemes[0]?.entreeId).toBe('aman')
  })

  it('signale un thème inconnu', () => {
    const problemes = validerStructure(construire([mot('aman', { themes: ['inexistant'] })]))
    expect(problemes.map((p) => p.code)).toEqual(['theme-inconnu'])
  })

  it('signale une phrase qui référence un mot absent', () => {
    const phrase = mot('etch-aghroum', { type: 'phrase', contient: ['aghroum', 'absent'] })
    const problemes = validerStructure(construire([mot('aghroum'), phrase]))
    expect(problemes.map((p) => p.code)).toEqual(['reference-inconnue'])
    expect(problemes[0]?.message).toContain('absent')
  })

  it('signale un mot qui porte un champ contient non vide', () => {
    const problemes = validerStructure(construire([mot('aghroum'), mot('aman', { contient: ['aghroum'] })]))
    expect(problemes.map((p) => p.code)).toEqual(['mot-avec-contient'])
  })

  it('signale une phrase qui se référence elle-même', () => {
    const phrase = mot('boucle', { type: 'phrase', contient: ['boucle'] })
    expect(validerStructure(construire([phrase])).map((p) => p.code)).toEqual(['auto-reference'])
  })

  it('accumule plusieurs problèmes plutôt que de s’arrêter au premier', () => {
    const problemes = validerStructure(
      construire([mot('aman'), mot('aman'), mot('azrem', { themes: ['inexistant'] })]),
    )
    expect(problemes.map((p) => p.code).sort()).toEqual(['id-duplique', 'theme-inconnu'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test
```

Attendu : ÉCHEC — `Failed to resolve import "../src/validation.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `packages/corpus/src/validation.ts` :

```ts
import type { Artefact } from './artefact.js'

export type CodeProbleme =
  | 'id-duplique'
  | 'theme-inconnu'
  | 'reference-inconnue'
  | 'mot-avec-contient'
  | 'auto-reference'
  | 'audio-absent'
  | 'picto-absent'

export interface ProblemeValidation {
  code: CodeProbleme
  entreeId?: string
  message: string
}

/**
 * Règles qui portent sur les relations entre entrées, donc invérifiables
 * par un schéma pris isolément. Pure et synchrone : aucun accès disque ou réseau.
 *
 * Accumule tous les problèmes au lieu de s'arrêter au premier — le studio les
 * affiche ensemble, on ne veut pas les faire corriger un par un.
 */
export function validerStructure(artefact: Artefact): ProblemeValidation[] {
  const problemes: ProblemeValidation[] = []
  const idsThemes = new Set(artefact.themes.map((theme) => theme.id))
  const idsEntrees = new Set(artefact.entrees.map((entree) => entree.id))
  const dejaVus = new Set<string>()

  for (const entree of artefact.entrees) {
    if (dejaVus.has(entree.id)) {
      problemes.push({
        code: 'id-duplique',
        entreeId: entree.id,
        message: `L'identifiant « ${entree.id} » apparaît plusieurs fois.`,
      })
    }
    dejaVus.add(entree.id)

    for (const theme of entree.themes) {
      if (!idsThemes.has(theme)) {
        problemes.push({
          code: 'theme-inconnu',
          entreeId: entree.id,
          message: `Le thème « ${theme} » n'est pas déclaré.`,
        })
      }
    }

    if (entree.type === 'mot' && entree.contient.length > 0) {
      problemes.push({
        code: 'mot-avec-contient',
        entreeId: entree.id,
        message: `« ${entree.id} » est un mot : le champ contient doit rester vide.`,
      })
      continue
    }

    for (const reference of entree.contient) {
      if (reference === entree.id) {
        problemes.push({
          code: 'auto-reference',
          entreeId: entree.id,
          message: `« ${entree.id} » se référence elle-même.`,
        })
      } else if (!idsEntrees.has(reference)) {
        problemes.push({
          code: 'reference-inconnue',
          entreeId: entree.id,
          message: `« ${entree.id} » référence « ${reference} », qui n'existe pas.`,
        })
      }
    }
  }

  return problemes
}
```

Ajouter dans `packages/corpus/src/index.ts` :

```ts
export * from './validation.js'
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test && pnpm typecheck
```

Attendu : SUCCÈS — 23 tests au total.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(corpus): validation structurelle inter-entrées"
```

---

### Task 5: Validation des médias

**Files:**
- Create: `packages/corpus/src/medias.ts`
- Modify: `packages/corpus/src/index.ts`
- Test: `packages/corpus/test/medias.test.ts`

**Interfaces:**
- Consumes: `type Artefact` de la tâche 3, `type ProblemeValidation` de la tâche 4
- Produces:
  - `interface VerificateurMedias { audioExiste(cle: string): Promise<boolean>; pictoExiste(reference: string): Promise<boolean> }`
  - `validerMedias(artefact: Artefact, verificateur: VerificateurMedias): Promise<ProblemeValidation[]>`

C'est la règle qui rend un mot muet impossible à publier. Le studio fournira une implémentation de `VerificateurMedias` adossée à R2 ; le paquet ne connaît que l'interface.

- [ ] **Step 1: Write the failing test**

Créer `packages/corpus/test/medias.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { schemaArtefact } from '../src/artefact.js'
import { validerMedias } from '../src/medias.js'
import type { VerificateurMedias } from '../src/medias.js'
import type { Artefact } from '../src/artefact.js'

function construire(ids: string[]): Artefact {
  return schemaArtefact.parse({
    version: 1,
    publieLe: '2026-09-01T18:00:00.000Z',
    urlBaseAudio: 'https://media.awal.app/',
    themes: [{ id: 'manger-et-boire', nom: 'Manger', picto: 'openmoji:1F35E', couleur: '#c94f3d' }],
    entrees: ids.map((id) => ({
      id,
      type: 'mot',
      kabyle: id,
      fr: id,
      audio: `audio/${id}.opus`,
      variante: 'kabyle-nord',
      picto: `openmoji:${id}`,
      themes: ['manger-et-boire'],
    })),
  })
}

function verificateur(audiosPresents: string[], pictosPresents: string[]): VerificateurMedias {
  return {
    audioExiste: async (cle) => audiosPresents.includes(cle),
    pictoExiste: async (reference) => pictosPresents.includes(reference),
  }
}

describe('validerMedias', () => {
  it('ne signale rien quand tous les médias sont présents', async () => {
    const artefact = construire(['aghroum'])
    const problemes = await validerMedias(
      artefact,
      verificateur(['audio/aghroum.opus'], ['openmoji:aghroum']),
    )
    expect(problemes).toEqual([])
  })

  it('signale un audio absent', async () => {
    const artefact = construire(['aghroum'])
    const problemes = await validerMedias(artefact, verificateur([], ['openmoji:aghroum']))
    expect(problemes.map((p) => p.code)).toEqual(['audio-absent'])
    expect(problemes[0]?.entreeId).toBe('aghroum')
  })

  it('signale un picto absent', async () => {
    const artefact = construire(['aman'])
    const problemes = await validerMedias(artefact, verificateur(['audio/aman.opus'], []))
    expect(problemes.map((p) => p.code)).toEqual(['picto-absent'])
  })

  it('signale les deux quand les deux manquent', async () => {
    const problemes = await validerMedias(construire(['idh']), verificateur([], []))
    expect(problemes.map((p) => p.code).sort()).toEqual(['audio-absent', 'picto-absent'])
  })

  it('vérifie toutes les entrées, pas seulement la première', async () => {
    const artefact = construire(['aghroum', 'aman', 'idh'])
    const problemes = await validerMedias(
      artefact,
      verificateur(['audio/aghroum.opus'], ['openmoji:aghroum', 'openmoji:aman', 'openmoji:idh']),
    )
    expect(problemes.map((p) => p.entreeId).sort()).toEqual(['aman', 'idh'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test
```

Attendu : ÉCHEC — `Failed to resolve import "../src/medias.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `packages/corpus/src/medias.ts` :

```ts
import type { Artefact } from './artefact.js'
import type { ProblemeValidation } from './validation.js'

/**
 * Accès aux médias, injecté par l'appelant. Le paquet corpus ne fait aucun I/O :
 * le studio branchera une implémentation adossée à R2, les tests une implémentation en mémoire.
 */
export interface VerificateurMedias {
  audioExiste(cle: string): Promise<boolean>
  pictoExiste(reference: string): Promise<boolean>
}

/**
 * Vérifie que chaque entrée a bien son audio et son picto.
 * C'est cette règle qui rend impossible la publication d'un mot muet.
 */
export async function validerMedias(
  artefact: Artefact,
  verificateur: VerificateurMedias,
): Promise<ProblemeValidation[]> {
  const controles = artefact.entrees.map(async (entree) => {
    const [audioPresent, pictoPresent] = await Promise.all([
      verificateur.audioExiste(entree.audio),
      verificateur.pictoExiste(entree.picto),
    ])

    const problemes: ProblemeValidation[] = []
    if (!audioPresent) {
      problemes.push({
        code: 'audio-absent',
        entreeId: entree.id,
        message: `L'audio « ${entree.audio} » est introuvable.`,
      })
    }
    if (!pictoPresent) {
      problemes.push({
        code: 'picto-absent',
        entreeId: entree.id,
        message: `Le picto « ${entree.picto} » est introuvable.`,
      })
    }
    return problemes
  })

  return (await Promise.all(controles)).flat()
}
```

Ajouter dans `packages/corpus/src/index.ts` :

```ts
export * from './medias.js'
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test && pnpm typecheck
```

Attendu : SUCCÈS — 28 tests au total.

- [ ] **Step 5: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(corpus): validation des médias par interface injectée"
```

---

### Task 6: Fixture partagée et surface publique

**Files:**
- Create: `packages/corpus/fixtures/corpus-minimal.ts`
- Modify: `packages/corpus/src/index.ts`
- Test: `packages/corpus/test/fixtures.test.ts`

**Interfaces:**
- Consumes: tout ce qui précède
- Produces: `corpusMinimal: Artefact` — importable par `@awal/corpus/fixtures`, utilisé par le studio et l'app enfant pour leurs propres tests

Six entrées couvrant les cas qui comptent : deux thèmes, un mot avec pluriel, un mot avec `kabyleStd`, une phrase avec `contient`, et deux niveaux différents.

- [ ] **Step 1: Write the failing test**

Créer `packages/corpus/test/fixtures.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { corpusMinimal } from '../fixtures/corpus-minimal.js'
import { schemaArtefact } from '../src/artefact.js'
import { validerStructure } from '../src/validation.js'

describe('corpusMinimal', () => {
  it('est conforme au schéma', () => {
    expect(() => schemaArtefact.parse(corpusMinimal)).not.toThrow()
  })

  it('ne présente aucun problème structurel', () => {
    expect(validerStructure(corpusMinimal)).toEqual([])
  })

  it('couvre les cas utiles aux tests des deux applications', () => {
    expect(corpusMinimal.themes.length).toBeGreaterThanOrEqual(2)
    expect(corpusMinimal.entrees.some((e) => e.type === 'phrase')).toBe(true)
    expect(corpusMinimal.entrees.some((e) => e.pluriel !== undefined)).toBe(true)
    expect(corpusMinimal.entrees.some((e) => e.kabyleStd !== undefined)).toBe(true)
    expect(new Set(corpusMinimal.entrees.map((e) => e.niveau)).size).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test
```

Attendu : ÉCHEC — `Failed to resolve import "../fixtures/corpus-minimal.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `packages/corpus/fixtures/corpus-minimal.ts` :

```ts
import { schemaArtefact } from '../src/artefact.js'
import type { Artefact } from '../src/artefact.js'

/**
 * Corpus valide minimal, partagé par les tests du studio et de l'app enfant.
 * Les mots sont réels et tirés de docs/corpus-v1.md ; les clés audio et pictos
 * sont fictives — les tests injectent leur propre VerificateurMedias.
 */
export const corpusMinimal: Artefact = schemaArtefact.parse({
  version: 1,
  publieLe: '2026-09-01T18:00:00.000Z',
  urlBaseAudio: 'https://media.awal.test/',
  themes: [
    { id: 'manger-et-boire', nom: 'Manger et boire', picto: 'openmoji:1F35E', couleur: '#c94f3d' },
    { id: 'les-animaux', nom: 'Les animaux', picto: 'openmoji:1F408', couleur: '#3d7ec9' },
  ],
  entrees: [
    {
      id: 'aghroum',
      type: 'mot',
      kabyle: 'aghroum',
      kabyleStd: 'aɣrum',
      fr: 'le pain',
      audio: 'audio/aghroum.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F35E',
      themes: ['manger-et-boire'],
      niveau: 1,
      pluriel: 'ighroumen',
    },
    {
      id: 'aman',
      type: 'mot',
      kabyle: 'aman',
      fr: "l'eau",
      audio: 'audio/aman.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F4A7',
      themes: ['manger-et-boire'],
      niveau: 1,
      notes: 'toujours au pluriel en kabyle',
    },
    {
      id: 'amchich',
      type: 'mot',
      kabyle: 'amchich',
      fr: 'le chat',
      audio: 'audio/amchich.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F408',
      themes: ['les-animaux'],
      niveau: 1,
    },
    {
      id: 'aydi',
      type: 'mot',
      kabyle: 'aydi',
      fr: 'le chien',
      audio: 'audio/aydi.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F415',
      themes: ['les-animaux'],
      niveau: 1,
    },
    {
      id: 'etch',
      type: 'mot',
      kabyle: 'etch',
      fr: 'mange',
      audio: 'audio/etch.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F374',
      themes: ['manger-et-boire'],
      niveau: 2,
    },
    {
      id: 'etch-aghroum',
      type: 'phrase',
      kabyle: 'etch aghroum',
      fr: 'mange le pain',
      audio: 'audio/etch-aghroum.opus',
      variante: 'kabyle-nord',
      picto: 'openmoji:1F35E',
      themes: ['manger-et-boire'],
      niveau: 2,
      contient: ['etch', 'aghroum'],
    },
  ],
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal/packages/corpus && pnpm test && pnpm typecheck
```

Attendu : SUCCÈS — 31 tests au total.

- [ ] **Step 5: Vérifier la surface publique complète**

Le fichier `packages/corpus/src/index.ts` doit maintenant contenir exactement :

```ts
/** Version du contrat de corpus. À incrémenter à chaque changement incompatible. */
export const VERSION_CONTRAT = 1

export * from './entree.js'
export * from './theme.js'
export * from './artefact.js'
export * from './validation.js'
export * from './medias.js'
```

- [ ] **Step 6: Commit**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
git add -A
git commit -m "feat(corpus): fixture partagée et surface publique"
```

---

## Ce que ce plan ne fait pas

Volontairement hors périmètre, traité par les plans B et C :

- **Attribution des niveaux aux 213 entrées** — se fera au fil de la saisie dans le studio.
- **Implémentation R2 de `VerificateurMedias`** — plan B, le paquet n'expose que l'interface.
- **Détection d'un audio silencieux** — nécessite de décoder le fichier, donc plan B, au moment de l'enregistrement où l'on dispose déjà du flux.
- **Import du corpus depuis `docs/corpus-v1.md`** — le document est une liste de travail à relire, pas une source de données. La saisie se fera dans le studio, ce qui est aussi l'occasion de la relecture.
