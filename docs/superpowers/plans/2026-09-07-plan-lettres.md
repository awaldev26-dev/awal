# Les lettres — plan d'implémentation

> Spec : `docs/superpowers/specs/2026-09-07-lettres-design.md`

**But.** Une application autonome où une enfant de trois ans découvre les 26
majuscules françaises, prononcées par la synthèse vocale du navigateur.

**Architecture.** Troisième app du monorepo, `apps/lettres`. Next 16 en export
statique, React 19, Tailwind 4 avec jetons `@theme`. Aucune dépendance aux
paquets partagés, aucune variable d'environnement, aucune persistance.

**Plan volontairement court.** L'app tient en une dizaine de fichiers et n'a ni
serveur, ni stockage, ni contenu distant. Détailler chaque ligne à l'avance
coûterait plus que de l'écrire.

## Contraintes globales

- Next **16.3.4**, React **19**, Tailwind **4.3.3** — mêmes versions que les
  autres apps.
- `output: 'export'`, `outputFileTracingRoot` sur la racine du dépôt.
- Port de développement **3003** (3001 studio, 3002 enfant).
- `build` passe par `outils/port-libre.mjs`, qui refuse de construire si le
  serveur de développement écoute — sans quoi le cache de compilation se
  corrompt et la page perd ses styles sans erreur explicite.
- Code de domaine nommé en français, comme partout dans ce dépôt.
- Style du dépôt : guillemets simples, pas de point-virgule, ~100 colonnes. Ne
  **pas** lancer `prettier` sans configuration explicite, il imposerait ses
  défauts.
- Aucun texte lisible destiné à l'enfant. Le seul texte s'adresse au parent.

---

## Tâche 1 — Squelette de l'application

**Fichiers :** `apps/lettres/{package.json,next.config.ts,tsconfig.json,postcss.config.mjs,vitest.config.ts}`,
`src/app/{layout.tsx,globals.css,page.tsx}`

- [ ] Copier les configurations de `apps/enfant`, en retirant
      `transpilePackages` et les dépendances `@awal/*` : cette app ne partage
      rien.
- [ ] Jetons `@theme` propres : palette franche et gaie, tailles tactiles très
      grandes, halos diffus plutôt qu'ombres portées. Les jetons sont
      **role-nommés** (`--color-fond`, `--color-accent`), jamais nommés par
      leur teinte : c'est ce qui permet de changer une couleur à un seul
      endroit.
- [ ] Accueil : deux touches, sans texte pour l'enfant — un pictogramme et un
      mot court chacune.
- [ ] Vérifier : `pnpm dev` sur 3003 affiche l'accueil, `pnpm typecheck` propre.

## Tâche 2 — La table des lettres

**Fichiers :** `src/alphabet.ts`, `test/alphabet.test.ts`

- [ ] `interface Lettre { glyphe: string; dit: string }` et le tableau des 26,
      d'après la table de la spec.
- [ ] Tests : 26 entrées, glyphes uniques, `dit` jamais vide, glyphes conformes
      à `A`–`Z` dans l'ordre.
- [ ] Vérifier que les tests mordent : casser une entrée doit les faire tomber.

## Tâche 3 — Le module de parole

**Fichiers :** `src/parole.ts`

C'est la seule pièce délicate. Quatre pièges, chacun traité :

- [ ] **Voix vides au premier appel** — attendre `voiceschanged`, avec un délai
      de garde pour ne pas attendre indéfiniment sur un moteur qui n'émet
      jamais l'événement.
- [ ] **Choix de la voix** — préférer `fr-FR`, puis une voix locale
      (`localService`) pour éviter la latence réseau.
- [ ] **Martèlement** — `cancel()` avant chaque `speak()`, pour que la dernière
      lettre touchée soit celle qu'on entend.
- [ ] **Débit** — légèrement ralenti.
- [ ] Exposer `disponible()`, pour que l'interface puisse prévenir le parent.
- [ ] Vérifier dans un navigateur : **écouter les 26 prononciations** et
      corriger la table de la tâche 2. Les entrées `E`, `Q`, `X`, `I`, `O`, `U`
      sont signalées douteuses par la spec.

## Tâche 4 — Écran Explorer

**Fichiers :** `src/app/explorer/page.tsx`, `src/app/ecrans/Explorer.tsx`,
`src/interface/{Lettre,Touche}.tsx`

- [ ] Grille des 26 majuscules, aussi grandes que l'écran le permet, sans
      débordement horizontal à 390 px.
- [ ] Toucher une lettre la prononce et la fait réagir brièvement.
- [ ] Aucun état d'échec possible.
- [ ] Vérifier dans un navigateur, à 390 px et sur écran large.

## Tâche 5 — Écran Trouve la lettre

**Fichiers :** `src/choix.ts`, `test/choix.test.ts`,
`src/app/trouver/page.tsx`, `src/app/ecrans/Trouver.tsx`,
`src/interface/Fete.tsx`

- [ ] `tirerChoix(alphabet, nombre)` → une cible et `nombre` propositions
      distinctes dont la cible.
- [ ] Tests : la cible est toujours parmi les propositions ; les propositions
      sont distinctes ; fonctionne pour n'importe quelle cible ; un `nombre`
      supérieur à la taille de l'alphabet ne boucle pas indéfiniment.
- [ ] Écran : trois propositions, un gros bouton pour rejouer le son.
- [ ] Erreur : la tuile décline doucement, le son se rejoue, **aucun buzzer**.
- [ ] Réussite : fête, puis question suivante. Pas de score, pas de fin.
- [ ] Vérifier dans un navigateur : réussite, erreur, et martèlement.

## Tâche 6 — PWA et mise en ligne

**Fichiers :** `public/{sw.js,manifest.webmanifest,icone-192.png,icone-512.png}`,
`src/app/layout.tsx`

- [ ] Service worker calqué sur celui de l'app enfant : préchargement des
      routes et découverte des fichiers compilés en lisant le HTML. Aucun média
      distant à mettre en cache — la voix est synthétisée sur l'appareil.
- [ ] Manifeste et icônes.
- [ ] Vérifier : `pnpm build` produit `explorer.html` et `trouver.html`, puis
      **couper le réseau** et recharger chaque route. C'est le seul test qui
      vaut ; les précédents préchargements de ce dépôt ont tous échoué en
      silence.

---

## Vérification finale

- `pnpm typecheck` et `pnpm test` propres à la racine.
- Aucun débordement horizontal à 390 px sur les trois écrans.
- Les 26 lettres écoutées une par une.
- Les deux écrans utilisables hors ligne.
- Le repli sans voix française, en neutralisant `speechSynthesis`.
