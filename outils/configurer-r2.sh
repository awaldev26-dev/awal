#!/usr/bin/env bash
# Renseigne les variables R2 dans apps/studio/.env.local, sans éditeur.
#
# Les valeurs saisies ne quittent pas cette machine. Le secret n'est pas
# affiché à l'écran pendant la frappe.
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
FICHIER="$RACINE/apps/studio/.env.local"

if [ ! -f "$FICHIER" ]; then
  cp "$RACINE/apps/studio/.env.example" "$FICHIER"
  echo "Créé $FICHIER depuis .env.example"
fi

lire_actuelle() {
  grep -E "^$1=" "$FICHIER" 2>/dev/null | head -1 | cut -d= -f2- || true
}

demander() {
  local nom="$1" invite="$2" secret="${3:-non}"
  local actuelle valeur
  actuelle="$(lire_actuelle "$nom")"

  if [ "$secret" = "oui" ]; then
    [ -n "$actuelle" ] && invite="$invite [déjà renseigné, Entrée pour garder]"
    printf '%s : ' "$invite"
    read -rs valeur
    echo
  else
    [ -n "$actuelle" ] && invite="$invite [$actuelle]"
    printf '%s : ' "$invite"
    read -r valeur
  fi

  [ -z "$valeur" ] && valeur="$actuelle"
  printf '%s' "$valeur"
}

echo
echo "── Configuration R2 ─────────────────────────────────────"
echo "Console Cloudflare → R2. Entrée seule conserve la valeur actuelle."
echo

COMPTE=$(demander R2_ACCOUNT_ID       "Identifiant de compte (en haut de la page R2)")
BUCKET=$(demander R2_BUCKET           "Nom du bucket")
CLE=$(demander    R2_ACCESS_KEY_ID    "Access Key ID (Manage API tokens)")
SECRET=$(demander R2_SECRET_ACCESS_KEY "Secret Access Key" oui)
URL=$(demander    R2_URL_PUBLIQUE     "URL publique (Settings → Public Development URL)")

# Une URL sans barre finale collerait le domaine à la clé du fichier.
case "$URL" in
  */) ;;
  "") ;;
  *) URL="$URL/"; echo "  (barre oblique finale ajoutée)" ;;
esac

remplacer() {
  local nom="$1" valeur="$2"
  if grep -qE "^$nom=" "$FICHIER"; then
    # La valeur peut contenir des barres obliques : on délimite avec |.
    sed -i '' "s|^$nom=.*|$nom=$valeur|" "$FICHIER"
  else
    printf '%s=%s\n' "$nom" "$valeur" >> "$FICHIER"
  fi
}

remplacer STOCKAGE             r2
remplacer R2_ACCOUNT_ID        "$COMPTE"
remplacer R2_BUCKET            "$BUCKET"
remplacer R2_ACCESS_KEY_ID     "$CLE"
remplacer R2_SECRET_ACCESS_KEY "$SECRET"
remplacer R2_URL_PUBLIQUE      "$URL"

echo
echo "Écrit dans apps/studio/.env.local :"
grep -E '^(STOCKAGE|R2_)' "$FICHIER" | sed 's/^R2_SECRET_ACCESS_KEY=.*/R2_SECRET_ACCESS_KEY=••••••••/'
echo
echo "Vérification…"
echo
cd "$RACINE/apps/studio"
set -a && . ./.env.local && set +a
pnpm tsx seed/verifier-r2.ts
