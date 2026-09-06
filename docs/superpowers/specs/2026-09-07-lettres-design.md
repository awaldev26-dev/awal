# Les lettres — conception

**Objectif.** Faire découvrir les 26 lettres de l'alphabet français à une enfant
de trois ans, en autonomie, sur une tablette.

Application distincte d'Awal, dans le même dépôt. Awal enseigne le kabyle à des
enfants de cinq à onze ans avec la voix de leur père ; celle-ci enseigne le
français à une enfant de trois ans avec la voix du navigateur. Presque rien
n'est commun.

---

## Le public commande tout

Trois ans, ce n'est pas « plus jeune » : c'est un autre cahier des charges.

- **Elle ne lit pas.** Aucune consigne écrite, nulle part. Tout passe par
  l'image et le son. Le seul texte de l'application s'adresse au parent.
- **Elle ne trace pas.** Suivre une lettre au doigt dépasse sa motricité fine.
  Toucher, oui.
- **Son attention tient quelques minutes.** Il n'y a donc rien à terminer :
  pas de session, pas de fin, pas de « reviens demain ».
- **Elle va marteler l'écran.** Aucun état d'échec ne doit exister. Pas de
  score, pas de chronomètre, pas de série, aucun son de sanction.

**Rien du moteur d'Awal ne s'applique.** L'espacement Leitner suppose qu'on
révise ce qu'on oublie, avec un enfant qui accepte d'être interrogé. À trois
ans, ni l'un ni l'autre. Le moteur, les profils, la collection et l'artefact
publié restent hors de cette application.

---

## Décisions prises

| Sujet | Décision | Raison |
|---|---|---|
| Nom ou son | **Le nom** : « bé », « cé », « dé » | Ce que dit la famille, et ce que fait la maternelle en petite section |
| Casse | **Majuscules seules** | Formes simples et distinctes ; c'est ce qu'utilisent la maternelle et les cubes en bois |
| Activités | **Explorer** et **Trouve la lettre** | Les seules jouables à trois ans |
| Persistance | **Aucune** | Rien à espacer, donc rien à stocker — et autant de code qui ne peut pas casser |
| Nom de l'app | **Les lettres** | Descriptif, dans l'esprit d'« Écouter les mots » |

---

## Architecture

Troisième application du monorepo : `apps/lettres`. Next 16, export statique,
React 19, Tailwind 4 avec jetons `@theme`, comme les deux autres.

**Elle ne partage aucun code avec l'app enfant, et c'est voulu.** Une interface
pour une enfant de trois ans doit être plus grande et plus dépouillée que celle
d'un enfant de huit ans ; partager les jetons de style les ferait converger là
où elles doivent diverger. Si une duplication réelle apparaît plus tard,
extraire un paquet d'interface sera le geste naturel — le faire maintenant
serait spéculatif.

**Aucune variable d'environnement.** Ni R2, ni corpus, ni mot de passe, ni base
de données. Des fichiers statiques et rien d'autre. C'est la conséquence
heureuse d'un contenu de 26 entrées et d'une voix fournie par le navigateur.

```
apps/lettres/
  src/
    alphabet.ts          les 26 lettres et leur prononciation
    parole.ts            enveloppe de la synthèse vocale
    choix.ts             tirage des propositions de « Trouve la lettre »
    app/
      globals.css        jetons propres à cette application
      layout.tsx
      page.tsx           accueil : deux grosses touches
      explorer/page.tsx
      trouver/page.tsx
      ecrans/            Accueil, Explorer, Trouver
    interface/           Lettre, Touche, Fete
  test/                  alphabet, choix
  public/                icônes, manifeste, service worker
```

---

## Le contenu

```ts
export interface Lettre {
  /** La majuscule affichée. */
  glyphe: string
  /** Orthographe donnée à la synthèse — jamais le glyphe. */
  dit: string
}
```

**On ne donne jamais le glyphe à la synthèse.** Selon le moteur, « Y » se dit
« y » au lieu de « i grec », « W » varie, et une lettre seule peut être lue
comme un mot. L'orthographe du nom est déterministe.

| Lettre | `dit` | Lettre | `dit` |
|---|---|---|---|
| A | `a` | N | `enne` |
| B | `bé` | O | `o` |
| C | `cé` | P | `pé` |
| D | `dé` | Q | `ku` |
| E | `e` | R | `erre` |
| F | `effe` | S | `esse` |
| G | `gé` | T | `té` |
| H | `hache` | U | `u` |
| I | `i` | V | `vé` |
| J | `ji` | W | `double vé` |
| K | `ka` | X | `ixe` |
| L | `elle` | Y | `i grec` |
| M | `emme` | Z | `zède` |

**Ce tableau est une hypothèse, pas un résultat.** Cinq entrées sont douteuses
et devront être écoutées puis corrigées :

- **`E` → `e`** : la lettre se dit /ə/. Un moteur peut ne rien prononcer d'un
  « e » isolé.
- **`Q` → `ku`** : visé /ky/, puisque « u » se dit /y/ en français. « qu »
  donnerait /k/, ce qui serait le son et non le nom.
- **`X` → `ixe`** : « iks » est l'autre candidat.
- **`A`, `I`, `O`, `U`** : lettres isolées que le moteur peut traiter comme des
  mots. Pour « a » le risque est nul, le verbe et la lettre se disant tous deux
  /a/ ; les trois autres sont à confirmer.

La vérification consiste à faire prononcer les 26 entrées dans un vrai
navigateur et à écouter. **Aucun raisonnement ne remplace cette écoute.**

---

## Le module de parole

La seule pièce délicate de l'application. Quatre pièges connus, chacun avec son
remède.

**`getVoices()` renvoie une liste vide au premier appel.** Sur Chrome les voix
arrivent de façon asynchrone. Remède : attendre l'événement `voiceschanged`, et
ne pas supposer qu'une première lecture synchrone suffit.

**iOS exige un geste utilisateur avant la première parole.** Même contrainte que
la lecture audio d'Awal. Remède : la première parole descend toujours d'un
appui, ce qui est naturel ici puisque rien ne parle sans qu'elle touche.

**Les voix réseau introduisent une latence.** Une enfant de trois ans qui touche
une lettre doit l'entendre tout de suite. Remède : préférer une voix `fr-FR`
locale (`localService`) quand il en existe une.

**Elle va marteler l'écran.** Empiler les paroles produirait une file qui
continue de parler longtemps après. Remède : annuler la parole en cours avant
chaque nouvelle. La dernière lettre touchée est celle qu'on entend.

S'y ajoute un débit légèrement ralenti, adapté à une petite oreille.

**Si aucune voix française n'existe sur l'appareil**, l'application le signale
en texte — donc au parent, puisqu'elle ne lit pas — et reste utilisable en
silence pour regarder les formes. Sur iPad la voix est intégrée, le cas est
improbable mais pas impossible.

---

## Écran 1 — Explorer

Les 26 majuscules en grille, aussi grandes que l'écran le permet. Elle touche
une lettre, elle l'entend, la lettre réagit brièvement. Rien ne peut échouer.

C'est l'équivalent de l'imagier d'Awal, et le bon point de départ : à trois ans,
la découverte libre précède tout exercice.

---

## Écran 2 — Trouve la lettre

Elle entend une lettre, elle la touche parmi **trois**.

- **Une erreur ne sanctionne pas.** La tuile touchée décline doucement, le son
  se rejoue. Aucun buzzer : à trois ans, c'est un mauvais souvenir, pas une
  correction.
- **Une réussite fête.** La lettre grandit, quelque chose de joyeux apparaît, et
  une nouvelle question arrive.
- **Un bouton rejoue le son**, aussi grand que les autres : elle oubliera ce
  qu'elle cherche.
- **Pas de fin, pas de score.** Elle s'arrête quand elle s'arrête.

Le tirage garantit trois propositions distinctes dont la bonne réponse. Les
lettres sont tirées au hasard parmi les 26 : sans persistance, il n'y a pas de
notion de « déjà vue », et à cet âge la répétition n'est pas un défaut.

---

## Défaillances et cas limites

| Cas | Comportement |
|---|---|
| Aucune voix `fr-FR` | Message au parent ; l'app reste consultable en silence |
| Synthèse indisponible (`speechSynthesis` absent) | Idem |
| Appuis répétés | La parole en cours est annulée, la dernière touche gagne |
| Hors ligne | Tout fonctionne : fichiers statiques en cache, voix locale |

---

## Tests

**Testable hors navigateur, donc testé :**

- La table des 26 lettres : complète, sans doublon de glyphe, aucune
  prononciation vide.
- Le tirage de « Trouve la lettre » : la bonne réponse est toujours parmi les
  propositions, les trois sont distinctes, et le tirage fonctionne pour
  n'importe quelle lettre cible.

**Vérifiable seulement dans un navigateur :**

- Les 26 prononciations, à l'oreille.
- La sélection de voix, l'annulation à la volée, le premier appui sur iOS.

---

## Déploiement

Quatrième projet Vercel du dépôt, `Root Directory` sur `apps/lettres`, **aucune
variable d'environnement**. Export statique, donc rien à configurer.

Un service worker précache les routes et les fichiers compilés, comme dans l'app
enfant, pour un fonctionnement hors ligne complet. Il n'y a aucun média distant
à mettre en cache : la voix est synthétisée sur l'appareil.

---

## Hors périmètre

Volontairement laissé de côté, dans cet ordre de priorité si l'on continue :

1. **« A comme Avion »** — ancrer la lettre dans une image et un mot ; c'est ce
   qui aide le plus à mémoriser.
2. **La chanson de l'alphabet** — les 26 lettres à la suite ; les enfants de
   trois ans en raffolent.
3. **Les minuscules**, une fois les majuscules acquises.
4. **Le prénom de sa fille**, comme première lettre mise en avant.
5. **Le tracé au doigt**, quand sa motricité le permettra — vers cinq ans.
