'use client'

/**
 * Bouton de retour.
 *
 * La flèche est un tracé et non le caractère « ← » : les glyphes de flèche
 * Unicode ne sont pas centrés dans leur boîte, si bien qu'aucun centrage CSS
 * ne les aligne vraiment. Un SVG se centre, lui, exactement.
 */
export function BoutonRetour({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="retour"
      className={[
        'grid size-12 shrink-0 place-items-center rounded-pilule bg-surface shadow-halo',
        'text-encre transition-transform active:scale-[0.95]',
        className,
      ].join(' ')}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )
}
