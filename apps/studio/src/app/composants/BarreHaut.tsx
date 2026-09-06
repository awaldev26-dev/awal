"use client";

import { useState } from "react";
import { lancerPublication } from "../actions";
import type { ResultatPublication } from "@/publication/publier";

export function BarreHaut({
  enregistrees,
  total,
  derniereVersion,
  onPublie,
}: {
  enregistrees: number;
  total: number;
  derniereVersion: number | null;
  onPublie: () => void;
}) {
  const [resultat, setResultat] = useState<ResultatPublication | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function publier() {
    setEnCours(true);
    const obtenu = await lancerPublication();
    setResultat(obtenu);
    setEnCours(false);
    if (obtenu.ok) onPublie();
  }

  const part = total > 0 ? Math.round((enregistrees / total) * 100) : 0;

  return (
    <header className="relative flex h-barre shrink-0 items-center gap-bloc border-b border-bordure bg-surface px-bloc">
      <span className="shrink-0 font-semibold text-encre">Studio Awal</span>

      <div className="flex min-w-0 items-center gap-encart">
        {/* La barre passe la première à la trappe sur petit écran : le compte
            chiffré dit la même chose en moins de place. */}
        <div
          className="hidden h-1.5 w-40 overflow-hidden rounded-pilule bg-surface-creuse md:block"
          role="progressbar"
          aria-valuenow={enregistrees}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-pilule bg-succes transition-all"
            style={{ width: `${part}%` }}
          />
        </div>
        <span className="truncate text-sm text-encre-douce">
          <strong className="text-encre">{enregistrees}</strong> / {total} de ta
          voix
        </span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-bloc">
        <span className="hidden text-xs text-encre-faible sm:block">
          {derniereVersion ? `publié en v${derniereVersion}` : "jamais publié"}
        </span>
        <button
          type="button"
          onClick={publier}
          disabled={enCours}
          className="rounded-champ bg-encre px-4 py-2 text-sm font-semibold text-white transition hover:bg-encre/90 disabled:opacity-50"
        >
          {enCours ? (
            "Publication…"
          ) : (
            <>
              <span className="md:hidden">Publier</span>
              <span className="hidden md:inline">Publier le corpus</span>
            </>
          )}
        </button>
      </div>

      {resultat ? (
        <div
          className={[
            "absolute top-barre inset-x-bloc z-10 mt-2 rounded-panneau border p-bloc text-sm shadow-flottant",
            "md:inset-x-auto md:right-bloc md:max-w-md",
            resultat.ok
              ? "border-succes/30 bg-succes-pale text-succes"
              : "border-danger/30 bg-danger-pale text-danger",
          ].join(" ")}
        >
          <div className="flex items-start gap-encart">
            <div className="flex-1">
              {resultat.ok ? (
                <>
                  Publié en v{resultat.version}. L’app le recevra à son prochain
                  lancement.
                </>
              ) : (
                <>
                  <strong>{resultat.problemes.length} problème(s)</strong>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {resultat.problemes.slice(0, 6).map((probleme, index) => (
                      <li key={index}>{probleme.message}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setResultat(null)}
              aria-label="fermer"
              className="text-base leading-none opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
