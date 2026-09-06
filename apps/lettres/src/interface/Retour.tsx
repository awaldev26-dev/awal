'use client'

/**
 * Retour.
 *
 * Une flèche dessinée en SVG et non le caractère « ← », qui n'est pas centré
 * dans la plupart des polices et se voit de travers dans un bouton rond.
 */
export function Retour({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="retour"
      className="grid size-14 shrink-0 place-items-center rounded-pilule bg-surface text-encre shadow-halo transition-transform active:scale-[0.94]"
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden>
        <path
          d="M15 5l-7 7 7 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
