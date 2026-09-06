/**
 * Les 26 lettres, et ce qu'on donne à la synthèse pour les dire.
 *
 * On ne lui donne jamais le glyphe. Selon le moteur, « Y » se dit « y » au lieu
 * de « i grec », « W » varie, et une lettre isolée peut être lue comme un mot.
 * L'orthographe du nom, elle, est déterministe.
 *
 * Quelques entrées demandent une explication, car elles ne se devinent pas :
 *
 * — `Q` s'écrit « ku » et non « qu » : le « u » français se dit /y/, donc
 *   « ku » viserait /ky/, le nom de la lettre, là où « qu » donnerait /k/,
 *   c'est-à-dire son son.
 * — `X` s'écrit « ixe » plutôt que « iks ».
 * — `E` s'écrit « e », tout simplement. « eu » avait d'abord été choisi par
 *   crainte qu'un « e » seul ne soit muet ; c'était un risque imaginaire, et
 *   le remède introduisait un vrai défaut : « eu » se dit /ø/ et non /ə/, une
 *   voyelle antérieure arrondie que l'oreille confond avec le /y/ de `U`. Un
 *   « e » seul est bien prononcé, et dure autant que « eu ».
 * — `N` s'écrit « ène » et non « enne », qui est pourtant l'orthographe usuelle
 *   du nom de la lettre : la voix Thomas de macOS l'épelait, prononçant
 *   « e-n-n-e ». Constaté à l'oreille, puis confirmé par la durée — « enne »
 *   demandait 743 ms contre 557 pour « ène », là où les autres lettres à
 *   consonne doublée tiennent entre 450 et 670 ms.
 *
 * La durée est un bon détecteur d'épellation, à condition de la lire : une
 * orthographe épelée coûte nettement plus que la même syllabe dite d'un trait,
 * et deux orthographes de longueurs différentes qui durent pareil sont, elles,
 * lues comme des mots.
 *
 * Elle ne dit rien en revanche de la justesse du son. « ku » sonne-t-il /ky/ ?
 * Cela ne se vérifie qu'à l'oreille, et toute modification doit y repasser.
 */
export interface Lettre {
  /** La majuscule affichée. */
  glyphe: string
  /** Orthographe donnée à la synthèse — jamais le glyphe. */
  dit: string
}

export const ALPHABET: readonly Lettre[] = [
  { glyphe: 'A', dit: 'a' },
  { glyphe: 'B', dit: 'bé' },
  { glyphe: 'C', dit: 'cé' },
  { glyphe: 'D', dit: 'dé' },
  { glyphe: 'E', dit: 'e' },
  { glyphe: 'F', dit: 'effe' },
  { glyphe: 'G', dit: 'gé' },
  { glyphe: 'H', dit: 'hache' },
  { glyphe: 'I', dit: 'i' },
  { glyphe: 'J', dit: 'ji' },
  { glyphe: 'K', dit: 'ka' },
  { glyphe: 'L', dit: 'elle' },
  { glyphe: 'M', dit: 'emme' },
  { glyphe: 'N', dit: 'ène' },
  { glyphe: 'O', dit: 'o' },
  { glyphe: 'P', dit: 'pé' },
  { glyphe: 'Q', dit: 'ku' },
  { glyphe: 'R', dit: 'erre' },
  { glyphe: 'S', dit: 'esse' },
  { glyphe: 'T', dit: 'té' },
  { glyphe: 'U', dit: 'u' },
  { glyphe: 'V', dit: 'vé' },
  { glyphe: 'W', dit: 'double vé' },
  { glyphe: 'X', dit: 'ixe' },
  { glyphe: 'Y', dit: 'i grec' },
  { glyphe: 'Z', dit: 'zède' },
]
