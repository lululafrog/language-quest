# 🌴 Language Quest

Apprendre l'indonésien et préparer ou animer des cours d'anglais pour enfants. PWA statique, sans compte, hors ligne.

## Lancer sur l'ordinateur

```bash
cd "language-quest" && python3 -m http.server 5173
```

Puis ouvrir http://localhost:5173.

## Mettre en ligne (pour le téléphone)

Le dossier est un site statique, sans compilation. Il suffit de le glisser-déposer sur https://app.netlify.com/drop (ou GitHub Pages, Cloudflare Pages…). Ensuite, sur le téléphone, ouvrir l'adresse puis faire « Ajouter à l'écran d'accueil ». L'appli fonctionne ensuite hors connexion.

## Structure

- `js/data/` : contenu pédagogique (indonésien, anglais, jeux). C'est ici qu'on ajoute des leçons.
- `js/fsrs.js` : répétition espacée FSRS-4.5.
- `js/store.js` : sauvegarde locale (localStorage), XP, série, badges.
- `js/screens/` : écrans (accueil, leçons, flashcards, jeux, classe).
- `sw.js` : cache hors ligne. **Après une modification, changer `CACHE` (ex. `v2`) pour forcer la mise à jour.**

Technique : Preact + htm (API React), intégrés dans `js/vendor/`, sans étape de build.
