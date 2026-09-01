# Plan C — Application enfant

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une PWA installable, hors-ligne, où un enfant lance sa session du jour, joue à deux activités, et voit sa collection se remplir.

**Architecture:** Next.js 15 en export statique — aucun serveur. Le corpus est téléchargé une fois depuis l'artefact publié puis mis en cache par un service worker. Le moteur Leitner et la composition de session sont des fonctions pures recevant la date en paramètre, ce qui permet de simuler soixante jours d'usage en test. La progression est écrite derrière une interface `MagasinProgression`, avec une implémentation `localStorage`.

**Tech Stack:** Next.js 15 (`output: 'export'`), React 19, Zod, Vitest, service worker écrit à la main.

## Global Constraints

- **Domaine nommé en français** : `Boite`, `composerSession`, `apresReponse`, `EtatEntree`.
- **Aucune date implicite.** Toute fonction du moteur reçoit `maintenant: Date` en paramètre. Aucun appel à `new Date()` hors des composants.
- **L'enfant ne voit jamais le moteur** : ni boîte, ni pourcentage, ni compteur — sauf le chronomètre du duel, qui n'est pas dans ce lot.
- **L'erreur ne punit jamais** : pas de rouge, pas de son d'échec, on rejoue l'audio et on laisse réessayer.
- **L'audio est préchargé** avant le démarrage d'une session, et déverrouillé au premier tap pour iOS.
- **`@awal/corpus` en source** : `transpilePackages` et `extensionAlias` comme dans le studio.
- **TDD** sur tout le moteur. Aucun test automatisé d'interface.

### Écarts au spec, assumés

- **`localStorage` plutôt qu'IndexedDB.** La progression pèse une vingtaine de kilo-octets ; l'API synchrone supprime une course au démarrage et beaucoup de code. L'interface `MagasinProgression` permet de basculer le jour où l'Écho du lot 2 stockera de vrais blobs audio — c'est là qu'IndexedDB deviendra nécessaire.
- **Service worker écrit à la main** plutôt que `next-pwa` : moins de magie, et une intégration avec Next 15 qui ne dépend pas d'un greffon tiers.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/moteur/leitner.ts` | boîtes, délais, avancement d'une entrée |
| `src/moteur/session.ts` | composition de la session du jour, plafond de nouveautés |
| `src/moteur/types.ts` | `EtatEntree`, `Progression`, `ResultatEntree` |
| `src/stockage/magasin.ts` | interface `MagasinProgression` |
| `src/stockage/local.ts` | implémentation `localStorage` |
| `src/stockage/profils.ts` | création et sélection des profils |
| `src/corpus/charger.ts` | téléchargement et cache de l'artefact |
| `src/audio/lecteur.ts` | préchargement, déverrouillage iOS, lecture |
| `src/jeux/types.ts` | contrat commun à toutes les activités |
| `src/jeux/EcouteEtChoisis.tsx` | activité de compréhension orale |
| `src/jeux/Memory.tsx` | activité de mémorisation |
| `src/app/**` | écrans |
| `public/sw.js` | service worker |

---

### Task 1: Squelette PWA

**Files:**
- Create: `apps/enfant/package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`
- Create: `apps/enfant/public/manifest.webmanifest`, `apps/enfant/public/sw.js`
- Create: `apps/enfant/src/app/layout.tsx`, `page.tsx`, `globals.css`
- Test: `apps/enfant/test/fumee.test.ts`

**Interfaces:**
- Produces: application exportable statiquement, servie sur le port 3002

- [x] **Step 1: Écrire le test de fumée**

`apps/enfant/test/fumee.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { VERSION_CONTRAT } from '@awal/corpus'

describe('app enfant', () => {
  it('consomme le paquet corpus', () => {
    expect(VERSION_CONTRAT).toBe(1)
  })
})
```

- [x] **Step 2: Créer la configuration**

`apps/enfant/package.json` :

```json
{
  "name": "enfant",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "servir": "npx --yes serve out -l 3002",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@awal/corpus": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.0",
    "vitest": "^2.1.0"
  }
}
```

`apps/enfant/next.config.ts` :

```ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'export',
  transpilePackages: ['@awal/corpus'],
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    }
    return config
  },
}

export default config
```

`apps/enfant/tsconfig.json` : identique à celui du studio, avec `"include": ["src", "test", "next-env.d.ts", ".next/types/**/*.ts"]`.

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
  "include": ["src", "test", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/enfant/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
  },
  resolve: {
    alias: { '@': new URL('./src/', import.meta.url).pathname },
  },
})
```

`apps/enfant/public/manifest.webmanifest` :

```json
{
  "name": "Awal",
  "short_name": "Awal",
  "description": "Apprendre le kabyle en jouant",
  "start_url": "/",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#fdf6ec",
  "theme_color": "#c94f3d",
  "icons": [
    { "src": "/icone-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icone-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

`apps/enfant/public/sw.js` :

```js
const CACHE = 'awal-v1'

// L'app shell est mise en cache à l'installation ; les audios le sont à la demande,
// puisqu'on ne connaît pas leurs URL avant d'avoir lu le corpus.
self.addEventListener('install', (evenement) => {
  evenement.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/'])))
  self.skipWaiting()
})

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((nom) => nom !== CACHE).map((nom) => caches.delete(nom))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  // Cache d'abord : un enfant hors ligne doit pouvoir jouer,
  // et un audio déjà entendu ne doit jamais être retéléchargé.
  evenement.respondWith(
    caches.match(requete).then((enCache) => {
      if (enCache) return enCache
      return fetch(requete).then((reponse) => {
        if (reponse.ok && (requete.url.includes('/audio/') || requete.url.includes('/corpus/'))) {
          const copie = reponse.clone()
          caches.open(CACHE).then((cache) => cache.put(requete, copie))
        }
        return reponse
      })
    }),
  )
})
```

`apps/enfant/src/app/globals.css` :

```css
:root {
  color-scheme: light;
  --fond: #fdf6ec;
  --encre: #2b2118;
  --accent: #c94f3d;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body {
  margin: 0;
  height: 100%;
  background: var(--fond);
  color: var(--encre);
  font-family: system-ui, -apple-system, sans-serif;
  /* Un enfant tape partout : la sélection de texte n'apporte que des ennuis. */
  user-select: none;
  overscroll-behavior: none;
}
button { font: inherit; cursor: pointer; }
```

`apps/enfant/src/app/layout.tsx` :

```tsx
import type { ReactMode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Awal',
  manifest: '/manifest.webmanifest',
}

export const viewport = {
  themeColor: '#c94f3d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
```

Note : le type correct est `React.ReactNode`. Ne pas écrire `ReactMode`.

`apps/enfant/src/app/page.tsx` :

```tsx
export default function Accueil() {
  return <main><h1>Awal</h1></main>
}
```

- [x] **Step 3: Installer et vérifier**

```bash
cd /Users/aghiles.benkaoudjt/DEV_PERSO/awal
pnpm install
pnpm --filter enfant test
```

Attendu : SUCCÈS — 1 test.

- [x] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(enfant): squelette PWA"
```

---

### Task 2: Moteur Leitner

**Files:**
- Create: `apps/enfant/src/moteur/types.ts`, `apps/enfant/src/moteur/leitner.ts`
- Test: `apps/enfant/test/leitner.test.ts`

**Interfaces:**
- Produces:
  - `NB_BOITES = 5`, `BOITE_ACQUISE = 4`, `DELAIS_JOURS: Record<number, number>`
  - `interface EtatEntree { boite: number; prochaine: string }` — `prochaine` au format `AAAA-MM-JJ`
  - `jour(date: Date): string`
  - `nouvelEtat(maintenant: Date): EtatEntree`
  - `apresReponse(etat: EtatEntree, reussi: boolean, maintenant: Date): EtatEntree`
  - `estDue(etat: EtatEntree, maintenant: Date): boolean`
  - `estAcquise(etat: EtatEntree): boolean`

Les délais se comptent en jours calendaires, pas en heures : un enfant qui joue à 8 h puis à 19 h ne doit pas voir la même carte deux fois, et celui qui joue à 23 h 55 doit retrouver ses révisions le lendemain matin.

- [x] **Step 1: Écrire le test**

`apps/enfant/test/leitner.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import {
  BOITE_ACQUISE, DELAIS_JOURS, NB_BOITES,
  apresReponse, estAcquise, estDue, jour, nouvelEtat,
} from '@/moteur/leitner.js'

const LUNDI = new Date('2026-09-07T08:00:00.000Z')
const LUNDI_SOIR = new Date('2026-09-07T22:30:00.000Z')
const MARDI = new Date('2026-09-08T08:00:00.000Z')

describe('jour', () => {
  it('réduit une date à son jour calendaire', () => {
    expect(jour(LUNDI)).toBe('2026-09-07')
    expect(jour(LUNDI_SOIR)).toBe('2026-09-07')
  })
})

describe('nouvelEtat', () => {
  it('démarre en boîte 1, due le jour même', () => {
    const etat = nouvelEtat(LUNDI)
    expect(etat.boite).toBe(1)
    expect(estDue(etat, LUNDI)).toBe(true)
  })
})

describe('apresReponse', () => {
  it('monte d’une boîte en cas de réussite', () => {
    expect(apresReponse(nouvelEtat(LUNDI), true, LUNDI).boite).toBe(2)
  })

  it('ne dépasse jamais la dernière boîte', () => {
    let etat = nouvelEtat(LUNDI)
    for (let i = 0; i < 20; i++) etat = apresReponse(etat, true, LUNDI)
    expect(etat.boite).toBe(NB_BOITES)
  })

  it('retombe en boîte 1 en cas d’échec', () => {
    let etat = nouvelEtat(LUNDI)
    etat = apresReponse(etat, true, LUNDI)
    etat = apresReponse(etat, true, LUNDI)
    expect(etat.boite).toBe(3)
    expect(apresReponse(etat, false, LUNDI).boite).toBe(1)
  })

  it('reporte la révision du délai de la nouvelle boîte', () => {
    const etat = apresReponse(nouvelEtat(LUNDI), true, LUNDI)
    expect(etat.boite).toBe(2)
    expect(etat.prochaine).toBe('2026-09-09') // boîte 2 => 2 jours
  })

  it('applique le délai de la boîte 1 après un échec', () => {
    let etat = nouvelEtat(LUNDI)
    etat = apresReponse(etat, true, LUNDI)
    etat = apresReponse(etat, false, LUNDI)
    expect(etat.prochaine).toBe('2026-09-08')
  })
})

describe('estDue', () => {
  it('n’est pas due avant sa date', () => {
    const etat = apresReponse(nouvelEtat(LUNDI), true, LUNDI)
    expect(estDue(etat, MARDI)).toBe(false)
  })

  it('est due le jour dit', () => {
    const etat = apresReponse(nouvelEtat(LUNDI), true, LUNDI)
    expect(estDue(etat, new Date('2026-09-09T06:00:00.000Z'))).toBe(true)
  })

  it('reste due si le jour est passé', () => {
    const etat = apresReponse(nouvelEtat(LUNDI), true, LUNDI)
    expect(estDue(etat, new Date('2026-10-01T06:00:00.000Z'))).toBe(true)
  })
})

describe('estAcquise', () => {
  it('n’est pas acquise avant la boîte seuil', () => {
    expect(estAcquise({ boite: BOITE_ACQUISE - 1, prochaine: '2026-09-07' })).toBe(false)
  })

  it('est acquise à partir de la boîte seuil', () => {
    expect(estAcquise({ boite: BOITE_ACQUISE, prochaine: '2026-09-07' })).toBe(true)
  })
})

describe('DELAIS_JOURS', () => {
  it('couvre toutes les boîtes et croît', () => {
    const delais = Array.from({ length: NB_BOITES }, (_, i) => DELAIS_JOURS[i + 1])
    expect(delais).toEqual([1, 2, 4, 7, 14])
  })
})
```

- [x] **Step 2: Vérifier l'échec**

```bash
pnpm --filter enfant test
```

Attendu : ÉCHEC — `@/moteur/leitner.js` introuvable.

- [x] **Step 3: Implémenter**

`apps/enfant/src/moteur/types.ts` :

```ts
/** État d'une entrée pour un profil donné. */
export interface EtatEntree {
  boite: number
  /** Jour calendaire de la prochaine révision, au format AAAA-MM-JJ. */
  prochaine: string
}

/** Ce qu'une activité renvoie au moteur, quelle que soit l'activité. */
export interface ResultatEntree {
  entreeId: string
  reussi: boolean
}

export interface Progression {
  etats: Record<string, EtatEntree>
  /** Nombre de mots nouveaux introduits, par jour calendaire. Sert au plafond. */
  nouveauxParJour: Record<string, number>
  /** Jours calendaires où une session a été terminée. Sert à la série. */
  joursJoues: string[]
}

export function progressionVide(): Progression {
  return { etats: {}, nouveauxParJour: {}, joursJoues: [] }
}
```

`apps/enfant/src/moteur/leitner.ts` :

```ts
import type { EtatEntree } from './types.js'

export const NB_BOITES = 5

/** À partir de cette boîte, la carte apparaît en couleur dans la collection. */
export const BOITE_ACQUISE = 4

export const DELAIS_JOURS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 }

/**
 * Réduit une date à son jour calendaire UTC.
 * Les délais se comptent en jours, pas en heures : jouer à 8 h puis à 19 h
 * ne doit pas ramener la même carte, et jouer à 23 h 55 doit rendre
 * les révisions du lendemain disponibles dès le matin.
 */
export function jour(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function ajouterJours(date: Date, nombre: number): string {
  const copie = new Date(date.getTime())
  copie.setUTCDate(copie.getUTCDate() + nombre)
  return jour(copie)
}

export function nouvelEtat(maintenant: Date): EtatEntree {
  return { boite: 1, prochaine: jour(maintenant) }
}

export function apresReponse(etat: EtatEntree, reussi: boolean, maintenant: Date): EtatEntree {
  const boite = reussi ? Math.min(etat.boite + 1, NB_BOITES) : 1
  return { boite, prochaine: ajouterJours(maintenant, DELAIS_JOURS[boite] ?? 1) }
}

export function estDue(etat: EtatEntree, maintenant: Date): boolean {
  return etat.prochaine <= jour(maintenant)
}

export function estAcquise(etat: EtatEntree): boolean {
  return etat.boite >= BOITE_ACQUISE
}
```

- [x] **Step 4: Vérifier**

```bash
pnpm --filter enfant test && pnpm --filter enfant typecheck
```

Attendu : SUCCÈS — 13 tests au total.

- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(enfant): moteur Leitner à cinq boîtes"
```

---

### Task 3: Composition de la session du jour

**Files:**
- Create: `apps/enfant/src/moteur/session.ts`
- Test: `apps/enfant/test/session.test.ts`, `apps/enfant/test/charge.test.ts`

**Interfaces:**
- Consumes: `EtatEntree`, `Progression`, moteur Leitner
- Produces:
  - `interface OptionsSession { taille: number; plafondNouveaux: number; niveauMax: number }`
  - `OPTIONS_PAR_AGE(age: number): OptionsSession`
  - `composerSession(entrees, progression, options, maintenant): Entree[]`
  - `appliquerResultats(progression, resultats, maintenant): Progression`

Le plafond de mots nouveaux par jour est le réglage central : sans lui, un enfant enthousiaste absorbe quarante mots un dimanche et se retrouve deux semaines plus tard face à une session de quarante minutes, qu'il abandonne.

- [x] **Step 1: Écrire les tests**

`apps/enfant/test/session.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import type { Entree } from '@awal/corpus'
import { OPTIONS_PAR_AGE, appliquerResultats, composerSession } from '@/moteur/session.js'
import { progressionVide, type Progression } from '@/moteur/types.js'
import { jour } from '@/moteur/leitner.js'

const LUNDI = new Date('2026-09-07T08:00:00.000Z')

function entree(id: string, niveau = 1): Entree {
  return {
    id, type: 'mot', kabyle: id, fr: id, audio: `audio/${id}.webm`,
    variante: 'kabyle-nord', picto: 'openmoji:1F35E', themes: ['t'],
    niveau, contient: [], notes: '',
  }
}

const vingtMots = Array.from({ length: 20 }, (_, i) => entree(`mot-${i}`))

describe('OPTIONS_PAR_AGE', () => {
  it('plafonne à 5 nouveautés pour un enfant de 6 ans', () => {
    expect(OPTIONS_PAR_AGE(6).plafondNouveaux).toBe(5)
  })

  it('plafonne à 8 nouveautés pour un enfant de 9 ans', () => {
    expect(OPTIONS_PAR_AGE(9).plafondNouveaux).toBe(8)
  })

  it('n’ouvre que le niveau 1 aux plus jeunes', () => {
    expect(OPTIONS_PAR_AGE(6).niveauMax).toBe(1)
    expect(OPTIONS_PAR_AGE(9).niveauMax).toBe(3)
  })
})

describe('composerSession', () => {
  const options = { taille: 12, plafondNouveaux: 5, niveauMax: 3 }

  it('respecte le plafond de nouveautés au premier jour', () => {
    const lot = composerSession(vingtMots, progressionVide(), options, LUNDI)
    expect(lot).toHaveLength(5)
  })

  it('ne dépasse jamais la taille demandée', () => {
    const progression = progressionVide()
    for (const e of vingtMots) progression.etats[e.id] = { boite: 1, prochaine: '2026-09-01' }
    expect(composerSession(vingtMots, progression, options, LUNDI)).toHaveLength(12)
  })

  it('sert d’abord les révisions dues, puis complète en nouveautés', () => {
    const progression = progressionVide()
    for (const e of vingtMots.slice(0, 4)) {
      progression.etats[e.id] = { boite: 2, prochaine: '2026-09-01' }
    }
    const lot = composerSession(vingtMots, progression, options, LUNDI)
    const revisions = lot.filter((e) => progression.etats[e.id])
    expect(revisions).toHaveLength(4)
    expect(lot).toHaveLength(9) // 4 révisions + 5 nouveautés autorisées
  })

  it('ignore les entrées non encore dues', () => {
    const progression = progressionVide()
    for (const e of vingtMots) progression.etats[e.id] = { boite: 3, prochaine: '2026-12-01' }
    expect(composerSession(vingtMots, progression, options, LUNDI)).toEqual([])
  })

  it('n’introduit plus de nouveautés une fois le plafond du jour atteint', () => {
    const progression = progressionVide()
    progression.nouveauxParJour[jour(LUNDI)] = 5
    expect(composerSession(vingtMots, progression, options, LUNDI)).toEqual([])
  })

  it('filtre les entrées au-dessus du niveau du profil', () => {
    const melange = [entree('facile', 1), entree('dur', 3)]
    const lot = composerSession(melange, progressionVide(), { ...options, niveauMax: 1 }, LUNDI)
    expect(lot.map((e) => e.id)).toEqual(['facile'])
  })
})

describe('appliquerResultats', () => {
  it('crée l’état d’une entrée vue pour la première fois', () => {
    const p = appliquerResultats(progressionVide(), [{ entreeId: 'a', reussi: true }], LUNDI)
    expect(p.etats.a?.boite).toBe(2)
  })

  it('compte les nouveautés du jour', () => {
    const p = appliquerResultats(
      progressionVide(),
      [{ entreeId: 'a', reussi: true }, { entreeId: 'b', reussi: false }],
      LUNDI,
    )
    expect(p.nouveauxParJour[jour(LUNDI)]).toBe(2)
  })

  it('ne recompte pas une entrée déjà connue', () => {
    let p: Progression = appliquerResultats(progressionVide(), [{ entreeId: 'a', reussi: true }], LUNDI)
    p = appliquerResultats(p, [{ entreeId: 'a', reussi: true }], LUNDI)
    expect(p.nouveauxParJour[jour(LUNDI)]).toBe(1)
  })

  it('enregistre le jour joué une seule fois', () => {
    let p = appliquerResultats(progressionVide(), [{ entreeId: 'a', reussi: true }], LUNDI)
    p = appliquerResultats(p, [{ entreeId: 'b', reussi: true }], LUNDI)
    expect(p.joursJoues).toEqual([jour(LUNDI)])
  })

  it('ne modifie pas la progression reçue', () => {
    const origine = progressionVide()
    appliquerResultats(origine, [{ entreeId: 'a', reussi: true }], LUNDI)
    expect(origine.etats).toEqual({})
  })
})
```

`apps/enfant/test/charge.test.ts` — le test décisif du spec :

```ts
import { describe, expect, it } from 'vitest'
import type { Entree } from '@awal/corpus'
import { appliquerResultats, composerSession } from '@/moteur/session.js'
import { estDue } from '@/moteur/leitner.js'
import { progressionVide, type Progression } from '@/moteur/types.js'

function corpus(taille: number): Entree[] {
  return Array.from({ length: taille }, (_, i) => ({
    id: `mot-${i}`, type: 'mot' as const, kabyle: `mot-${i}`, fr: `mot ${i}`,
    audio: `audio/mot-${i}.webm`, variante: 'kabyle-nord', picto: 'openmoji:1F35E',
    themes: ['t'], niveau: 1, contient: [], notes: '',
  }))
}

const OPTIONS = { taille: 12, plafondNouveaux: 5, niveauMax: 3 }

interface Jour {
  taille: number
  /** Entrées dues que la session n'a pas pu traiter : la dette de révision. */
  arriere: number
  vus: number
}

/**
 * Le mode de défaillance qui tue les applications de langue : la dette de
 * révision qui enfle jusqu'à devenir décourageante. Invisible en test manuel,
 * puisqu'il faut six semaines pour l'observer.
 */
function simuler(tauxReussite: number, jours = 60): Jour[] {
  const entrees = corpus(213)
  let progression: Progression = progressionVide()
  const journal: Jour[] = []

  for (let n = 0; n < jours; n++) {
    const date = new Date(Date.UTC(2026, 8, 7 + n, 8))
    const lot = composerSession(entrees, progression, OPTIONS, date)

    const dues = entrees.filter((e) => {
      const etat = progression.etats[e.id]
      return etat !== undefined && estDue(etat, date)
    }).length

    journal.push({
      taille: lot.length,
      arriere: Math.max(0, dues - lot.length),
      vus: Object.keys(progression.etats).length,
    })

    progression = appliquerResultats(
      progression,
      lot.map((e, i) => ({ entreeId: e.id, reussi: i / Math.max(1, lot.length) < tauxReussite })),
      date,
    )
  }
  return journal
}

describe('charge sur soixante jours', () => {
  it('ne dépasse jamais la taille cible, enfant appliqué', () => {
    expect(Math.max(...simuler(0.9).map((j) => j.taille))).toBeLessThanOrEqual(OPTIONS.taille)
  })

  it('ne dépasse jamais la taille cible, enfant en difficulté', () => {
    expect(Math.max(...simuler(0.4).map((j) => j.taille))).toBeLessThanOrEqual(OPTIONS.taille)
  })

  // Le vrai indicateur n'est pas un plafond arbitraire sur l'arriéré — une dette
  // transitoire d'une session est normale — mais sa non-divergence : il doit
  // rester borné et se résorber. Un moteur qui empile les révisions échouerait
  // sur la seconde assertion, pas nécessairement sur la première.
  for (const [profil, taux] of [['appliqué', 0.9], ['en difficulté', 0.4]] as const) {
    it(`garde une dette de révision bornée, enfant ${profil}`, () => {
      const journal = simuler(taux)
      expect(Math.max(...journal.map((j) => j.arriere))).toBeLessThanOrEqual(OPTIONS.taille * 2)
    })

    it(`résorbe la dette de révision, enfant ${profil}`, () => {
      const dernierTiers = simuler(taux).slice(40)
      expect(dernierTiers.some((j) => j.arriere === 0)).toBe(true)
    })
  }

  it('continue de proposer du travail au bout de deux mois', () => {
    expect(simuler(0.8).slice(-7).every((j) => j.taille > 0)).toBe(true)
  })

  it('introduit un volume de vocabulaire crédible en deux mois', () => {
    const fin = simuler(1)[59]!
    expect(fin.vus).toBeGreaterThan(100)
    expect(fin.vus).toBeLessThanOrEqual(213)
  })
})
```

- [x] **Step 2: Vérifier l'échec**

```bash
pnpm --filter enfant test
```

Attendu : ÉCHEC — `@/moteur/session.js` introuvable.

- [x] **Step 3: Implémenter**

`apps/enfant/src/moteur/session.ts` :

```ts
import type { Entree } from '@awal/corpus'
import { apresReponse, estDue, jour, nouvelEtat } from './leitner.js'
import type { Progression, ResultatEntree } from './types.js'

export interface OptionsSession {
  /** Nombre maximal d'entrées dans une session. Vise 5 à 8 minutes de jeu. */
  taille: number
  /** Nombre maximal de mots nouveaux introduits dans une journée. */
  plafondNouveaux: number
  /** Niveau le plus élevé accessible au profil. */
  niveauMax: number
}

export function OPTIONS_PAR_AGE(age: number): OptionsSession {
  return age <= 7
    ? { taille: 10, plafondNouveaux: 5, niveauMax: 1 }
    : { taille: 12, plafondNouveaux: 8, niveauMax: 3 }
}

/**
 * Compose la session du jour : les révisions dues d'abord, complétées par des
 * nouveautés dans la limite du plafond quotidien.
 *
 * Les révisions passent avant les nouveautés parce qu'une carte oubliée coûte
 * plus cher que retarder d'un jour une découverte — et parce que c'est ce qui
 * empêche la dette de révision d'enfler indéfiniment : quand les révisions
 * saturent la session, aucune nouveauté n'est introduite ce jour-là.
 */
export function composerSession(
  entrees: Entree[],
  progression: Progression,
  options: OptionsSession,
  maintenant: Date,
): Entree[] {
  const eligibles = entrees.filter((entree) => entree.niveau <= options.niveauMax)

  const revisions = eligibles.filter((entree) => {
    const etat = progression.etats[entree.id]
    return etat !== undefined && estDue(etat, maintenant)
  })

  const dejaIntroduits = progression.nouveauxParJour[jour(maintenant)] ?? 0
  const placesNouveautes = Math.min(
    Math.max(0, options.plafondNouveaux - dejaIntroduits),
    Math.max(0, options.taille - revisions.length),
  )

  const nouveautes = eligibles
    .filter((entree) => progression.etats[entree.id] === undefined)
    .slice(0, placesNouveautes)

  return [...revisions, ...nouveautes].slice(0, options.taille)
}

/**
 * Applique les résultats d'une activité. Ne modifie pas la progression reçue :
 * l'appelant remplace la sienne par la valeur renvoyée.
 */
export function appliquerResultats(
  progression: Progression,
  resultats: ResultatEntree[],
  maintenant: Date,
): Progression {
  const aujourdhui = jour(maintenant)
  const etats = { ...progression.etats }
  const nouveauxParJour = { ...progression.nouveauxParJour }
  let nouveaux = nouveauxParJour[aujourdhui] ?? 0

  for (const resultat of resultats) {
    const existant = etats[resultat.entreeId]
    if (existant === undefined) nouveaux += 1
    const depart = existant ?? nouvelEtat(maintenant)
    etats[resultat.entreeId] = apresReponse(depart, resultat.reussi, maintenant)
  }

  nouveauxParJour[aujourdhui] = nouveaux
  const joursJoues = progression.joursJoues.includes(aujourdhui)
    ? progression.joursJoues
    : [...progression.joursJoues, aujourdhui]

  return { etats, nouveauxParJour, joursJoues }
}

/**
 * Longueur de la série en cours. Un jour manqué est toléré ; deux la remettent
 * à zéro. Perdre trente jours pour une soirée chez les grands-parents serait absurde.
 */
export function serie(progression: Progression, maintenant: Date): number {
  const joues = new Set(progression.joursJoues)
  let longueur = 0
  let manques = 0
  const curseur = new Date(maintenant.getTime())

  for (let i = 0; i < 400; i++) {
    if (joues.has(jour(curseur))) {
      longueur += 1
      manques = 0
    } else if (i > 0) {
      manques += 1
      if (manques >= 2) break
    }
    curseur.setUTCDate(curseur.getUTCDate() - 1)
  }

  return longueur
}
```

- [x] **Step 4: Vérifier**

```bash
pnpm --filter enfant test
```

Attendu : SUCCÈS — 41 tests au total.

- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(enfant): composition de session et plafond de nouveautés"
```

---

### Task 4: Profils et magasin de progression

**Files:**
- Create: `apps/enfant/src/stockage/magasin.ts`, `local.ts`
- Test: `apps/enfant/test/magasin.test.ts`

**Interfaces:**
- Produces:
  - `interface Profil { id: string; prenom: string; avatar: string; age: number }`
  - `interface MagasinProgression { profils(): Profil[]; ajouterProfil(p): void; supprimerProfil(id): void; progression(profilId): Progression; enregistrer(profilId, p): void }`
  - `class MagasinLocal implements MagasinProgression`
  - `AVATARS: string[]`

- [x] **Step 1: Écrire le test**

`apps/enfant/test/magasin.test.ts` :

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { MagasinLocal } from '@/stockage/local.js'
import { progressionVide } from '@/moteur/types.js'

const idir = { id: 'idir', prenom: 'Idir', avatar: '🦊', age: 6 }

beforeEach(() => localStorage.clear())

describe('MagasinLocal', () => {
  it('part sans aucun profil', () => {
    expect(new MagasinLocal().profils()).toEqual([])
  })

  it('ajoute puis relit un profil', () => {
    const m = new MagasinLocal()
    m.ajouterProfil(idir)
    expect(new MagasinLocal().profils()).toEqual([idir])
  })

  it('remplace un profil de même identifiant', () => {
    const m = new MagasinLocal()
    m.ajouterProfil(idir)
    m.ajouterProfil({ ...idir, age: 7 })
    expect(m.profils()).toHaveLength(1)
    expect(m.profils()[0]?.age).toBe(7)
  })

  it('supprime un profil et sa progression', () => {
    const m = new MagasinLocal()
    m.ajouterProfil(idir)
    m.enregistrer('idir', { ...progressionVide(), joursJoues: ['2026-09-07'] })
    m.supprimerProfil('idir')
    expect(m.profils()).toEqual([])
    expect(new MagasinLocal().progression('idir').joursJoues).toEqual([])
  })

  it('rend une progression vide pour un profil inconnu', () => {
    expect(new MagasinLocal().progression('personne')).toEqual(progressionVide())
  })

  it('conserve la progression d’une instance à l’autre', () => {
    const m = new MagasinLocal()
    m.enregistrer('idir', { etats: { a: { boite: 3, prochaine: '2026-09-09' } }, nouveauxParJour: { '2026-09-07': 2 }, joursJoues: ['2026-09-07'] })
    const relu = new MagasinLocal().progression('idir')
    expect(relu.etats.a?.boite).toBe(3)
    expect(relu.nouveauxParJour['2026-09-07']).toBe(2)
  })

  it('sépare les progressions de deux profils', () => {
    const m = new MagasinLocal()
    m.enregistrer('idir', { ...progressionVide(), joursJoues: ['2026-09-07'] })
    m.enregistrer('lyes', { ...progressionVide(), joursJoues: ['2026-09-08'] })
    expect(m.progression('idir').joursJoues).toEqual(['2026-09-07'])
    expect(m.progression('lyes').joursJoues).toEqual(['2026-09-08'])
  })

  it('survit à des données corrompues plutôt que de planter', () => {
    localStorage.setItem('awal.progression.idir', 'ceci n’est pas du JSON')
    expect(new MagasinLocal().progression('idir')).toEqual(progressionVide())
  })
})
```

- [x] **Step 2: Vérifier l'échec, puis implémenter**

`apps/enfant/src/stockage/magasin.ts` :

```ts
import type { Progression } from '@/moteur/types.js'

export interface Profil {
  id: string
  prenom: string
  avatar: string
  age: number
}

/**
 * Frontière derrière laquelle vit la persistance. Une seconde implémentation
 * adossée à un serveur pourra s'y substituer le jour où un deuxième appareil
 * entre en jeu, sans toucher au reste de l'application.
 */
export interface MagasinProgression {
  profils(): Profil[]
  ajouterProfil(profil: Profil): void
  supprimerProfil(id: string): void
  progression(profilId: string): Progression
  enregistrer(profilId: string, progression: Progression): void
}

export const AVATARS = ['🦊', '🐢', '🦁', '🐝', '🦋', '🐬', '🦉', '🐿️', '🦔', '🐧']
```

`apps/enfant/src/stockage/local.ts` :

```ts
import { progressionVide, type Progression } from '@/moteur/types.js'
import type { MagasinProgression, Profil } from './magasin.js'

const CLE_PROFILS = 'awal.profils'
const PREFIXE_PROGRESSION = 'awal.progression.'

/**
 * localStorage plutôt qu'IndexedDB : la progression pèse une vingtaine de
 * kilo-octets, l'API synchrone supprime une course au démarrage, et le volume
 * ne justifie pas la complexité. À revoir quand l'Écho stockera des blobs audio.
 */
export class MagasinLocal implements MagasinProgression {
  private lire<T>(cle: string, defaut: T): T {
    try {
      const brut = localStorage.getItem(cle)
      return brut === null ? defaut : (JSON.parse(brut) as T)
    } catch {
      // Données corrompues : mieux vaut repartir de zéro que refuser de démarrer.
      return defaut
    }
  }

  profils(): Profil[] {
    return this.lire<Profil[]>(CLE_PROFILS, [])
  }

  ajouterProfil(profil: Profil): void {
    const autres = this.profils().filter((p) => p.id !== profil.id)
    localStorage.setItem(CLE_PROFILS, JSON.stringify([...autres, profil]))
  }

  supprimerProfil(id: string): void {
    localStorage.setItem(CLE_PROFILS, JSON.stringify(this.profils().filter((p) => p.id !== id)))
    localStorage.removeItem(PREFIXE_PROGRESSION + id)
  }

  progression(profilId: string): Progression {
    const lue = this.lire<Partial<Progression>>(PREFIXE_PROGRESSION + profilId, {})
    return {
      etats: lue.etats ?? {},
      nouveauxParJour: lue.nouveauxParJour ?? {},
      joursJoues: lue.joursJoues ?? [],
    }
  }

  enregistrer(profilId: string, progression: Progression): void {
    localStorage.setItem(PREFIXE_PROGRESSION + profilId, JSON.stringify(progression))
  }
}
```

- [x] **Step 3: Vérifier**

```bash
pnpm --filter enfant test
```

Attendu : SUCCÈS — 38 tests au total.

- [x] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(enfant): profils et magasin de progression"
```

---

### Task 5: Chargement du corpus et lecteur audio

**Files:**
- Create: `apps/enfant/src/corpus/charger.ts`
- Create: `apps/enfant/src/audio/lecteur.ts`
- Test: `apps/enfant/test/charger.test.ts`

**Interfaces:**
- Produces:
  - `URL_CORPUS` — lue depuis `NEXT_PUBLIC_URL_CORPUS`, avec repli `/corpus/actuel.json`
  - `chargerCorpus(fetcher?): Promise<Artefact>`
  - `urlAudio(artefact, entree): string`
  - `class Lecteur { deverrouiller(): void; precharger(urls): Promise<void>; jouer(url): Promise<void> }`

Le déverrouillage iOS est indispensable : Safari refuse toute lecture audio qui ne descend pas d'un geste utilisateur. On joue un silence au premier tap, ce qui autorise toutes les lectures suivantes.

- [x] **Step 1: Écrire le test**

`apps/enfant/test/charger.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { corpusMinimal } from '@awal/corpus/fixtures'
import { chargerCorpus, urlAudio } from '@/corpus/charger.js'

describe('chargerCorpus', () => {
  it('valide et renvoie un artefact conforme', async () => {
    const recu = await chargerCorpus(async () => new Response(JSON.stringify(corpusMinimal)))
    expect(recu.entrees).toHaveLength(corpusMinimal.entrees.length)
  })

  it('rejette un artefact non conforme', async () => {
    await expect(
      chargerCorpus(async () => new Response(JSON.stringify({ version: 1 }))),
    ).rejects.toThrow()
  })

  it('rejette une réponse en erreur', async () => {
    await expect(
      chargerCorpus(async () => new Response('nope', { status: 404 })),
    ).rejects.toThrow()
  })
})

describe('urlAudio', () => {
  it('concatène la base et la clé', () => {
    const entree = corpusMinimal.entrees[0]!
    expect(urlAudio(corpusMinimal, entree)).toBe(
      `${corpusMinimal.urlBaseAudio}${entree.audio}`,
    )
  })

  it('ne double pas la barre oblique', () => {
    const artefact = { ...corpusMinimal, urlBaseAudio: 'https://x.test/' }
    const entree = { ...corpusMinimal.entrees[0]!, audio: '/audio/a.webm' }
    expect(urlAudio(artefact, entree)).toBe('https://x.test/audio/a.webm')
  })
})
```

- [x] **Step 2: Implémenter**

`apps/enfant/src/corpus/charger.ts` :

```ts
import { schemaArtefact, type Artefact, type Entree } from '@awal/corpus'

export const URL_CORPUS = process.env.NEXT_PUBLIC_URL_CORPUS ?? '/corpus/actuel.json'

type Fetcher = (url: string) => Promise<Response>

/**
 * Télécharge l'artefact publié et le valide avant usage. Le service worker
 * s'occupe du cache : ici on suppose simplement que la requête aboutit,
 * en ligne comme hors ligne.
 */
export async function chargerCorpus(
  fetcher: Fetcher = (url) => fetch(url),
): Promise<Artefact> {
  const reponse = await fetcher(URL_CORPUS)
  if (!reponse.ok) throw new Error(`Corpus indisponible (${reponse.status}).`)
  return schemaArtefact.parse(await reponse.json())
}

export function urlAudio(artefact: Artefact, entree: Entree): string {
  const base = artefact.urlBaseAudio.replace(/\/+$/, '')
  const cle = entree.audio.replace(/^\/+/, '')
  return `${base}/${cle}`
}
```

`apps/enfant/src/audio/lecteur.ts` :

```ts
/**
 * Lecture audio robuste sur mobile.
 *
 * Deux contraintes dictent ce code : Safari iOS refuse toute lecture qui ne
 * descend pas d'un geste utilisateur, et 300 ms de latence suffisent à rendre
 * un jeu poussif. D'où le déverrouillage au premier tap et le préchargement.
 */
export class Lecteur {
  private readonly cache = new Map<string, HTMLAudioElement>()
  private deverrouille = false

  /** À appeler depuis un gestionnaire de clic, une seule fois par session. */
  deverrouiller(): void {
    if (this.deverrouille) return
    const silence = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    )
    void silence.play().catch(() => undefined)
    this.deverrouille = true
  }

  async precharger(urls: string[]): Promise<void> {
    await Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resoudre) => {
            if (this.cache.has(url)) return resoudre()
            const audio = new Audio()
            audio.preload = 'auto'
            const fini = () => resoudre()
            audio.addEventListener('canplaythrough', fini, { once: true })
            // Un audio manquant ne doit pas bloquer le démarrage de la session.
            audio.addEventListener('error', fini, { once: true })
            audio.src = url
            this.cache.set(url, audio)
          }),
      ),
    )
  }

  async jouer(url: string): Promise<void> {
    let audio = this.cache.get(url)
    if (!audio) {
      audio = new Audio(url)
      this.cache.set(url, audio)
    }
    audio.currentTime = 0
    try {
      await audio.play()
    } catch {
      // Lecture refusée par le navigateur : on ne casse pas le jeu pour autant.
    }
  }
}
```

- [x] **Step 3: Vérifier et commiter**

```bash
pnpm --filter enfant test
git add -A && git commit -m "feat(enfant): chargement du corpus et lecteur audio"
```

Attendu : SUCCÈS — 43 tests au total.

---

### Task 6: Les deux activités

**Files:**
- Create: `apps/enfant/src/jeux/types.ts`
- Create: `apps/enfant/src/jeux/choisirDistracteurs.ts`
- Create: `apps/enfant/src/jeux/EcouteEtChoisis.tsx`, `apps/enfant/src/jeux/Memory.tsx`
- Test: `apps/enfant/test/distracteurs.test.ts`

**Interfaces:**
- Produces:
  - `interface ProprietesJeu { lot: Entree[]; artefact: Artefact; lecteur: Lecteur; onTermine: (r: ResultatEntree[]) => void }`
  - `choisirDistracteurs(cible, candidats, nombre, alea): Entree[]`

Les distracteurs sont tirés en priorité dans le même thème : quatre images sans rapport rendent la bonne réponse devinable sans écouter, ce qui vide l'exercice de son intérêt.

- [x] **Step 1: Écrire le test**

`apps/enfant/test/distracteurs.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import type { Entree } from '@awal/corpus'
import { choisirDistracteurs } from '@/jeux/choisirDistracteurs.js'

function e(id: string, theme: string): Entree {
  return {
    id, type: 'mot', kabyle: id, fr: id, audio: `a/${id}`, variante: 'v',
    picto: `openmoji:1F40${id.length}`, themes: [theme], niveau: 1, contient: [], notes: '',
  }
}

const cible = e('amchich', 'animaux')
const memeTheme = [e('aydi', 'animaux'), e('izem', 'animaux'), e('ilef', 'animaux')]
const autreTheme = [e('aghroum', 'manger'), e('aman', 'manger')]

// Générateur déterministe : les tests ne doivent pas dépendre du hasard.
const alea = () => 0

describe('choisirDistracteurs', () => {
  it('rend le nombre demandé', () => {
    expect(choisirDistracteurs(cible, [...memeTheme, ...autreTheme], 3, alea)).toHaveLength(3)
  })

  it('n’inclut jamais la cible', () => {
    const tires = choisirDistracteurs(cible, [cible, ...memeTheme], 3, alea)
    expect(tires.map((x) => x.id)).not.toContain('amchich')
  })

  it('privilégie le même thème', () => {
    const tires = choisirDistracteurs(cible, [...autreTheme, ...memeTheme], 3, alea)
    expect(tires.every((x) => x.themes.includes('animaux'))).toBe(true)
  })

  it('complète avec d’autres thèmes quand le thème est trop pauvre', () => {
    const tires = choisirDistracteurs(cible, [e('aydi', 'animaux'), ...autreTheme], 3, alea)
    expect(tires).toHaveLength(3)
  })

  it('rend ce qu’il peut quand les candidats manquent', () => {
    expect(choisirDistracteurs(cible, [e('aydi', 'animaux')], 3, alea)).toHaveLength(1)
  })

  it('ne rend jamais deux fois la même entrée', () => {
    const tires = choisirDistracteurs(cible, [...memeTheme, ...autreTheme], 4, alea)
    expect(new Set(tires.map((x) => x.id)).size).toBe(tires.length)
  })
})
```

- [x] **Step 2: Implémenter le tirage**

`apps/enfant/src/jeux/choisirDistracteurs.ts` :

```ts
import type { Entree } from '@awal/corpus'

/** Mélange de Fisher-Yates, avec source d'aléa injectable pour les tests. */
export function melanger<T>(elements: T[], alea: () => number = Math.random): T[] {
  const copie = [...elements]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1))
    const a = copie[i]!
    const b = copie[j]!
    copie[i] = b
    copie[j] = a
  }
  return copie
}

/**
 * Tire des distracteurs, en priorité dans le thème de la cible.
 * Quatre images sans rapport rendraient la bonne réponse devinable sans écouter,
 * ce qui viderait l'exercice de son intérêt.
 */
export function choisirDistracteurs(
  cible: Entree,
  candidats: Entree[],
  nombre: number,
  alea: () => number = Math.random,
): Entree[] {
  const autres = candidats.filter((entree) => entree.id !== cible.id)
  const memeTheme = autres.filter((entree) =>
    entree.themes.some((theme) => cible.themes.includes(theme)),
  )
  const reste = autres.filter((entree) => !memeTheme.includes(entree))

  return [...melanger(memeTheme, alea), ...melanger(reste, alea)].slice(0, nombre)
}
```

- [x] **Step 3: Implémenter les activités**

`apps/enfant/src/jeux/types.ts` :

```ts
import type { Artefact, Entree } from '@awal/corpus'
import type { Lecteur } from '@/audio/lecteur.js'
import type { ResultatEntree } from '@/moteur/types.js'

/**
 * Contrat commun à toutes les activités : elles reçoivent un lot et rendent,
 * pour chaque entrée, un simple réussi/raté. Le moteur ignore quelle activité
 * a produit le résultat — c'est ce qui permet d'en ajouter sans rien toucher.
 */
export interface ProprietesJeu {
  lot: Entree[]
  artefact: Artefact
  lecteur: Lecteur
  onTermine: (resultats: ResultatEntree[]) => void
}
```

`apps/enfant/src/jeux/EcouteEtChoisis.tsx` :

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Entree } from '@awal/corpus'
import { urlAudio } from '@/corpus/charger.js'
import type { ResultatEntree } from '@/moteur/types.js'
import { choisirDistracteurs, melanger } from './choisirDistracteurs.js'
import { emoji } from './emoji.js'
import type { ProprietesJeu } from './types.js'

export function EcouteEtChoisis({ lot, artefact, lecteur, onTermine }: ProprietesJeu) {
  const [index, setIndex] = useState(0)
  const [resultats, setResultats] = useState<ResultatEntree[]>([])
  const [ecartees, setEcartees] = useState<string[]>([])
  const [rate, setRate] = useState(false)

  const cible = lot[index]

  const choix = useMemo(() => {
    if (!cible) return []
    const distracteurs = choisirDistracteurs(cible, artefact.entrees, 3)
    return melanger([cible, ...distracteurs])
  }, [cible, artefact])

  useEffect(() => {
    if (cible) void lecteur.jouer(urlAudio(artefact, cible))
    setEcartees([])
    setRate(false)
  }, [cible, artefact, lecteur])

  if (!cible) return null

  function repondre(entree: Entree) {
    if (!cible) return
    if (entree.id === cible.id) {
      const suivants = [...resultats, { entreeId: cible.id, reussi: !rate }]
      setResultats(suivants)
      if (index + 1 >= lot.length) onTermine(suivants)
      else setIndex(index + 1)
      return
    }
    // L'erreur ne punit pas : on écarte le mauvais choix, on rejoue, on laisse réessayer.
    setRate(true)
    setEcartees((precedentes) => [...precedentes, entree.id])
    void lecteur.jouer(urlAudio(artefact, cible))
  }

  return (
    <main style={{ display: 'grid', gap: 24, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
      <button
        type="button"
        onClick={() => lecteur.jouer(urlAudio(artefact, cible))}
        style={{ fontSize: 64, background: 'none', border: 'none' }}
        aria-label="réécouter"
      >
        🔊
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {choix.map((entree) => (
          <button
            key={entree.id}
            type="button"
            onClick={() => repondre(entree)}
            disabled={ecartees.includes(entree.id)}
            style={{
              fontSize: 72,
              width: 140,
              height: 140,
              borderRadius: 24,
              border: '3px solid #e6d9c6',
              background: '#fff',
              opacity: ecartees.includes(entree.id) ? 0.25 : 1,
            }}
          >
            {emoji(entree.picto)}
          </button>
        ))}
      </div>
    </main>
  )
}
```

`apps/enfant/src/jeux/emoji.ts` :

```ts
const REFERENCE = /^openmoji:([0-9A-Fa-f]{4,6})(-[0-9A-Fa-f]{4,6})*$/

/** Rend le picto sous forme d'emoji natif. Même règle que dans le studio. */
export function emoji(reference: string): string {
  if (!REFERENCE.test(reference)) return '❓'
  const points = reference.slice('openmoji:'.length).split('-').map((p) => Number.parseInt(p, 16))
  return String.fromCodePoint(...points)
}
```

`apps/enfant/src/jeux/Memory.tsx` :

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { urlAudio } from '@/corpus/charger.js'
import type { ResultatEntree } from '@/moteur/types.js'
import { melanger } from './choisirDistracteurs.js'
import { emoji } from './emoji.js'
import type { ProprietesJeu } from './types.js'

interface Carte {
  cle: string
  entreeId: string
  face: 'image' | 'son'
}

/** Memory à paires image ↔ son : retrouver le son qui va avec l'image. */
export function Memory({ lot, artefact, lecteur, onTermine }: ProprietesJeu) {
  const paires = useMemo(() => lot.slice(0, 6), [lot])

  const cartes = useMemo<Carte[]>(
    () =>
      melanger(
        paires.flatMap((entree) => [
          { cle: `${entree.id}-image`, entreeId: entree.id, face: 'image' as const },
          { cle: `${entree.id}-son`, entreeId: entree.id, face: 'son' as const },
        ]),
      ),
    [paires],
  )

  const [retournees, setRetournees] = useState<string[]>([])
  const [trouvees, setTrouvees] = useState<string[]>([])
  const [rates, setRates] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (trouvees.length > 0 && trouvees.length === paires.length) {
      onTermine(
        paires.map((entree) => ({ entreeId: entree.id, reussi: !rates.has(entree.id) })),
      )
    }
  }, [trouvees, paires, rates, onTermine])

  function retourner(carte: Carte) {
    if (trouvees.includes(carte.entreeId) || retournees.includes(carte.cle)) return

    const entree = artefact.entrees.find((e) => e.id === carte.entreeId)
    if (entree && carte.face === 'son') void lecteur.jouer(urlAudio(artefact, entree))

    const ouvertes = [...retournees, carte.cle]
    if (ouvertes.length < 2) {
      setRetournees(ouvertes)
      return
    }

    const [premiere] = ouvertes
    const autre = cartes.find((c) => c.cle === premiere)
    if (autre && autre.entreeId === carte.entreeId) {
      setTrouvees((precedentes) => [...precedentes, carte.entreeId])
      setRetournees([])
    } else {
      if (autre) setRates((precedents) => new Set(precedents).add(autre.entreeId))
      setRetournees(ouvertes)
      setTimeout(() => setRetournees([]), 700)
    }
  }

  return (
    <main style={{ display: 'grid', gap: 16, placeItems: 'center', padding: 16, minHeight: '100dvh' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {cartes.map((carte) => {
          const entree = artefact.entrees.find((e) => e.id === carte.entreeId)
          const visible = retournees.includes(carte.cle) || trouvees.includes(carte.entreeId)
          return (
            <button
              key={carte.cle}
              type="button"
              onClick={() => retourner(carte)}
              style={{
                fontSize: 44,
                width: 96,
                height: 96,
                borderRadius: 16,
                border: '3px solid #e6d9c6',
                background: visible ? '#fff' : '#e8d9bf',
                opacity: trouvees.includes(carte.entreeId) ? 0.4 : 1,
              }}
            >
              {!visible ? '' : carte.face === 'image' ? emoji(entree?.picto ?? '') : '🔊'}
            </button>
          )
        })}
      </div>
    </main>
  )
}
```

- [x] **Step 4: Vérifier et commiter**

```bash
pnpm --filter enfant test && pnpm --filter enfant typecheck
git add -A && git commit -m "feat(enfant): écoute-et-choisis et memory audio"
```

Attendu : SUCCÈS — 49 tests au total.

---

### Task 7: Les écrans

**Files:**
- Create: `apps/enfant/src/app/Application.tsx` — orchestrateur client
- Create: `apps/enfant/src/app/ecrans/ChoixProfil.tsx`, `Accueil.tsx`, `Collection.tsx`, `Bilan.tsx`
- Modify: `apps/enfant/src/app/page.tsx`

**Interfaces:**
- Consumes: tout ce qui précède
- Produces: une application complète pilotée par un état `'profil' | 'accueil' | 'session' | 'collection' | 'bilan'`

L'application entière est un composant client unique. Il n'y a pas de serveur, la navigation par URL n'apporterait rien à un enfant, et un état local rend les transitions instantanées.

- [x] **Step 1: Écrire l'orchestrateur**

`apps/enfant/src/app/Application.tsx` :

```tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Artefact } from '@awal/corpus'
import { Lecteur } from '@/audio/lecteur.js'
import { chargerCorpus, urlAudio } from '@/corpus/charger.js'
import { estAcquise } from '@/moteur/leitner.js'
import { OPTIONS_PAR_AGE, appliquerResultats, composerSession, serie } from '@/moteur/session.js'
import type { Progression, ResultatEntree } from '@/moteur/types.js'
import { MagasinLocal } from '@/stockage/local.js'
import type { Profil } from '@/stockage/magasin.js'
import { EcouteEtChoisis } from '@/jeux/EcouteEtChoisis.js'
import { Memory } from '@/jeux/Memory.js'
import { Accueil } from './ecrans/Accueil.js'
import { Bilan } from './ecrans/Bilan.js'
import { ChoixProfil } from './ecrans/ChoixProfil.js'
import { Collection } from './ecrans/Collection.js'

type Ecran = 'profil' | 'accueil' | 'session' | 'collection' | 'bilan'

export function Application() {
  const magasin = useMemo(() => new MagasinLocal(), [])
  const lecteur = useMemo(() => new Lecteur(), [])
  const [artefact, setArtefact] = useState<Artefact | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [progression, setProgression] = useState<Progression | null>(null)
  const [ecran, setEcran] = useState<Ecran>('profil')
  const [derniersResultats, setDerniersResultats] = useState<ResultatEntree[]>([])
  const [jeu, setJeu] = useState<'ecoute' | 'memory'>('ecoute')
  const lot = useRef<Artefact['entrees']>([])

  useEffect(() => {
    chargerCorpus()
      .then(setArtefact)
      .catch((cause: unknown) => setErreur(String(cause)))
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }
  }, [])

  const choisirProfil = useCallback(
    (choisi: Profil) => {
      lecteur.deverrouiller()
      setProfil(choisi)
      setProgression(magasin.progression(choisi.id))
      setEcran('accueil')
    },
    [lecteur, magasin],
  )

  const demarrer = useCallback(async () => {
    if (!artefact || !profil || !progression) return
    const options = OPTIONS_PAR_AGE(profil.age)
    const compose = composerSession(artefact.entrees, progression, options, new Date())
    if (compose.length === 0) return
    lot.current = compose
    await lecteur.precharger(compose.map((entree) => urlAudio(artefact, entree)))
    setJeu(compose.length >= 6 && Math.random() < 0.4 ? 'memory' : 'ecoute')
    setEcran('session')
  }, [artefact, profil, progression, lecteur])

  const terminer = useCallback(
    (resultats: ResultatEntree[]) => {
      if (!profil || !progression) return
      const suivante = appliquerResultats(progression, resultats, new Date())
      magasin.enregistrer(profil.id, suivante)
      setProgression(suivante)
      setDerniersResultats(resultats)
      setEcran('bilan')
    },
    [profil, progression, magasin],
  )

  if (erreur) {
    return (
      <main style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 64 }}>📡</p>
        <p>Le corpus n’a pas pu être chargé.</p>
        <p style={{ opacity: 0.6, fontSize: 13 }}>{erreur}</p>
      </main>
    )
  }

  if (!artefact) {
    return <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', fontSize: 64 }}>⏳</main>
  }

  if (ecran === 'profil' || !profil || !progression) {
    return <ChoixProfil magasin={magasin} onChoisi={choisirProfil} />
  }

  if (ecran === 'session') {
    const proprietes = { lot: lot.current, artefact, lecteur, onTermine: terminer }
    return jeu === 'memory' ? <Memory {...proprietes} /> : <EcouteEtChoisis {...proprietes} />
  }

  if (ecran === 'collection') {
    return (
      <Collection
        artefact={artefact}
        progression={progression}
        onRetour={() => setEcran('accueil')}
      />
    )
  }

  if (ecran === 'bilan') {
    const acquises = derniersResultats
      .map((resultat) => resultat.entreeId)
      .filter((id) => {
        const etat = progression.etats[id]
        return etat !== undefined && estAcquise(etat)
      })
      .map((id) => artefact.entrees.find((entree) => entree.id === id))
      .filter((entree): entree is Artefact['entrees'][number] => entree !== undefined)

    return <Bilan acquises={acquises} onContinuer={() => setEcran('accueil')} />
  }

  const options = OPTIONS_PAR_AGE(profil.age)
  const aFaire = composerSession(artefact.entrees, progression, options, new Date()).length

  return (
    <Accueil
      profil={profil}
      serie={serie(progression, new Date())}
      aFaire={aFaire}
      onDemarrer={demarrer}
      onCollection={() => setEcran('collection')}
      onChangerProfil={() => setEcran('profil')}
    />
  )
}
```

- [x] **Step 2: Écrire les écrans**

`apps/enfant/src/app/ecrans/ChoixProfil.tsx` :

```tsx
'use client'

import { useState } from 'react'
import { AVATARS, type MagasinProgression, type Profil } from '@/stockage/magasin.js'

export function ChoixProfil({
  magasin,
  onChoisi,
}: {
  magasin: MagasinProgression
  onChoisi: (profil: Profil) => void
}) {
  const [profils, setProfils] = useState<Profil[]>(() => magasin.profils())
  const [creation, setCreation] = useState(profils.length === 0)
  const [prenom, setPrenom] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0]!)
  const [age, setAge] = useState(7)

  function creer() {
    const propre = prenom.trim()
    if (!propre) return
    const profil: Profil = {
      id: `${propre.toLowerCase().replace(/[^a-z0-9]/g, '')}-${age}`,
      prenom: propre,
      avatar,
      age,
    }
    magasin.ajouterProfil(profil)
    setProfils(magasin.profils())
    setCreation(false)
    setPrenom('')
  }

  if (creation) {
    return (
      <main style={{ display: 'grid', gap: 20, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
        <h1 style={{ fontSize: 28 }}>Qui joue ?</h1>
        <input
          value={prenom}
          onChange={(evenement) => setPrenom(evenement.target.value)}
          placeholder="Prénom"
          style={{ fontSize: 24, padding: 12, textAlign: 'center', borderRadius: 12, border: '2px solid #e6d9c6' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 420 }}>
          {AVATARS.map((choix) => (
            <button
              key={choix}
              type="button"
              onClick={() => setAvatar(choix)}
              style={{
                fontSize: 36, width: 64, height: 64, borderRadius: 16, background: '#fff',
                border: avatar === choix ? '3px solid #c94f3d' : '3px solid #e6d9c6',
              }}
            >
              {choix}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[5, 6, 7, 8, 9, 10, 11].map((valeur) => (
            <button
              key={valeur}
              type="button"
              onClick={() => setAge(valeur)}
              style={{
                fontSize: 20, width: 48, height: 48, borderRadius: 12, background: '#fff',
                border: age === valeur ? '3px solid #c94f3d' : '3px solid #e6d9c6',
              }}
            >
              {valeur}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={creer}
          style={{ fontSize: 22, padding: '14px 32px', borderRadius: 16, border: 'none', background: '#c94f3d', color: '#fff' }}
        >
          C’est parti
        </button>
      </main>
    )
  }

  return (
    <main style={{ display: 'grid', gap: 24, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
      <h1 style={{ fontSize: 28 }}>Qui joue ?</h1>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {profils.map((profil) => (
          <button
            key={profil.id}
            type="button"
            onClick={() => onChoisi(profil)}
            style={{
              display: 'grid', placeItems: 'center', gap: 4, width: 120, height: 140,
              borderRadius: 24, border: '3px solid #e6d9c6', background: '#fff',
            }}
          >
            <span style={{ fontSize: 56 }}>{profil.avatar}</span>
            <span style={{ fontSize: 18 }}>{profil.prenom}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCreation(true)}
          style={{ width: 120, height: 140, borderRadius: 24, border: '3px dashed #e6d9c6', background: 'none', fontSize: 48 }}
        >
          ＋
        </button>
      </div>
    </main>
  )
}
```

`apps/enfant/src/app/ecrans/Accueil.tsx` :

```tsx
'use client'

import type { Profil } from '@/stockage/magasin.js'

export function Accueil({
  profil, serie, aFaire, onDemarrer, onCollection, onChangerProfil,
}: {
  profil: Profil
  serie: number
  aFaire: number
  onDemarrer: () => void
  onCollection: () => void
  onChangerProfil: () => void
}) {
  return (
    <main style={{ display: 'grid', gap: 28, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', alignSelf: 'stretch', justifyContent: 'space-between' }}>
        <button type="button" onClick={onChangerProfil} style={{ background: 'none', border: 'none', fontSize: 32 }}>
          {profil.avatar}
        </button>
        {serie > 1 ? <span style={{ fontSize: 22 }}>🔥 {serie}</span> : <span />}
      </header>

      <button
        type="button"
        onClick={onDemarrer}
        disabled={aFaire === 0}
        style={{
          width: 260, height: 160, borderRadius: 32, border: 'none', fontSize: 26,
          background: aFaire === 0 ? '#e6d9c6' : '#c94f3d', color: '#fff', lineHeight: 1.3,
        }}
      >
        {aFaire === 0 ? <>Tout est fait !<br />🎉</> : <>Session du jour<br />▶</>}
      </button>

      <button
        type="button"
        onClick={onCollection}
        style={{ fontSize: 20, padding: '12px 28px', borderRadius: 16, border: '3px solid #e6d9c6', background: '#fff' }}
      >
        Ma collection
      </button>
    </main>
  )
}
```

`apps/enfant/src/app/ecrans/Collection.tsx` :

```tsx
'use client'

import type { Artefact } from '@awal/corpus'
import { estAcquise } from '@/moteur/leitner.js'
import type { Progression } from '@/moteur/types.js'
import { emoji } from '@/jeux/emoji.js'

export function Collection({
  artefact, progression, onRetour,
}: {
  artefact: Artefact
  progression: Progression
  onRetour: () => void
}) {
  return (
    <main style={{ padding: 16, minHeight: '100dvh' }}>
      <button
        type="button"
        onClick={onRetour}
        style={{ fontSize: 20, padding: '8px 16px', borderRadius: 12, border: '3px solid #e6d9c6', background: '#fff' }}
      >
        ←
      </button>

      {artefact.themes.map((theme) => {
        const duTheme = artefact.entrees.filter((entree) => entree.themes.includes(theme.id))
        const acquises = duTheme.filter((entree) => {
          const etat = progression.etats[entree.id]
          return etat !== undefined && estAcquise(etat)
        })

        return (
          <section key={theme.id} style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 20, color: theme.couleur }}>
              {theme.nom} — {acquises.length}/{duTheme.length}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {duTheme.map((entree) => {
                const etat = progression.etats[entree.id]
                const gagnee = etat !== undefined && estAcquise(etat)
                return (
                  <div
                    key={entree.id}
                    title={gagnee ? entree.kabyle : undefined}
                    style={{
                      width: 64, height: 64, borderRadius: 14, display: 'grid', placeItems: 'center',
                      fontSize: 32, background: gagnee ? '#fff' : '#eee3d2',
                      filter: gagnee ? 'none' : 'grayscale(1) opacity(0.35)',
                      border: `2px solid ${gagnee ? theme.couleur : '#e6d9c6'}`,
                    }}
                  >
                    {emoji(entree.picto)}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </main>
  )
}
```

`apps/enfant/src/app/ecrans/Bilan.tsx` :

```tsx
'use client'

import type { Entree } from '@awal/corpus'
import { emoji } from '@/jeux/emoji.js'

export function Bilan({ acquises, onContinuer }: { acquises: Entree[]; onContinuer: () => void }) {
  return (
    <main style={{ display: 'grid', gap: 28, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
      <p style={{ fontSize: 26 }}>
        {acquises.length > 0 ? `★ ${acquises.length} nouvelle${acquises.length > 1 ? 's' : ''} carte${acquises.length > 1 ? 's' : ''}` : 'Bien joué !'}
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        {acquises.slice(0, 5).map((entree) => (
          <span key={entree.id} style={{ fontSize: 56 }}>{emoji(entree.picto)}</span>
        ))}
      </div>
      <p style={{ fontSize: 22, opacity: 0.7 }}>Ar toufath !</p>
      <button
        type="button"
        onClick={onContinuer}
        style={{ fontSize: 22, padding: '14px 40px', borderRadius: 16, border: 'none', background: '#c94f3d', color: '#fff' }}
      >
        OK
      </button>
    </main>
  )
}
```

`apps/enfant/src/app/page.tsx` :

```tsx
'use client'

import dynamique from 'next/dynamic'

// L'application entière dépend de localStorage et de l'audio : la rendre
// côté serveur n'apporterait rien et provoquerait un décalage d'hydratation.
const Application = dynamique(
  () => import('./Application.js').then((module) => module.Application),
  { ssr: false },
)

export default function Page() {
  return <Application />
}
```

- [x] **Step 3: Vérifier**

```bash
pnpm --filter enfant typecheck && pnpm --filter enfant build
```

Attendu : typecheck propre, export statique produit dans `out/`.

- [x] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(enfant): écrans profil, accueil, collection et bilan"
```

---

### Task 8: Audio de remplacement et vérification de bout en bout

**Files:**
- Create: `outils/audio-de-remplacement.sh`
- Create: `README.md`

**Interfaces:**
- Produces: un corpus jouable de bout en bout sans que le père ait enregistré quoi que ce soit

Les audios sont produits par la synthèse vocale française du système. La prononciation est fausse — c'est assumé et signalé : ils servent à vérifier que la mécanique fonctionne, et disparaissent dès le premier vrai enregistrement.

- [x] **Step 1: Écrire le script**

`outils/audio-de-remplacement.sh` :

```bash
#!/usr/bin/env bash
# Génère des audios de remplacement pour toutes les entrées sans enregistrement.
#
# ATTENTION : la prononciation est celle d'une voix française lisant une
# transcription kabyle. Elle est fausse. Ces fichiers servent uniquement à
# vérifier que la mécanique du jeu fonctionne avant le premier enregistrement.
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
SORTIE="$RACINE/apps/studio/medias/audio"
mkdir -p "$SORTIE"

cd "$RACINE/apps/studio"
set -a && . ./.env.local && set +a

docker exec awal-postgres psql -U awal -d awal -t -A -F'|' \
  -c "select id, kabyle from entrees where audio is null" |
while IFS='|' read -r id kabyle; do
  [ -z "$id" ] && continue
  say -v Thomas -r 130 -o "$SORTIE/$id.aiff" "$kabyle"
  ffmpeg -loglevel error -y -i "$SORTIE/$id.aiff" -c:a libopus -b:a 32k "$SORTIE/$id.webm"
  rm "$SORTIE/$id.aiff"
  docker exec awal-postgres psql -U awal -d awal -q \
    -c "update entrees set audio = 'audio/$id.webm' where id = '$id'"
  printf '.'
done
echo
echo "Audios de remplacement générés dans $SORTIE"
```

- [x] **Step 2: Exécuter et publier**

```bash
chmod +x outils/audio-de-remplacement.sh
./outils/audio-de-remplacement.sh
```

Puis publier depuis le studio et vérifier que `apps/studio/medias/corpus/actuel.json` existe et contient 213 entrées.

- [x] **Step 3: Relier l'app enfant au corpus publié**

Copier le corpus et les audios publiés dans `apps/enfant/public/` pour le développement, ou pointer `NEXT_PUBLIC_URL_CORPUS` vers le studio.

- [x] **Step 4: Vérifier dans un navigateur**

Créer un profil, lancer une session, répondre, constater que la collection se remplit et que la progression survit à un rechargement.

- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: audio de remplacement et vérification de bout en bout"
```

---

## Ce que ce plan ne fait pas

- **Écho, Intrus, Mot mystère, Duel, Chasse au trésor** : lots 2 et 3.
- **Couche narrative** : lot 4.
- **Icônes PNG de la PWA** : à produire ; en leur absence, l'installation fonctionne mais l'icône est générique.
