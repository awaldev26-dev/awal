"use client";

import { useEffect, useRef, useState } from "react";
import { televerserAudio } from "../actions";

type Etat = "pret" | "enregistre" | "envoi";

/**
 * Enregistrement d'une entrée.
 *
 * Trois choses comptent quand on enchaîne deux cents prises : voir qu'on
 * enregistre, entendre le résultat aussitôt, et pouvoir refaire sans réfléchir.
 * D'où le chronomètre, la réécoute immédiate et le raccourci clavier.
 */
export function Enregistreur({
  entreeId,
  audioActuel,
  urlBase,
  onEnvoye,
}: {
  entreeId: string;
  audioActuel: string | null;
  urlBase: string;
  onEnvoye: () => void;
}) {
  const [etat, setEtat] = useState<Etat>("pret");
  const [secondes, setSecondes] = useState(0);
  const [apercu, setApercu] = useState<string | null>(null);
  const enregistreur = useRef<MediaRecorder | null>(null);
  const morceaux = useRef<Blob[]>([]);

  // Une nouvelle entrée efface l'aperçu de la précédente.
  useEffect(() => {
    setApercu(null);
    setEtat("pret");
    setSecondes(0);
  }, [entreeId]);

  useEffect(() => {
    if (etat !== "enregistre") return;
    const minuteur = setInterval(
      () => setSecondes((valeur) => valeur + 1),
      1000,
    );
    return () => clearInterval(minuteur);
  }, [etat]);

  async function demarrer() {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
    morceaux.current = [];
    setSecondes(0);

    const micro = new MediaRecorder(flux);
    micro.ondataavailable = (evenement) =>
      morceaux.current.push(evenement.data);
    micro.onstop = async () => {
      for (const piste of flux.getTracks()) piste.stop();
      const blob = new Blob(morceaux.current, { type: micro.mimeType });
      setApercu(URL.createObjectURL(blob));
      setEtat("envoi");
      const extension = micro.mimeType.includes("mp4") ? "mp4" : "webm";
      await televerserAudio(
        entreeId,
        new File([blob], `${entreeId}.${extension}`, { type: micro.mimeType }),
      );
      setEtat("pret");
      onEnvoye();
    };

    enregistreur.current = micro;
    micro.start();
    setEtat("enregistre");
  }

  function basculer() {
    if (etat === "enregistre") enregistreur.current?.stop();
    else if (etat === "pret") void demarrer();
  }

  // Espace démarre et arrête la prise : on garde les mains libres.
  useEffect(() => {
    function auClavier(evenement: KeyboardEvent) {
      const cible = evenement.target as HTMLElement | null;
      if (cible && ["INPUT", "TEXTAREA"].includes(cible.tagName)) return;
      if (evenement.code !== "Space") return;
      evenement.preventDefault();
      basculer();
    }
    window.addEventListener("keydown", auClavier);
    return () => window.removeEventListener("keydown", auClavier);
  });

  const source = apercu ?? (audioActuel ? `${urlBase}${audioActuel}` : null);
  const estRemplacement = audioActuel?.includes("remplacement") ?? false;

  return (
    <div className="rounded-panneau border border-bordure bg-surface p-bloc">
      <div className="flex flex-wrap items-center gap-encart">
        <button
          type="button"
          onClick={basculer}
          disabled={etat === "envoi"}
          className={[
            "flex h-11 items-center gap-2 rounded-pilule px-5 text-sm font-semibold transition",
            etat === "enregistre"
              ? "bg-danger text-white hover:bg-danger/90"
              : "bg-accent text-white hover:bg-accent-sombre disabled:opacity-50",
          ].join(" ")}
        >
          {etat === "enregistre" ? (
            <>
              <span className="size-2.5 rounded-sm bg-white" />
              Arrêter — {secondes} s
            </>
          ) : etat === "envoi" ? (
            "Envoi…"
          ) : (
            <>
              <span className="size-2.5 animate-pulse rounded-pilule bg-white" />
              Enregistrer
            </>
          )}
        </button>

        {/* Inutile à annoncer sur un téléphone, qui n'a pas de barre d'espace. */}
        <kbd className="hidden rounded-champ border border-bordure bg-surface-creuse px-2 py-1 text-xs text-encre-faible md:block">
          espace
        </kbd>

        {source ? (
          // La clé force le rechargement quand l'audio change.
          <audio
            key={source}
            controls
            src={source}
            className="h-9 w-full md:w-auto md:flex-1"
          />
        ) : (
          <span className="text-sm text-danger">aucun audio</span>
        )}
      </div>

      {estRemplacement && !apercu ? (
        <p className="mt-encart rounded-champ bg-alerte-pale px-3 py-2 text-xs text-alerte">
          Voix de synthèse — prononciation fausse, à remplacer par la tienne.
        </p>
      ) : null}
    </div>
  );
}
