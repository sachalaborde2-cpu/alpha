# Utilitaire commun : sert la racine du dépôt sur le port 8765 si ce n'est pas déjà fait.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=8765
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if ! curl -sf -o /dev/null "http://localhost:$PORT/tools/test.html"; then
  (cd "$ROOT" && python3 -m http.server $PORT >/dev/null 2>&1 &)
  for _ in 1 2 3 4 5 6 7 8 9 10; do curl -sf -o /dev/null "http://localhost:$PORT/tools/test.html" && break; sleep 0.3; done
fi
