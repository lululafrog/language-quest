# Fluent30 — coach d'anglais pour francophones

Application web mobile-first (PWA installable) pour apprendre l'anglais avec la méthode **70/30** :
70 % de vocabulaire fréquent, de verbes essentiels et de structures indispensables, 30 % de contenu personnalisé
(centres d'intérêt, lectures, conversations). Elle s'appuie sur la mémoire visuelle, la répétition espacée (FSRS),
la lecture interactive et la pratique quotidienne.

## Démarrer

```bash
cd fluent30
npm install
cp .env.example .env.local   # puis renseigner les clés voulues (toutes facultatives)
npm run dev                  # http://localhost:3000
```

Production : `npm run build && npm start`. Vérifications : `npm run typecheck`, `npm run lint`, `npm test`.

## Ce qui fonctionne sans clé, et ce qui en nécessite une

L'application est **utilisable sans aucune clé** : les données sont stockées sur l'appareil (IndexedDB) et
tout ce qui suit fonctionne hors connexion une fois les pages visitées.

| Fonction | Service | Clé nécessaire |
| --- | --- | --- |
| Espace vocabulaire `/vocab` : ≈ 10 000 entrées A1→C1 (mots, phrasal verbs, expressions, connecteurs, faux amis, UK/US…), 20 univers et ≈ 230 sous-thèmes, carte mentale interactive, univers illustrés, bibliothèque, jardin de mots, collections, flashcards (7 formats, FSRS), statistiques, tests | local | aucune |
| Jeux de vocabulaire intelligents (24 jeux, modes « nouveaux mots » / « réviser », niveau réel A1→C1, répétition espacée, tableau de bord `/games/progress`) — moteur central `src/lib/vocab/` | local | aucune |
| 20 mini-jeux, verbes essentiels (38 verbes), 33 leçons de grammaire | local | aucune |
| Liseuse, import EPUB / PDF / TXT, 12 histoires graduées A1–C2 | local | aucune |
| Synthèse vocale (accents selon l'appareil), reconnaissance vocale | navigateur (Web Speech) | aucune — Chrome, Edge, Safari |
| Phonétique, définitions, audio UK/US dans la liseuse | dictionaryapi.dev (Wiktionary) | aucune (internet) |
| Catalogue Project Gutenberg | gutendex.com + gutenberg.org | aucune (internet) |
| Enrichissement automatique, classement par thème, traduction en contexte, conversation IA, rapport, assistant de traduction, correction, OCR de captures, paliers 3 000+ | Anthropic Claude | `ANTHROPIC_API_KEY` |
| Illustrations mémorables | OpenAI Images (`gpt-image-1`) — à défaut, pictogrammes SVG dessinés par Claude | `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` |
| Transcription audio côté serveur (navigateurs sans Web Speech) | OpenAI | `OPENAI_API_KEY` |
| Compte, sauvegarde cloud, synchronisation multi-appareils | Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Quand un service manque, l'interface le dit clairement (« nécessite une clé API ») : aucune réponse n'est simulée.
L'état des services est visible dans **Réglages → Services externes** (`GET /api/status`).

### Supabase (facultatif)

1. Créer un projet Supabase, exécuter `supabase/schema.sql` dans l'éditeur SQL (table `fluent_rows` + RLS + bucket `illustrations`).
2. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Optionnel : `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement) pour partager le cache d'illustrations.
3. Lorsque Supabase est configuré, les routes IA exigent une session valide (jeton vérifié côté serveur).
   Sans Supabase, `FLUENT30_ACCESS_CODE` permet de protéger les routes payantes d'un déploiement public.

## Architecture

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4.** Les pages sont des composants client (application local-first) ; les clés API ne sont lues que dans les route handlers (`src/lib/server/*`, protégé par `server-only`).
- **Stockage local** : Dexie / IndexedDB (`src/lib/db.ts`). Chaque écriture horodate `updatedAt` ; les suppressions laissent une « pierre tombale » pour la synchronisation.
- **Synchronisation** (`src/lib/sync.ts`) : envoi/réception différentiels vers Supabase, dernier écrit gagnant, au démarrage, toutes les 2 min, au retour en ligne et à la mise en arrière-plan.
- **Répétition espacée** : `ts-fsrs` (FSRS), un état par carte **et par compétence** — reconnaissance (EN→FR), production (FR→EN), compréhension orale (audio→sens). File priorisée par retard relatif, oublis et utilité (rang de fréquence). Les jeux envoient des signaux légers (`gameSignal`) sans casser le planning.
- **IA** (`src/lib/server/ai.ts`) : SDK Anthropic, modèle `claude-opus-5-5` (modifiable via `FLUENT30_MODEL`), sorties structurées validées par Zod, effort faible pour les requêtes rapides, repli serveur automatique en cas de refus, cache de prompt. Limitation de débit par utilisateur/IP.
- **Coûts maîtrisés** : cache des réponses IA sur l'appareil (`cache`), illustrations mises en cache (mémoire serveur → Supabase Storage → IndexedDB) et générées en arrière-plan, une seule image par sens de mot.
- **PWA** : `src/app/manifest.ts`, `public/sw.js` (coque hors ligne, cache des pages et ressources statiques ; jamais les réponses d'API).

```
src/
  app/                 pages (dashboard, learn, review, cards, library, games, verbs, grammar, chat, listen,
                       translate, session, stats, tests, settings, onboarding) + api/ (routes serveur)
  components/          UI partagée (ui.tsx), AppShell, et composants par module (reader/, games/, grammar/…)
  hooks/               useSettings, useT (FR / immersion EN), useStatus, useOnline
  lib/                 db, srs, cards, learn, pool, progress, session, sync, speech, text, lexicon…
  lib/data/            contenus pédagogiques vérifiés (vocabulaire, verbes, grammaire, histoires, dialogues,
                       scénarios, banques de jeux et de tests) — voir lib/data/SOURCES.md
  lib/server/          configuration, garde d'accès, client IA (serveur uniquement)
supabase/schema.sql    schéma cloud + RLS
tests/                 tests automatisés (node:test via tsx)
```

## Modèle de données (IndexedDB, synchronisé)

| Table | Contenu |
| --- | --- |
| `settings` | préférences : objectif de mots/jour, durée de séance, accent, vitesse, immersion, thème, centres d'intérêt, mode de correction, lecture |
| `cards` | carte : terme, lemme (doublons et formes regroupées), type, traduction, définition, IPA UK/US, exemples, synonymes, antonymes, formes, thèmes, difficulté, rang de fréquence, registre, illustration, source |
| `srs` | état FSRS par carte × compétence (échéance, stabilité, difficulté, répétitions, oublis) |
| `reviewLogs` | historique de chaque révision (note, temps de réponse, contexte) |
| `known` | mots déjà connus (test de niveau, « je connais déjà ») |
| `books` / `bookContent` | livres importés, Gutenberg et histoires graduées ; position et progression |
| `activity` | agrégats quotidiens : temps, nouveaux mots, révisions, réussite, jeux, lecture, messages, exercices |
| `mistakes` | erreurs récurrentes (vocabulaire, grammaire, conjugaison, prononciation) |
| `grammar` | progression par leçon |
| `games` | résultats des jeux et exercices d'écoute |
| `conversations` | conversations IA et leurs rapports |
| `images` | illustrations en cache (non synchronisées : régénérables) |
| `tests` | résultats des tests de niveau, hebdomadaires et mensuels |
| `sessions` | programme quotidien et étapes réalisées |

## Parcours utilisateur

1. **Accueil** → bannière d'accueil → *onboarding* (objectifs, centres d'intérêt, rythme) → test de niveau facultatif (oui/non avec pseudo-mots, vérification de traduction, grammaire) qui marque les mots déjà connus.
2. **Séance du jour** (5 à 60 min) générée selon les révisions dues, l'objectif de nouveaux mots, les erreurs de grammaire récurrentes et le livre en cours.
3. **Nouveaux mots** : 70 % mots fréquents par palier, 30 % liés aux centres d'intérêt ; présentation (audio, IPA, exemple, thème, illustration) puis vérification immédiate ; « je connais déjà » les écarte.
4. **Révisions** : carte recto/verso, 4 réponses (Oublié / Difficile / Bien / Facile) avec l'intervalle suivant affiché.
5. **Ajout intelligent** : mot anglais ou français, verbe, expression, phrase ou capture d'écran → enrichissement IA, aperçu modifiable, détection de doublons, thèmes automatiques modifiables (création de nouveaux thèmes).
6. **Lire** : histoires graduées, Gutenberg ou fichiers personnels ; chaque mot est cliquable (dictionnaire local → dictionnaire libre → traduction en contexte par l'IA) ; sélection d'expression, traduction de phrase, lecture audio avec surlignage.
7. **Pratiquer** : mini-jeux, verbes essentiels, grammaire (frises chronologiques), conversation IA (13 scénarios, 3 modes de correction, rapport ajoutable aux flashcards), écoute et prononciation, assistant de traduction.
8. **Statistiques et tests** : vocabulaire découvert / en cours / durable, compétences séparées, erreurs, thèmes, estimation CECRL prudente tirée par les compétences les plus faibles.

## Vie privée

- Données sur l'appareil par défaut ; cloud uniquement si l'utilisateur se connecte (RLS : chacun ne lit que ses lignes).
- Captures d'écran et enregistrements vocaux : transmis le temps du traitement, jamais stockés.
- **Réglages → Mes données** : export JSON, import, suppression des données locales et des données cloud.

## Droits d'auteur

Seuls des textes du domaine public (Project Gutenberg) ou écrits pour Fluent30 sont proposés. Les fichiers importés
restent sur l'appareil de l'utilisateur. Listes de fréquence : NGSL / NGSL-Spoken (CC BY-SA 4.0) ; dictionnaire : Wiktionary (CC BY-SA) via dictionaryapi.dev.

## Tests réalisés

- `npm test` : intégrité des contenus (rangs, doublons, thèmes, verbes requis, réponses des exercices), lemmatisation, vérification des réponses, similarité vocale, assainissement SVG, comportement FSRS, conversion des schémas IA.
- Parcours de bout en bout dans Chromium (profil iPhone 13) : onboarding → nouveaux mots → révisions → ajout manuel → liseuse → jeu → grammaire → statistiques → séance → test hebdomadaire → mode sombre et immersion → export ; 23 routes chargées sans erreur.
- Routes IA sans clé : réponse 503 explicite ; JSON invalide : 400.

**Non testé en conditions réelles dans l'environnement de développement** (accès réseau bloqué ou clés absentes) :
appels Claude et OpenAI, Supabase, catalogue Gutenberg et dictionnaire libre. Le code gère ces cas avec des
messages d'erreur clairs, mais un essai avec de vraies clés est recommandé avant mise en production.

## Bibliothèque v2, bases et récompenses (ajouts)

- **Bibliothèque du voyageur** : 141 classiques du domaine public (droits vérifiés USA + France/UE) intégrés à l'appli
  (`public/books`, régénérables avec `scripts/build_library.py`), 8 catégories, couvertures originales SVG, résumés sans
  spoiler, % de vocabulaire déjà connu, recommandations, liste d'envies, notes.
- **Liseuse** : modes immersif / assisté / bilingue, couleur d'utilité des mots (vert/bleu/orange/gris), traduction de
  paragraphe, livre audio (voix de l'appareil), shadowing, écoute seule, séance de fin de chapitre.
- **Récompenses** : cérémonie de fin de livre, étagères de collection, cartes de lecture, 16 trophées, objectifs
  hebdo/mensuels (sans culpabilisation), tenues littéraires. Animations désactivables (Réglages → Réduire les animations).
- **Les bases** (13 leçons illustrées) et **Cours** (20 fiches de règles, contenu original).

Nécessitent `ANTHROPIC_API_KEY` (sinon un message l'indique, rien n'est simulé) : romans personnalisés, versions A1–C1
des livres, discussion avec les personnages, traduction bilingue complète d'un chapitre, quiz de compréhension générés.
Sans clé, la traduction mot/paragraphe utilise MyMemory (gratuit, quota quotidien limité).

## Refonte : parcours A1 → C1 et navigation en 5 onglets

- **Navigation** : Accueil · Cours · Livres · Pratique · Profil (voir `AUDIT.md` pour la carte complète des écrans).
- **Cours** (`src/lib/curriculum/`) : 48 micro-leçons A1 → C1 + 15 modules « Vie réelle », 739 exercices, contenu original.
  Chaque leçon suit la même structure (objectif, explication courte, règle, tableau, exemples audio, pièges des
  francophones, astuce, exercices progressifs avec « Pourquoi ? », situation réelle, résumé) et est replanifiée
  avec FSRS (`db.lessons`, migration Dexie v4 sans perte de données). Lecteur : `src/app/cours/[id]`.
- **Fiches de révision** : 37 fiches + recherche globale (cours, fiches, grammaire, verbes, expressions, tes cartes).
- **Programme du jour** 5/10/15/20/30 min adaptatif (`buildDailyPlan` dans `src/lib/session.ts`), notions faibles
  (`src/lib/connect.ts`) reliées aux jeux, révisions et cours.
- **Passeport** : 20 destinations, tampons gagnés sur de vrais progrès, jamais retirés (`/profile/passport`).
- **Onboarding** en 7 étapes (niveau, objectifs, temps, mots/jour, intérêts, avatar), modifiable à tout moment ;
  le test CECRL complet peut placer le parcours au bon niveau.
- Limites : la note de prononciation dépend de la reconnaissance vocale du navigateur (indicative) ; la conversation
  IA liée à chaque situation nécessite `ANTHROPIC_API_KEY`.

## Aventure : vraie vie, souvenirs, monde (phases 2 et 3)

| Fonction | Où | Service externe |
| --- | --- | --- |
| **My Real Life English** : texte, capture, photo de menu/panneau, message vocal, réplique de film, passage de livre, phrase française → traduction, expressions, registre, réponses, mini-leçon, situation | Pratique → Ta vraie vie, bouton sur l'accueil, partage depuis une autre app (PWA installée) | `ANTHROPIC_API_KEY` ; vocal : `OPENAI_API_KEY` |
| **Memory Cards** : photo personnelle → vocabulaire et phrases, cartes illustrées par ta photo, album | Pratique → Memory Cards | `ANTHROPIC_API_KEY` (illustration facultative : `OPENAI_API_KEY`) |
| **Journal My English Journey** : version corrigée + version naturelle expliquées, erreurs récurrentes → cours, bilan oral mensuel | Pratique → Journal | `ANTHROPIC_API_KEY` |
| **Carte mentale** du vocabulaire (découvert / reconnu / employé / oublié, calculé sur les vraies révisions FSRS) | Pratique → Carte mentale | aucune |
| **Carte du monde** : Londres, New York, Bali, Sydney, Tokyo, Toronto — 26 missions, déblocage par compétences (cours, niveau ou visa) | Mon univers → Carte du monde | aucune |
| **Avatar** (morphologies, visages, expressions, animations) et **dressing** (22 catégories, 12 collections, objets exclusifs gagnés, 5 tenues favorites) | Mon univers → Dressing | aucune |

**Confidentialité** : photos et enregistrements restent sur l'appareil (table locale `media`, jamais synchronisée).
Consentement demandé avant tout envoi à l'IA, révocable (Paramètres → Contenus personnels). Les textes personnels
ne sont sauvegardés dans le compte que sur option. Rien n'est conservé côté serveur ni utilisé pour entraîner un modèle.

**Coûts** : quotas IA quotidiens par fonctionnalité (`src/lib/plan.ts`, surchargeables par variables d'environnement),
journal de consommation approximative `[ai-usage]` dans les logs serveur, cache des analyses sur l'appareil.
Le plan premium est préparé mais **aucun paiement n'est activé**.

## Configuration des services

Toutes les clés sont lues **uniquement par le serveur** (`src/lib/server/*`, protégé par `server-only`) : elles ne
sont jamais envoyées au navigateur ni écrites dans les journaux (seuls les 4 derniers caractères apparaissent dans
l'espace administrateur). Les utilisateurs n'ont jamais de clé à saisir. Liste complète et commentée : `.env.example`.

| Service | Variables | Indispensable ? | Ce que ça active |
| --- | --- | --- | --- |
| Anthropic Claude | `ANTHROPIC_API_KEY` (+ `FLUENT30_MODEL_FAST/STANDARD/PREMIUM`) | recommandé | toutes les fonctions intelligentes |
| OpenAI | `OPENAI_API_KEY` | non | illustrations générées, transcription serveur |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | recommandé en production | comptes, synchro, quotas et coûts fiables, cache partagé |
| Admin | `FLUENT30_ADMIN_TOKEN` ou `FLUENT30_ADMIN_EMAILS` | pour `/admin` | tableau de bord |
| Coûts | `FLUENT30_MONTHLY_BUDGET_USD`, `FLUENT30_USER_MONTHLY_BUDGET_USD`, `FLUENT30_ALERT_WEBHOOK_URL`… | conseillé | plafonds, alertes |
| Gratuits | — (`LANGUAGETOOL_URL` facultatif) | — | traduction simple, grammaire, dictionnaire, images libres, livres, voix |

**Architecture** : chaque route payante passe par `withAi(feature, req, handler)` (`src/lib/server/route.ts`) :
session ou code d'accès, limite par minute, taille de requête, quotas jour/mois, appels simultanés, puis exécution
dans un contexte qui choisit le modèle (`costs-core.ts` → `FEATURES`), vérifie les plafonds de dépenses, mesure les
vrais jetons de chaque réponse et enregistre le coût (`usage.ts`). Les erreurs sont traduites en messages simples
(`errors.ts`) ; le détail technique va dans le journal d'erreurs de l'administrateur.

**Routage des modèles** : Haiku 5.5 pour les tâches simples et fréquentes, Sonnet 5.5 pour les analyses personnelles,
Opus 5.5 seulement pour les romans et l'évaluation écrite. Les réponses génériques (fiche d'un mot, mot dans une
phrase, explication d'un texte, traduction ou adaptation d'un livre du domaine public) sont mises en **cache partagé**
(`cache.ts`, table `shared_ai_cache`) ; les contenus personnels (journal, captures, photos, conversations, cartes
postales, évaluations) ne le sont jamais.

**Stockage des statistiques** : avec `SUPABASE_SERVICE_ROLE_KEY`, dans les tables `ai_usage_daily`, `ai_error_log`,
`ai_budget_alerts` (accès serveur uniquement, identifiants pseudonymisés) ; sans elle, en mémoire (remis à zéro à
chaque déploiement — les quotas sont alors approximatifs sur Vercel).

**Simulation des coûts** : `simulateCosts()` / `simulatePopulation()` dans `src/lib/costs-sim.ts`.
