# Audit UX/UI et architecture cible (refonte « parcours pédagogique »)

## Constat (avant refonte)

- **47 écrans**, navigation à 5 onglets (Accueil, Réviser, Lire, Pratiquer, Plus) + 25 entrées dans la barre latérale.
- **Doublons pédagogiques** : la grammaire est dispersée entre `/grammar` (33 leçons), `/courses` (20 fiches), `/basics`
  (13 leçons), `/verbs`, `/verbs/irregular`, `/pronunciation` ; aucun parcours unique par niveau.
- **Deux « programmes du jour »** : la carte Séance de l'accueil et `/session`.
- **« Plus »** sert de fourre-tout (cartes, stats, réglages, boutique, tests, thèmes…).
- **Accueil surchargé** : 10 blocs (héros, bases, autour de moi, bienvenue, séance, quêtes, objectifs, tuiles, erreurs, lecture).
- **Incohérences visuelles** : dégradés différents sur chaque tuile, emojis utilisés comme icônes, plusieurs styles de
  cartes et de titres, contrastes inégaux.
- **Fonctionnalités isolées** : une erreur dans un jeu ne renvoie à aucun cours ; les leçons ne programment pas de révision.

## Architecture cible : 5 onglets

| Onglet | Contenu | Écrans |
| --- | --- | --- |
| **Accueil** | programme du jour (5–30 min), reprendre le cours, mots à réviser, reprendre la lecture, objectif du jour, semaine | `/` |
| **Cours** | parcours A1→C1, modules « vie réelle », fiches de révision + recherche, évaluations | `/cours`, `/cours/[id]`, `/cours/themes`, `/cours/fiches`, `/cours/fiches/[id]`, `/tests/*` (+ anciennes pages grammaire/verbes/bases/prononciation accessibles depuis les fiches) |
| **Livres** | librairie, lecture interactive, favoris, terminés, import, romans IA | `/library/*`, `/novels/*` |
| **Pratique** | flashcards & vocabulaire, jeux, écoute, prononciation, conversations, traducteur | `/practice`, `/review`, `/learn`, `/cards/*`, `/themes`, `/around`, `/games/*`, `/listen/*`, `/pronunciation/*`, `/chat/*`, `/translate` |
| **Profil** | avatar & dressing, passeport & récompenses, statistiques, objectifs, paramètres | `/profile`, `/shop`, `/profile/passport`, `/collection`, `/achievements`, `/stats`, `/settings` |

`/more` et `/session` redirigent vers `/profile` et `/`.

## Méthode pédagogique

Principes publics de Léa English (loi de Pareto appliquée aux langues, routine quotidienne courte, répétition espacée,
erreurs typiques des francophones, oser parler, objectif clair) — **contenu 100 % original**.
Chaque micro-leçon (5–10 min, ~30 % explication / 70 % pratique) suit la même structure en 12 parties :
objectif, explication, règle, tableau, exemples audio, erreurs fréquentes, astuce, exercices progressifs, mise en
situation, résumé, révision programmée (FSRS au niveau de la leçon).
