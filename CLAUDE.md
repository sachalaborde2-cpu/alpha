# Alpha — contexte projet (à lire avant tout)

PWA d'entraînement cognitif (calcul, logique, mémoire, vivacité, probas), DA « terminal de trading ».
Utilisateur : Sacha, francophone, iPhone. **Tout le texte de l'app et les réponses sont en français.**
Prod : https://alpha-sacha.netlify.app — `git push` sur `main` = déploiement auto Netlify (~30 s).
Priorité de l'utilisateur : **minimiser temps et tokens** → lire seulement les fichiers touchés (grep + lectures partielles),
réutiliser `tools/`, réponses courtes.

## Stack
Vanilla JS sans build ni dépendance côté client, un namespace global `A`. Pas de node en local : Chrome headless + python3/PIL.
Serveur : une seule fonction Netlify (`/api/*`) + Netlify Blobs.

## Carte des fichiers
| Fichier | Contenu |
|---|---|
| `public/js/core.js` | `A.VERSION`, `A.CHANGELOG`, utilitaires (`A.rand/pick/fmt/num/F` fractions/`editNum/showNum/numOk`), stockage `A.db` (localStorage `alpha.v1`), `A.CATS`, `A.register`, `A.market()` (indice), `A.keypad`, `A.tap`, `A.confirm/prompt/toast` |
| `public/js/app.js` | Écrans (`renderDesk/Modules/Social/Stats/Settings/Close/Teaser`, `openIntro`, `runGame` = moteur de partie, `renderResult`), `planFor(day)` = séance du jour, SW + mises à jour, `A.ui` |
| `public/js/games/<id>.js` | Un jeu par fichier (ordre des `<script>` = ordre dans les listes) |
| `public/js/games/exit-bank.js` | Banque générée de puzzles (ne pas éditer à la main → `tools/gen-exit-bank.sh`) |
| `public/js/charts.js` | SVG faits main : `A.chart.line/candles/radar/heat/bars/spark` |
| `public/js/social.js` | `A.social` : profil, sync du résumé, amis, board |
| `public/js/teasers.js` | `A.TEASERS` (ids `tNN`, réponses entières, `accept` optionnel) |
| `public/css/app.css` | Tokens `:root` (fond #05070a, ambre, `--up` vert/`--down` rouge réservés aux variations), sections par jeu en fin de fichier |
| `public/sw.js` | Cache hors ligne versionné (`VERSION` + liste `FILES`) |
| `netlify/lib/alpha-api.mjs` | Logique API (testable) · `netlify/functions/api.mjs` = branchement Blobs |

Jeux (id → catégorie) : calc, optiver, g24, pnl → calc · seq, riddle, exit, code → logi · nback, span, book → memo · arb, switch, stroop → viva · proba, fair → quant.

## Contrat d'un jeu (`A.register({...})`)
`id, cat, code (ticker affiché), name, short, desc, rules[], variants[{id,label,time|null,...}], def, unit, perf(score, vid) → 0-100, start(ctx)`.
`start` renvoie `{ finish() → {score, stats:[[libellé, valeur]], level?, x?}, levelKey? }`.
`ctx` : `el, v, now()` (horloge de jeu, en pause si l'app passe en arrière-plan), **`later(fn, ms)` (jamais setTimeout dans un jeu)**, `score(n), progress(p), flash(ok), toast(msg), sfx(type), end(result)`.
Boutons de jeu : `A.tap` (pointerdown). Dans les écrans qui défilent : `click`.
`perf` est **recalculée sur tout l'historique** dans `A.market()` : changer un barème est rétroactif.

## Ajouter un jeu (checklist)
1. `public/js/games/<id>.js` · 2. `<script>` dans `public/index.html` · 3. chemin dans `FILES` de `public/sw.js`
4. CSS en fin d'`app.css` · 5. optionnel : pool de `planFor()` dans `app.js` · 6. `tools/check.sh` (vérifie aussi 2 et 3).

## Publier une version (toujours)
1. `A.VERSION` (core.js) **et** `VERSION` (sw.js), identiques · 2. entrée en tête de `A.CHANGELOG`
3. `tools/check.sh` → doit afficher `RÉSULTAT : N/N OK` · 4. commit en français + push
5. Vérifier le déploiement : `curl -s https://alpha-sacha.netlify.app/js/core.js | grep "A.VERSION ="`

## Outils (à utiliser au lieu d'écrire des harnais jetables)
- `tools/check.sh` (~3 s) : version/cache SW, contrat des jeux, générateurs, smoke test de chaque jeu et variante, API en mémoire, rendu de tous les écrans. `-v` = détail, `--full` = revérifie la banque de puzzles par BFS (~1 min, seulement si exit change).
- `tools/shot.sh "a=desk&seed=1" "a=play&g=exit" …` → **une seule planche** `/tmp/alpha-shots/sheet.png` (écrans : desk, mods, rank, stats, settings, close, teaser, intro, play, result ; `seed=1` historique fictif, `social=1` amis fictifs, `y=` défilement).
- `tools/gen-exit-bank.sh` : régénère la banque de la Balle & le Trou.
- Local : `cd public && python3 -m http.server 8765` (l'API ne marche qu'en prod).

## Pièges connus
- **Domaine** : les scores vivent dans le localStorage de `alpha-sacha.netlify.app`. Ne jamais changer d'URL (perte des données).
- **Mises à jour iOS** : l'app reprend souvent sans relancer ; depuis la 1.2, `reg.update()` à chaque retour + rechargement auto sur `controllerchange` (jamais en pleine partie). Oublier de changer `VERSION` dans sw.js = pas de mise à jour sur les téléphones.
- **Chrome headless** : `requestAnimationFrame` bridé → l'horloge de jeu a aussi un `setInterval` de secours. Les harnais accélèrent `setTimeout` pour sauter le compte à rebours.
- **Séance du jour** : tirée à partir de la date (`planFor`) et stockée dans `A.db.daily[jour]`. Changer les pools modifie les tirages des jours suivants, et le duel entre amis compare par clé `jeu/variante`.
- **API** : ne pas laisser de profils de test en prod (action `delete`). Clés Blobs : `user/<id>`, `code/<CODE>`. Le jeton n'est stocké que haché.
- **Données** `A.db` : `sessions[{id,g,v,score,perf,dur,t,day,daily,x}]`, `levels`, `daily[jour]{plan,done,teaser}`, `teasers`, `settings`, `social{id,token,code,name,board,...}`, `seenVersion`.
- Jamais d'API d'IA payante : l'app doit rester gratuite (offres gratuites GitHub + Netlify).
