# Alpha — terminal d'entraînement cognitif

Web app (PWA) d'entraînement : calcul mental, logique, mémoire, vivacité, probas, avec un classement entre amis.
En ligne sur https://alpha-sacha.netlify.app. Chaque `git push` sur `main` est déployé automatiquement par Netlify.

## Structure

- `public/` : l'app, publiée telle quelle (HTML/CSS/JS, sans étape de build)
  - `js/core.js` : utilitaires, stockage local, indice Alpha, **numéro de version**
  - `js/app.js` : écrans (desk, modules, amis, stats, réglages) et moteur de partie
  - `js/games/*.js` : un fichier par jeu
  - `js/social.js` : profil, amis, synchronisation
  - `sw.js` : service worker (mode hors ligne)
- `netlify/functions/api.mjs` : l'API `/api/*` (fonction Netlify)
- `netlify/lib/alpha-api.mjs` : la logique de l'API (profils, amis, classement), stockée dans Netlify Blobs

## Publier une nouvelle version

1. Changer le numéro de version dans `public/js/core.js` (`A.VERSION`) **et** dans `public/sw.js` (`VERSION`).
2. Ajouter une entrée en tête de `A.CHANGELOG` (`public/js/core.js`).
3. Puis :
   ```bash
   git add .
   git commit -m "Version x.y.z : …"
   git push
   ```

## Tester en local

```bash
cd public && python3 -m http.server 8765
```
Puis ouvrir http://localhost:8765. Le classement entre amis ne marche qu'en ligne, car il a besoin des fonctions Netlify.
