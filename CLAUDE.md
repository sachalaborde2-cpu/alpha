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
| `public/js/run.js` | `A.run` : **Parcours** (niveaux 1-2000 générés, voir section dédiée) |
| `public/js/charts.js` | SVG faits main : `A.chart.line/candles/radar/heat/bars/spark` |
| `public/js/social.js` | `A.social` : profil, sync du résumé, amis, board |
| `public/js/teasers.js` | `A.TEASERS` (ids `tNN`, réponses entières, `accept` optionnel) |
| `public/css/app.css` | Tokens `:root` (fond #05070a, ambre, `--up` vert/`--down` rouge réservés aux variations), sections par jeu en fin de fichier |
| `public/sw.js` | Cache hors ligne versionné (`VERSION` + liste `FILES`) |
| `netlify/lib/alpha-api.mjs` | Logique API (testable) · `netlify/functions/api.mjs` = branchement Blobs |

Jeux (id → catégorie) : calc, optiver, g24, pnl → calc · seq, riddle, exit, code → logi · nback, span, book → memo · arb, switch, stroop → viva · proba, fair → quant.

## Contrat d'un jeu (`A.register({...})`)
`id, cat, code (ticker affiché), name, short, desc, rules[], variants[{id,label,time|null,...}], def, unit, perf(score, vid) → 0-100, start(ctx)`.
Champs optionnels d'une variante : `note` (ligne sous le sélecteur), `w` (poids dans l'indice, <1 pour Facile/Moyen, 1 par défaut), `hide:true` (masquée dans le sélecteur tant qu'elle n'a pas d'historique), `free:true` (mode Réflexion sans chrono : le moteur ajoute un bouton FIN qui appelle `finish()`).
Convention de niveaux : ids `easy` (Facile) · `mid` (Moyen) · id historique = Difficile · `free` (Réflexion) ; `def` = `easy`. Plage de difficulté = constante `CFG` dans `start`, **jamais** lue dans `A.level`.
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
- `tools/shot.sh "a=desk&seed=1" "a=play&g=exit" …` → **une seule planche** `/tmp/alpha-shots/sheet.png` (écrans : desk, mods, rank, stats, settings, close, teaser, intro, play, result ; `seed=1` historique fictif, `social=1` amis fictifs, `y=` défilement ; `run&n=37` carte du Parcours, `runres&n=7&s=12` résultat d'un niveau).
- `tools/gen-exit-bank.sh` : régénère la banque de la Balle & le Trou.
- Local : `cd public && python3 -m http.server 8765` (l'API ne marche qu'en prod).

## Pièges connus
- **Domaine** : les scores vivent dans le localStorage de `alpha-sacha.netlify.app`. Ne jamais changer d'URL (perte des données).
- **Mises à jour iOS** : l'app reprend souvent sans relancer ; depuis la 1.2, `reg.update()` à chaque retour + rechargement auto sur `controllerchange` (jamais en pleine partie). Oublier de changer `VERSION` dans sw.js = pas de mise à jour sur les téléphones.
- **Chrome headless** : `requestAnimationFrame` bridé → l'horloge de jeu a aussi un `setInterval` de secours. Les harnais accélèrent `setTimeout` pour sauter le compte à rebours.
- **Séance du jour** : tirée à partir de la date (`planFor`) et stockée dans `A.db.daily[jour]`. Changer les pools modifie les tirages des jours suivants, et le duel entre amis compare par clé `jeu/variante`.
- **API** : ne pas laisser de profils de test en prod (action `delete`). Clés Blobs : `user/<id>`, `code/<CODE>`. Le jeton n'est stocké que haché.
- **Niveau adaptatif** : mécanisme `res.level` → `A.db.levels[levelKey || id]` → `A.level()` conservé dans le moteur mais **plus utilisé par aucun jeu depuis la 1.4** (il faisait hériter la difficulté de la dernière partie). Dans une partie le niveau monte au fil des réussites, dans la plage `CFG` du mode choisi.
- **Variantes = clés d'historique** : `sessions[].v`, `perf`, les records et le duel/défi (`jeu/variante`) reposent sur l'id de variante. Ne jamais renommer ni supprimer un id existant ; ajouter de nouveaux ids et garder les anciens (éventuellement masqués) pour ne pas casser l'historique.
- **Données** `A.db` : `sessions[{id,g,v,score,perf,dur,t,day,daily,x}]`, `levels`, `daily[jour]{plan,done,teaser}`, `run{lvl,stars{n:1-3},fails{n},days{jour}}`, `teasers`, `settings`, `social{id,token,code,name,board,...}`, `seenVersion`.
- Jamais d'API d'IA payante : l'app doit rester gratuite (offres gratuites GitHub + Netlify).

## Niveaux de difficulté (v1.4.0, retours de Sacha du 2026-10-26)
Constat de départ : trop dur quand on ne connaît pas le jeu ou qu'on n'est pas échauffé ; Sacha veut s'amuser en enchaînant du facile, et parfois réfléchir sans chrono. Principes appliqués : niveaux séparés et explicites (Facile par défaut), plages de difficulté fixes par niveau avec plafonds, montée plus lente, mode Réflexion sans chrono. Le séance du jour (`planFor`) utilise `mid`.
Indice Alpha (`A.market()`) : une partie Facile (`w` 0,85) ou Moyenne/Réflexion (0,95) tire la cote de sa catégorie vers `perf × w` (plafond), **sans jamais la faire baisser tant que `perf` ≥ 50** (sinon farmer du facile ne ferait rien monter, et un 100/100 facile ne doit pas faire perdre). Pour dépasser 850 / 950 il faut jouer le niveau au-dessus. La `perf` affichée /100 de la partie n'est pas pondérée.

| Jeu | Niveaux (ids) | Notes |
|---|---|---|
| calc | easy, mid, `120`=Difficile (Zetamac), hard=Expert | `LV` : plages des nombres ; easy = 1 min |
| optiver | easy (20 en 3), mid (40 en 5), `40`, `80` | pools `EASY`/`MID` |
| g24 | easy (1-6, étapes entières), mid (1-9, entières), `180`, free | `solve(…, ints)` |
| pnl, proba, fair | easy, mid, `180` | pools de questions faisables de tête ; fair : plafond de niveau 1/2/3 |
| seq, riddle | easy, mid, difficile (`180`/`240`), free | plage de niveaux fixe (`CFG`), plus d'héritage |
| exit | easy (niv. 1-2), mid (2-3), `300`, free | montée après 3 réussites propres |
| code | easy/mid : indice par chiffre (anneaux), `300` classique, free | `pegFb` ; easy sans répétition |
| nback | easy (N 1-2), mid (N 2-3), `3` (N 3-6) | `CFG.start/cap` |
| span | easy (grille 3-5), mid (3-7), `spatial`, dfwd (chiffres à l'endroit), `digits` | plafond = fin de partie |
| book | easy (≤4 lignes, +50 % de temps), mid (≤6), `180` (≤8) | |
| arb | easy (écarts larges), mid (spread ≤ niv. 3), `60` | |
| switch, stroop | inchangés (« ça marche ») | |

## Parcours (v1.5.0)
`A.run` (`run.js`) génère le niveau n à la demande : `A.run.spec(n, fails)` → `{g, vid, time, scale, boss, need[3] (scores pour ★/★★/★★★), assist}`. Écrans `renderRun` (carte), `renderRunResult` dans `app.js` ; `runGame(gid, vid, {run: spec})` surcharge `time` de la variante et affiche `score/objectif`.
- 10 jeux (calc, g24, pnl, proba, fair, seq, arb, book, switch, stroop), par blocs de 10 niveaux (chaque jeu une fois, jamais deux fois de suite) ; niveau multiple de 10 = **boss** (+50 % de temps, objectif +8). Exclus : jeux sans chrono (nback, span, free) et jeux à objets/N fixe (exit, code, riddle, optiver).
- Difficulté : paliers de variantes aux seuils 20 % / 50 % / 85 % de 2000 (Facile → Moyen → Difficile → Expert si le jeu en a un) ; dans un palier la perf visée monte de 35 à 75. Objectif converti en score via `g.perf(score × scale)` (`scale` = durée native de la variante / durée du niveau) : **modifier un `perf` ou une variante déplace les objectifs**.
- Pas de vies : 3 échecs successifs → coup de pouce (−4 de perf visée par échec, max −12). Ne touche ni `A.db.sessions` ni l'indice ; compte seulement pour la série de jours. Sauvegardé dans `A.db.run` (donc dans la sauvegarde cloud).
- Tests : `tools/test.html` vérifie les 2000 niveaux, l'alternance des jeux, la progression et le coup de pouce.
- Promotion : `openIntro` propose le niveau suivant après 3 parties à `perf` ≥ 85 en niveau doux.

Pistes restantes (non faites) : classements séparés par niveau, saisons hebdo, succès/badges, détecteur de points faibles, partie d'essai/tutoriel, page « pourquoi mon indice a bougé », export/import des données, accessibilité daltonisme, vérif serveur des scores ; calibrer les barèmes `perf` avec de vraies parties (les constantes des niveaux Facile/Moyen sont des estimations), éventuel mode Réflexion pour d'autres jeux.
