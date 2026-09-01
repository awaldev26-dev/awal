#!/usr/bin/env bash
# Publie le corpus depuis le studio et le copie dans l'app enfant.
#
# Utile en développement, quand le stockage est sur disque : l'app enfant est
# un export statique et sert le corpus et les audios depuis son propre public/.
# En production, R2 sert les deux et ce script n'a plus lieu d'être.
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RACINE/apps/studio"
set -a && . ./.env.local && set +a

pnpm tsx seed/publier.ts

DEST="$RACINE/apps/enfant/public"
rm -rf "$DEST/audio" "$DEST/corpus"
cp -R medias/audio "$DEST/audio"
cp -R medias/corpus "$DEST/corpus"

echo "Corpus et $(ls "$DEST/audio" | wc -l | tr -d ' ') audios copiés dans apps/enfant/public/"
