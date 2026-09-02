# Awal — apprendre le kabyle en jouant

Une application familiale pour transmettre le kabyle à des enfants de 5 à 11 ans,
appuyée sur des enregistrements faits par un locuteur natif de la famille.

L'objectif n'est pas le nombre de mots retenus, mais que les enfants **n'aient
plus peur de parler**.

## Ce qu'il reste à faire

**Enregistrer les 213 entrées avec ta voix.** C'est la seule partie qui ne peut
pas être automatisée, et c'est celle qui compte. Compter une à deux heures,
découpables en séances par thème.

En attendant, un corpus d'**audios de remplacement** produits par la synthèse
vocale française du système permet de tout essayer. **Leur prononciation est
fausse** : ils servent uniquement à vérifier que la mécanique fonctionne, et
disparaissent au premier vrai enregistrement (`--purger`, voir plus bas).

## Structure

| Dossier | Rôle |
|---|---|
| `packages/corpus` | contrat partagé : schémas, validation, format de l'artefact |
| `apps/studio` | back-office privé : saisie, enregistrement, publication |
| `apps/enfant` | la PWA installable que les enfants utilisent |
| `docs/corpus-v1.md` | la liste de vocabulaire, source éditoriale |
| `docs/superpowers/` | le spec et les trois plans d'implémentation |

Le studio et l'app enfant ne se parlent que par un fichier : l'**artefact de
corpus** publié. Aucune requête de l'app enfant ne touche la base de données —
c'est ce qui la rend instantanée, hors-ligne et increvable.

## Démarrer

```bash
pnpm install

# Base de données locale
cd apps/studio
cp .env.example .env.local          # puis renseigner STUDIO_MOT_DE_PASSE
docker compose up -d
pnpm db:appliquer                   # crée les tables
pnpm db:seed                        # insère les 213 entrées

# Audios de remplacement, pour tout essayer sans avoir enregistré
pnpm tsx seed/audio-remplacement.ts

# Publier et alimenter l'app enfant
cd ../.. && ./outils/synchroniser-enfant.sh
```

Puis, dans deux terminaux :

```bash
pnpm --filter studio dev     # http://localhost:3001
pnpm --filter enfant dev     # http://localhost:3002
```

## Variables d'environnement

Tout est dans `apps/studio/.env.example`, commenté ligne par ligne.
L'app enfant n'en a qu'une, et elle est facultative.

### `apps/studio/.env.local`

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Postgres. En local, celui du `docker compose`. En production, la chaîne fournie par Neon ou Supabase. |
| `STUDIO_MOT_DE_PASSE` | mot de passe unique d'accès au studio. Il n'y a pas d'autre utilisateur. |
| `SESSION_SECRET` | clé de signature du cookie. Générer avec `openssl rand -base64 32`. |
| `STOCKAGE` | `disque` en développement, `r2` en production. |
| `STOCKAGE_DISQUE_RACINE` | où écrire les médias en local. Défaut `./medias`. |
| `STOCKAGE_DISQUE_URL_PUBLIQUE` | base d'URL inscrite dans l'artefact. `/` convient en local. |
| `R2_ACCOUNT_ID` | Cloudflare → R2 → identifiant du compte. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 → *Manage API tokens*. |
| `R2_BUCKET` | nom du bucket, par exemple `awal-medias`. |
| `R2_URL_PUBLIQUE` | URL publique du bucket, **barre finale comprise**. C'est par elle que l'app enfant chargera les audios. |

### `apps/enfant/.env.local` (facultatif)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_URL_CORPUS` | où lire l'artefact. Défaut `/corpus/actuel.json`, c'est-à-dire le fichier copié dans `public/`. En production, l'URL R2 du corpus. |

## Commandes

```bash
pnpm test                                   # toute la suite
pnpm typecheck                              # tous les paquets
pnpm --filter enfant build                  # export statique dans apps/enfant/out

cd apps/studio
pnpm tsx seed/publier.ts                    # publier une nouvelle version du corpus
pnpm tsx seed/audio-remplacement.ts --purger  # effacer les audios synthétiques
```

## Passer en production

1. Créer une base Postgres (Neon ou Supabase) et un bucket R2.
2. Renseigner les variables R2 et `DATABASE_URL`, passer `STOCKAGE=r2`.
3. `pnpm db:appliquer && pnpm db:seed` sur la base distante.
4. Déployer le studio (Vercel) et publier depuis son interface.
5. Déployer `apps/enfant/out` en statique, avec `NEXT_PUBLIC_URL_CORPUS` pointant sur R2.

Le studio peut rester sur ta machine si tu préfères : seul l'artefact publié
doit être accessible aux enfants.

## Les deux modes de jeu

**La session du jour** est la seule porte d'entrée du vocabulaire nouveau, et
elle est plafonnée : 5 mots avant 8 ans, 8 après. C'est ce plafond qui empêche
un enfant enthousiaste de se retrouver deux semaines plus tard face à quarante
minutes de révisions.

**Les phrases attendent leur vocabulaire.** Une phrase n'est proposée que
lorsque tous les mots qu'elle emploie sont connus — entendre `etch aghroum`
sans reconnaître ni `etch` ni `aghroum` n'apprend rien. Une fois débloquées,
elles passent en priorité sur les mots nouveaux, plafonnées à deux par session :
elles consolident deux mots connus tout en apportant la syntaxe.

**L'entraînement** rejoue librement, autant qu'on veut, ce qui a déjà été
rencontré — par thème ou en vrac. Il **n'écrit rien** dans la progression :
faire monter les boîtes en rejouant cinq fois le même mot le classerait
« acquis » sans aucune mémorisation réelle, et détruirait la répétition espacée.

## Ce qui n'est pas encore fait

Lot 2 — Écho, L'intrus, Duel. Lot 3 — Mot mystère, Chasse au trésor.
Lot 4 — la couche narrative, et avec elle le vocabulaire patrimonial
(`lkanoun`, `thala`, `thajma3th`) que l'imagier ne pouvait pas porter.
