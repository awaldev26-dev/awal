import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

/**
 * Enveloppe scrypt en promesse.
 *
 * Écrit à la main plutôt qu'avec `promisify` : celui-ci ne conserve qu'une des
 * surcharges de scrypt et rejette la variante qui accepte des options, alors
 * que ce sont précisément elles qui règlent le coût du calcul.
 */
function deriver(
  motDePasse: string,
  sel: Buffer,
  longueur: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resoudre, rejeter) => {
    scrypt(motDePasse, sel, longueur, options, (erreur, resultat) => {
      if (erreur) rejeter(erreur)
      else resoudre(resultat)
    })
  })
}

/**
 * Coût du calcul. N=32768 demande environ cent millisecondes et trente
 * mégaoctets — imperceptible pour une connexion, prohibitif pour un
 * bourrinage : la lenteur est ici la seule protection, faute de limitation
 * de tentatives.
 */
const COUT = 32_768
const BLOC = 8
const PARALLELISME = 1
const LONGUEUR = 32

/**
 * Plafond mémoire de scrypt. Le calcul demande 128 × N × r, soit trente-deux
 * mégaoctets ici — exactement la limite par défaut de Node, qui refuse donc
 * l'opération. On la relève d'un cran plutôt que d'affaiblir le coût.
 */
const MEMOIRE_MAX = 64 * 1024 * 1024

/**
 * Empreinte d'un mot de passe, au format `scrypt:coût:sel:hachage`.
 *
 * Le séparateur est un deux-points et non le dollar habituel des empreintes :
 * dans un fichier .env, `$32768` est interprété comme une variable — par le
 * shell comme par Next — et l'empreinte arrive tronquée. Le symptôme est un
 * mot de passe correct systématiquement refusé, sans rien qui désigne la cause.
 *
 * scrypt plutôt qu'un condensé rapide comme MD5 ou SHA-256 : ces derniers sont
 * conçus pour être véloces, ce qui permet d'en calculer des milliards par
 * seconde sur un processeur graphique. Un mot de passe doit au contraire coûter
 * cher à vérifier.
 */
export async function hacher(motDePasse: string): Promise<string> {
  const sel = randomBytes(16)
  const hachage = await deriver(motDePasse, sel, LONGUEUR, {
    N: COUT,
    r: BLOC,
    p: PARALLELISME,
    maxmem: MEMOIRE_MAX,
  })
  return ['scrypt', COUT, sel.toString('hex'), hachage.toString('hex')].join(':')
}

/**
 * Vérifie un mot de passe contre son empreinte.
 *
 * La comparaison est à temps constant : un `===` s'arrête au premier octet
 * différent, ce qui laisse fuiter par la durée le nombre de caractères
 * corrects et permet de reconstituer le mot de passe pas à pas.
 *
 * Une empreinte mal formée renvoie faux au lieu de lever : une variable
 * d'environnement mal renseignée doit refuser l'accès, pas casser la page.
 */
export async function verifier(saisie: string, empreinte: string): Promise<boolean> {
  const morceaux = empreinte.split(':')
  if (morceaux.length !== 4 || morceaux[0] !== 'scrypt') return false

  const cout = Number(morceaux[1])
  if (!Number.isInteger(cout) || cout < 1024) return false

  const sel = Buffer.from(morceaux[2] ?? '', 'hex')
  const attendu = Buffer.from(morceaux[3] ?? '', 'hex')
  if (sel.length === 0 || attendu.length !== LONGUEUR) return false

  try {
    const calcule = await deriver(saisie, sel, LONGUEUR, {
      N: cout,
      r: BLOC,
      p: PARALLELISME,
      maxmem: MEMOIRE_MAX,
    })
    return timingSafeEqual(calcule, attendu)
  } catch {
    return false
  }
}
