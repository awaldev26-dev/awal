# Awal — Apprendre le kabyle en jouant

**Date** : 2026-09-01
**Statut** : design validé, prêt pour la planification

---

## 1. Objectif

Transmettre le kabyle à deux enfants de 5-7 et 8-11 ans, par un rituel quotidien court et
jouable, appuyé sur des enregistrements faits par leur père — locuteur natif.

Le critère de réussite n'est pas le nombre de mots retenus. C'est que les enfants **n'aient
plus peur de parler**. Le vocabulaire patrimonial et la maîtrise fine viendront ensuite, et
viendront seuls.

Une application ne remplace pas la transmission familiale. Elle fournit le support de
répétition qui manque quand le parent n'a pas deux heures par jour, et sert de prétexte à des
moments partagés.

## 2. Utilisateurs

| Profil | Rôle |
|---|---|
| Enfant 5-7 ans | lecteur débutant en français, sessions courtes, tout passe par l'image et l'audio |
| Enfant 8-11 ans | lecteur autonome, accède à l'écrit et aux phrases |
| Le père | locuteur natif, producteur du contenu, unique utilisateur du studio |

## 3. Décisions structurantes

Chaque décision est accompagnée de sa justification, pour qu'on puisse la reconsidérer plus
tard en sachant ce qu'elle protégeait.

**Graphie : transcription usuelle seule** (`aghroum`, `thaddarth`), convention diaspora avec
`gh` = ɣ, `kh` = x, `ou` = u, `th` = t spirant, `dh` = d/ḍ, `3` = ɛ, `h` = ḥ.
La graphie standard (`aɣrum`) est **stockée en base mais jamais affichée** — un champ optionnel,
dormant, activable plus tard sans migration.

**Langue enseignée : le kabyle réellement parlé.** Critère d'inclusion du corpus : *si ta mère
ne le dirait pas, ça n'entre pas.* Les emprunts arabes sont assumés partout où ils dominent
l'usage (`tlata`, `lbatata`, `lebhar`, `hseb`). Le néo-berbère de standardisation est exclu.
Les nombres berbères reconstruits sont supprimés, pas reportés.

**Images : pictos libres uniquement** (OpenMoji). Conséquence assumée : le vocabulaire
culturellement spécifique — `lkanoun`, `thala`, `thajma3th`, `thasirth`, `ikoufan` — est
reporté à la phase narrative, où un conte lui donnera le contexte qu'un imagier ne peut pas
fournir. L'image est une référence en base, donc remplaçable une par une par une photo, sans
toucher au code.

**Audio : la voix du père**, sa variante dialectale, pour l'intégralité du corpus.

**Verbes à l'impératif** (`etch`, `eqqim`, `as-ed`) : la forme qu'un enfant entend réellement
cinquante fois par jour, et la plus courte à jouer.

**Pas de reconnaissance vocale.** Il n'en existe pas de fiable pour le kabyle, et une note
fausse sur la prononciation d'un enfant est le meilleur moyen de le faire taire.

## 4. Architecture

### 4.1 Deux applications, une frontière nette

**Le studio** (usage privé, père uniquement) : Next.js, authentification simple, Postgres
comme source de vérité éditable du corpus. Saisie d'une entrée, **enregistrement audio
directement dans le navigateur** via MediaRecorder, envoi sur Cloudflare R2. Un bouton
« publier » valide le corpus et génère un artefact versionné.

**L'app enfant** : Next.js en export statique, PWA installable, service worker. Elle télécharge
l'artefact de corpus publié, le met en cache, et **n'appelle plus rien ensuite**.

Cette séparation est le choix central du design. Elle donne le confort d'un vrai back-office
sans placer la moindre dépendance réseau entre l'enfant et le jeu :

- aucune latence — l'audio est local, une session ne peut pas être ralentie par le réseau ;
- aucune mise en veille de base de données gratuite ne peut casser le jeu, ce qui est un
  risque réel avec un usage de dix minutes par jour ;
- aucune authentification côté enfant ;
- fonctionnement hors ligne par construction, pas par rattrapage.

### 4.2 Trois couches dans l'app enfant

| Couche | Contenu | Qui la modifie |
|---|---|---|
| Corpus | mots, phrases, audio, pictos, thèmes | le père, via le studio, sans toucher au code |
| Moteur | tirage, mémorisation, composition de session | figé, testé unitairement |
| Activités | les jeux, l'affichage | ajouter un jeu = ajouter un fichier |

Deux invariants qui servent de test à l'architecture :

1. **Ajouter 20 mots ne demande aucune modification de code.**
2. **Ajouter un jeu ne demande aucune modification du corpus ni du moteur.**

Si l'un des deux devient faux, une frontière a fui.

### 4.3 Progression

Stockée **localement** (IndexedDB), derrière une interface `ProgressStore`. Conséquence
assumée : effacer les données du navigateur efface la progression, pas le corpus.

Le jour où un second appareil entre en jeu, on écrit une seconde implémentation de
`ProgressStore` et on ajoute l'authentification à ce moment-là — quand elle sert enfin à
quelque chose. La synchronisation hors-ligne est la partie la plus difficile du projet ; on ne
la paie pas tant qu'on n'en a pas besoin.

## 5. Modèle de données

### Entrée

| Champ | Rôle | Exemple |
|---|---|---|
| `id` | slug stable, jamais renommé | `aghroum` |
| `type` | `mot` ou `phrase` | |
| `kabyle` | forme usuelle, la seule affichée | `aghroum` |
| `kabyle_std` | graphie standard, optionnelle, dormante | `aɣrum` |
| `fr` | traduction | `le pain` |
| `audio` | clé R2 | |
| `variante` | variante dialectale de l'enregistrement | |
| `picto` | référence dans le pack | |
| `themes` | une ou plusieurs collections | `[nourriture]` |
| `niveau` | 1 à 3, filtre selon le profil | |
| `pluriel` | optionnel, pour les 8-11 ans | `ighroumen` |
| `contient` | pour les phrases : ids des mots utilisés | |
| `notes` | champ libre : lieu, personnage, contexte | |

Trois champs demandent justification :

- **`kabyle_std` est optionnel.** Obligatoire, il deviendrait une corvée bloquant chaque
  saisie — et la conversion `gh` → ɣ n'est pas automatisable de façon fiable, `gh` pouvant
  être un `g` suivi d'un `h`.
- **`contient`** est la charnière vers la phase narrative : il permettra à une scène de
  réclamer son vocabulaire, et dès maintenant de ne proposer une phrase que si l'enfant
  connaît déjà les mots qui la composent.
- **`variante`** ne sert à rien aujourd'hui. Sans lui, ouvrir l'app à d'autres variantes
  dialectales imposerait une migration de tout le corpus. Il coûte une colonne.

- **`niveau`** est saisi dans le studio, à 1 par défaut. Il filtre les **entrées** proposées à un
  profil, jamais les thèmes : un enfant de 6 ans voit tous les thèmes, mais n'y rencontre que
  les entrées de niveau 1. Le corpus v1 ne porte pas encore de niveaux ; ils seront attribués
  au fil de la saisie, ce qui est aussi l'occasion de repérer les entrées trop difficiles.

### Thème

Un nom, un picto, une couleur. Les thèmes sont les collections visibles par l'enfant.

### Validation

Le validateur s'exécute **dans le studio au moment de la saisie**, pas seulement au build.
Il refuse : audio manquant ou silencieux, picto inexistant, traduction vide, `id` dupliqué,
phrase référençant un mot absent.

Publier un mot muet est le bug qui détruit la confiance d'un enfant dans le jeu. Il doit être
impossible.

### Corpus de départ

213 entrées, 11 thèmes, documentées dans `docs/corpus-v1.md`. Environ une à deux heures
d'enregistrement, découpables en séances par thème.

| Thème | Entrées | | Thème | Entrées |
|---|---|---|---|---|
| Les verbes | 54 | | Le corps | 18 |
| Dehors et le temps | 26 | | Les nombres | 10 |
| Manger et boire | 23 | | La maison | 10 |
| Politesse et mots-outils | 21 | | Les vêtements | 7 |
| Les animaux | 20 | | Les couleurs | 5 |
| La famille | 19 | | | |

## 6. Activités

**Contrat commun** : une activité reçoit un lot d'entrées et renvoie, pour chaque entrée, un
`réussi` / `raté`. Le moteur ignore totalement quelle activité a produit le résultat. C'est ce
contrat qui rend le moteur unique et l'ajout d'un jeu sans effet de bord.

| Activité | Mode | Âge | Travaille |
|---|---|---|---|
| Écoute et choisis | solo | 5-11 | compréhension orale |
| ~~Memory audio~~ | — | — | **retiré, voir ci-dessous** |
| L'intrus | solo | 6-11 | catégorisation |
| Écho | solo | 5-11 | production orale |
| Mot mystère | solo | 8-11 | écrit |
| Duel | duo | 5-11 | vitesse, rejouabilité |
| Chasse au trésor | duo | 5-11 | ancrage physique |

**Le Memory audio a été retiré** après l'avoir vu tourner, et son code supprimé.
Trois défauts que la conception n'avait pas anticipés :

1. **L'écran de départ ne dit rien** — douze rectangles vides, rien n'indique
   qu'on peut les toucher ni ce qu'on cherche.
2. **Il exige de mémoriser des sons, pas des images.** Un memory classique
   s'appuie sur la mémoire visuelle, très efficace chez l'enfant ; retenir
   « le troisième haut-parleur, c'était *aghroum* » est bien plus difficile.
   Six paires, c'est trop.
3. **Toutes les cartes « son » se ressemblent** — le même 🔊 — donc impossible
   de s'y repérer sans réécouter.

Une démonstration animée l'aurait rendu compréhensible, pas bon. La session du
jour n'utilise donc qu'Écoute-et-choisis, qui ne demande aucune explication :
on entend un mot, on touche l'image.

**L'imagier** (« Écouter les mots ») remplace le mode entraînement initialement
prévu comme second exercice. Les 243 cartes visibles par thème, image et
traduction, un tap pour entendre la prononciation. Ni score, ni progression, ni
échec possible : c'est un dictionnaire visuel, consultable à tout moment, et il
n'écrit rien — faire monter les boîtes en rejouant détruirait l'espacement.

**L'Écho ne note rien.** L'enfant s'enregistre, réécoute la voix du père puis la sienne. Pas
de score, pas d'évaluation. C'est la pratique des orthophonistes, et la seule honnête en
l'absence de reconnaissance vocale fiable.

**Le Duel applique un handicap automatique** selon l'âge des profils : délai plus court pour
l'aîné. Sans lui, le cadet perd systématiquement et cesse de jouer après trois parties.

**La Chasse au trésor** valide par un tap « trouvé ! » et un chronomètre. Pas de caméra : la
permission photo et la reconnaissance d'objet coûteraient beaucoup pour zéro valeur
pédagogique.

## 7. Progression et rituel

**Leitner à cinq boîtes** : délais de 1, 2, 4, 7 et 14 jours. Réussie, l'entrée monte d'une
boîte ; ratée, elle retombe en boîte 1. L'algorithme le plus simple qui fonctionne, et surtout
le seul dont on peut toujours expliquer le comportement.

**L'enfant ne voit jamais le moteur.** Ni pourcentage, ni statistique, ni courbe. Il voit **sa
collection** : une carte par mot, grise tant qu'elle n'est pas acquise, en couleur dès la boîte 4.

**La session du jour** est composée automatiquement : environ deux tiers de révisions dues,
un tiers de mots nouveaux, pour 5 à 8 minutes.

**Le plafond de mots nouveaux par jour** — 5 pour un profil 5-7 ans, 8 pour un 8-11 — est le
réglage le plus important du système. Sans lui, un enfant enthousiaste absorbe 40 mots un
dimanche et se retrouve deux semaines plus tard face à une session de 40 minutes, qu'il
abandonne sans que personne comprenne pourquoi. Le plafond le protège de son propre
enthousiasme.

**La série tolère un jour manqué.** Deux jours la remettent à zéro. Perdre trente jours pour
une soirée chez les grands-parents est une punition absurde.

**Aucun thème n'est verrouillé.** Choisir « les animaux » soi-même motive davantage que
déverrouiller un thème imposé, et le plafond régule déjà le rythme.

## 8. Interface

Cinq écrans : choix du profil, accueil, jeu, collection, bilan.

**Les profils** se choisissent par avatar, sans mot de passe. Un profil porte un prénom, un
avatar et un âge — et l'âge pilote tout : niveau de vocabulaire, plafond de nouveautés,
activités disponibles, handicap en duel.

Six règles, toutes dictées par l'âge des utilisateurs :

1. **Aucune consigne à lire.** La règle est donnée en audio et par une démonstration animée.
   Un enfant de 5 ans qui déchiffre une consigne en français a épuisé son attention avant
   d'entendre le premier mot kabyle.
2. **L'erreur ne punit jamais.** Pas de rouge, pas de son d'échec. On rejoue l'audio, on retire
   une mauvaise réponse, on laisse réessayer. Le mot retombe en boîte 1, silencieusement.
3. **L'audio est préchargé.** 300 ms de délai entre le tap et le son suffisent à rendre le jeu
   poussif. Le corpus du jour est mis en cache avant le démarrage de la session.
4. **Un seul niveau de navigation.** Un bouton ramène toujours à l'accueil.
5. **Cibles tactiles surdimensionnées**, orientation paysage sur tablette, **déverrouillage de
   l'audio iOS au premier tap** — sans quoi Safari refuse tout son, piège classique des PWA.
6. **Aucun compteur visible**, sauf le chronomètre du duel qui fait partie du jeu.

## 9. Tests

| Quoi | Comment | Pourquoi |
|---|---|---|
| Moteur Leitner | unitaires, temps simulé | la logique de dates est le nid à bugs |
| Composition de session | unitaires | vérifier que le plafond tient après une longue absence |
| Validateur de corpus | unitaires | il empêche de publier un mot muet |
| Activités | un test par contrat entrée → résultat | garantit qu'un nouveau jeu n'a pas d'effet de bord |
| Parcours complet | un seul test bout en bout | lancer une session, la finir, voir la collection se remplir |

**Le test décisif** : simuler soixante jours d'usage et vérifier que la charge de révision
quotidienne ne dépasse jamais la durée cible. C'est le mode de défaillance qui tue les
applications de langue, et il est invisible en test manuel — on ne le découvre qu'après six
semaines, quand l'enfant a déjà décroché.

Pas de tests d'interface automatisés. À ce stade, un enfant devant la tablette est un meilleur
test.

## 10. Phasage

| Lot | Contenu |
|---|---|
| **1** | Studio, corpus, moteur Leitner, Écoute et choisis, Memory, rituel, collection |
| **2** | Écho, L'intrus, Duel |
| **3** | Mot mystère, Chasse au trésor |
| **4** | Couche narrative |

Le lot 1 est une application complète et jouable. Sept activités livrées d'un coup seraient le
plus sûr moyen de ne jamais finir.

## 11. Hors périmètre

Comptes utilisateurs, synchronisation entre appareils, classements, notifications,
reconnaissance vocale, tableau de bord pour le parent, publication sur les stores,
contribution communautaire.

Aucun de ces éléments n'est exclu définitivement — mais aucun ne sera ajouté avant qu'un
besoin réel se manifeste.

## 12. Risques

**Le contenu, pas le code.** Écrire les mini-jeux prend quelques week-ends ; enregistrer 213
entrées est le vrai travail. C'est pourquoi le studio fait partie du lot 1 : il transforme la
production de contenu en un flux fluide — une vingtaine de mots enregistrés et publiés en un
quart d'heure — au lieu d'une manipulation de fichiers qui décourage.

**La fiabilité lexicale.** Le corpus a été ébauché par un modèle de langue sur une langue peu
dotée en ressources écrites. Il comporte des erreurs. Onze entrées sont marquées comme
incertaines, mais l'absence de marque ne garantit rien. La relecture par le locuteur natif
n'est pas une étape de confort : c'est une dépendance du lot 1.

**L'abandon.** Le risque majeur de tout projet parental. Traité par le phasage — le lot 1 est
utilisable seul — et par le plafond de mots nouveaux, qui protège l'engagement des enfants
dans la durée.
