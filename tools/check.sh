#!/bin/bash
# Lance TOUS les tests automatiques dans Chrome headless et affiche un rapport compact :
# cohérence version/cache, contrat des jeux, générateurs, smoke test de chaque jeu,
# API (store en mémoire), rendu de chaque écran de l'app.
# Usage : tools/check.sh           rapide : seulement les échecs + le total
#         tools/check.sh -v        tout le détail
#         tools/check.sh --full    + revérifie par BFS les puzzles de la Balle & le Trou (~1 min)
source "$(dirname "$0")/_serve.sh"
Q="?x=1"; for a in "$@"; do [ "$a" = "-v" ] && Q="$Q&v=1"; [ "$a" = "--full" ] && Q="$Q&full=1"; done
"$CHROME" --headless=new --disable-gpu --virtual-time-budget=180000 --dump-dom "http://localhost:$PORT/tools/test.html$Q" 2>/dev/null \
  | python3 -c "import sys,re,html;d=sys.stdin.read();m=re.search(r'<pre id=\"out\">(.*?)</pre>',d,re.S);print(html.unescape(m.group(1)) if m else 'Aucune sortie : erreur de chargement de tools/test.html')"
