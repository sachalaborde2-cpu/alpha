#!/bin/bash
# Régénère public/js/games/exit-bank.js (puzzles de la Balle & le Trou, optimal calculé par BFS).
# À lancer seulement si les règles du jeu ou LEVELS (exit.js) changent. Durée : 1 à 4 min.
source "$(dirname "$0")/_serve.sh"
"$CHROME" --headless=new --disable-gpu --dump-dom "http://localhost:$PORT/tools/gen-exit-bank.html" 2>/dev/null | python3 -c "
import sys, re, json, html
bank = json.loads(html.unescape(re.search(r'<pre id=\"out\">(.*?)</pre>', sys.stdin.read(), re.S).group(1)))
js = \"'use strict';\n/* Banque de puzzles « La Balle & le Trou » (générée par tools/gen-exit-bank.sh, optimal par BFS).\n * Format : 'optimal:' + côté du trou (L/R/T/B) + position + balle x,y + véhicules 'xylh'… */\nA.EXIT_BANK = [\n\" + ',\n'.join('  ' + json.dumps(b) for b in bank) + '\n];\n'
open('$ROOT/public/js/games/exit-bank.js', 'w').write(js)
print('Banque écrite :', [len(b) for b in bank], 'puzzles par niveau')"
echo "Pense à lancer : tools/check.sh --full"
