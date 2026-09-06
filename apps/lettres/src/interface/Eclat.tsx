'use client'

/**
 * Éclat projeté depuis la lettre trouvée.
 *
 * Remplace un semis de ronds qui surgissaient sur place et restaient là : rien
 * n'éclatait, rien ne partait. Ici les grains jaillissent du centre, tournent
 * en s'éloignant et se dissipent — c'est le mouvement qui fait la fête, pas la
 * couleur.
 *
 * Le rayonnement part du centre de la tuile, et non du haut de l'écran : la
 * joie doit désigner la lettre, pas décorer la page.
 */

/** Teintes de l'éclat, puisées dans la palette et jamais écrites en dur. */
const TEINTES = [
  'var(--color-bleu)',
  'var(--color-framboise)',
  'var(--color-mandarine)',
  'var(--color-menthe)',
  'var(--color-mure)',
]

const NOMBRE = 18

/**
 * Grains disposés en couronne, avec une distance et une taille qui alternent.
 *
 * Tout est déduit de l'index et non tiré au hasard : le rendu doit être
 * identique entre le serveur et le client, ce qu'exige l'export statique.
 * Deux rayons alternés évitent l'anneau trop régulier d'une couronne unique.
 */
const GRAINS = Array.from({ length: NOMBRE }, (_, i) => {
  const angle = (i / NOMBRE) * Math.PI * 2
  const distance = i % 2 === 0 ? 5.4 : 3.8
  const etoile = i % 3 === 0
  return {
    dx: `${(Math.cos(angle) * distance).toFixed(2)}rem`,
    dy: `${(Math.sin(angle) * distance).toFixed(2)}rem`,
    rot: `${i % 2 === 0 ? 200 : -160}deg`,
    taille: etoile ? '0.85rem' : i % 4 === 0 ? '0.6rem' : '0.45rem',
    teinte: TEINTES[i % TEINTES.length] as string,
    etoile,
    retard: `${(i % 4) * 0.035}s`,
  }
})

export function Eclat() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 grid place-items-center overflow-visible"
    >
      {/* L'onde donne l'ampleur ; les grains donnent la vie. */}
      <span
        className="absolute animate-onde rounded-pilule"
        style={{
          width: '70%',
          height: '70%',
          border: '0.4rem solid var(--color-joie)',
        }}
      />

      {GRAINS.map((grain, i) => (
        <span
          key={i}
          className="absolute animate-eclat"
          style={
            {
              width: grain.taille,
              height: grain.taille,
              background: grain.etoile ? 'transparent' : grain.teinte,
              color: grain.teinte,
              borderRadius: grain.etoile ? 0 : '999px',
              fontSize: grain.taille,
              lineHeight: 1,
              animationDelay: grain.retard,
              '--dx': grain.dx,
              '--dy': grain.dy,
              '--rot': grain.rot,
            } as React.CSSProperties
          }
        >
          {grain.etoile ? '★' : null}
        </span>
      ))}
    </span>
  )
}
