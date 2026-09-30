#!/bin/bash
# Captures d'écran au format iPhone (390×844), assemblées en UNE planche (moins d'images à lire).
# Chaque argument = une capture, sous forme de paramètres de tools/shot.html :
#   a=desk|mods|rank|stats|settings|close|teaser|intro|play|result   (écran)
#   g=<id du jeu> v=<variante>   (pour intro / play / result)
#   seed=1     faux historique de 24 jours      social=1   profil + 2 amis fictifs (onglet AMIS)
#   y=<px>     défilement vertical
# Exemple : tools/shot.sh "a=desk&seed=1" "a=play&g=exit" "a=rank&seed=1&social=1"
# Sortie  : /tmp/alpha-shots/sheet.png (+ une image par capture)
source "$(dirname "$0")/_serve.sh"
OUT=/tmp/alpha-shots; rm -rf "$OUT"; mkdir -p "$OUT"
i=0
for q in "$@"; do
  i=$((i+1))
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=390,844 --timeout=3500 \
    --screenshot="$OUT/$i.png" "http://localhost:$PORT/tools/shot.html?$q" >/dev/null 2>&1
done
python3 - "$OUT" "$i" <<'PY'
import sys
from PIL import Image
out, n = sys.argv[1], int(sys.argv[2])
ims = [Image.open(f"{out}/{k}.png").crop((0, 0, 390, 844)) for k in range(1, n + 1)]
cols = min(5, n); rows = (n + cols - 1) // cols
sheet = Image.new('RGB', (390 * cols, 844 * rows))
for k, im in enumerate(ims): sheet.paste(im, ((k % cols) * 390, (k // cols) * 844))
s = 0.62 if n > 1 else 1
sheet.resize((int(sheet.width * s), int(sheet.height * s))).save(f"{out}/sheet.png")
print(f"{out}/sheet.png")
PY
