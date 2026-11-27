# Configurer Fluent30 — guide pas à pas (sans être développeuse)

Toutes les clés se renseignent **une seule fois, sur le serveur (Vercel)**. Elles ne sont jamais visibles dans
l'application, dans le navigateur ni dans le dépôt Git. Les utilisateurs n'ont jamais de clé à saisir.

## 1. Ce qui fonctionne déjà sans aucune clé

Cours A1→C1, fiches, 90 missions du monde, révisions (FSRS), flashcards, dictionnaire intégré de 3 000 mots
(traduction, définition, exemple), jeux, livres du domaine public, liseuse avec dictionnaire local, voix et
reconnaissance vocale de l'appareil, lecture de texte sur image sur l'appareil (Tesseract), mode hors ligne,
passeport, dressing, carte du monde, journal et souvenirs (sans la correction par l'IA).

Services gratuits utilisés automatiquement quand l'IA n'est pas disponible : traduction simple (MyMemory),
correction grammaticale simple (LanguageTool), images sous licence libre (Openverse), définitions (Wiktionary).

## 2. Tableau récapitulatif

| Fonctionnalité | État réel | Service | Variable | Coût estimé | Alternative gratuite |
|---|---|---|---|---|---|
| Cours, missions, révisions, jeux, livres, dictionnaire 3 000 mots | ✅ fonctionne, testé | aucun | — | 0 € | — |
| Voix (prononciation audio) | ✅ fonctionne (voix de l'appareil) | navigateur | — | 0 € | — |
| Reconnaissance vocale / retour de prononciation | ✅ Chrome, Edge, Safari | navigateur | — | 0 € | transcription OpenAI pour les autres navigateurs |
| Mode hors ligne + synchronisation au retour du réseau | ✅ testé hors connexion | — / Supabase | — | 0 € | — |
| Fiches de mots hors dictionnaire, classement par thème | ⏳ en attente de clé (testé : clé absente et clé invalide) | Anthropic | `ANTHROPIC_API_KEY` | ~0,0004 $ / mot (gratuit pour les 3 000 mots intégrés) | dictionnaire local + Wiktionary + MyMemory |
| Traduction en contexte (liseuse, traducteur) | ⏳ en attente de clé | Anthropic | `ANTHROPIC_API_KEY` | ~0,0003 $ / requête | MyMemory (traduction simple) |
| Correction grammaticale et explications | ⏳ en attente de clé | Anthropic | `ANTHROPIC_API_KEY` | ~0,0003 $ / texte | LanguageTool (correction simple) |
| Conversations avec l'IA et bilans | ⏳ en attente de clé | Anthropic | `ANTHROPIC_API_KEY` | ~0,0002 $ / réplique | aucune (dialogues préécrits des cours et missions) |
| My Real Life English (analyse, mini-leçon, situation) | ⏳ en attente de clé | Anthropic | `ANTHROPIC_API_KEY` | ~0,027 $ / analyse | lecture du texte sur l'appareil + traduction simple |
| Journal corrigé (3 versions) | ⏳ en attente de clé | Anthropic | `ANTHROPIC_API_KEY` | ~0,014 $ / page | LanguageTool |
| Memory Cards (analyse de photo) | ⏳ en attente de clé | Anthropic | `ANTHROPIC_API_KEY` | ~0,013 $ / photo | saisie manuelle des mots |
| Lecture de texte sur image (OCR) | ✅ sur l'appareil ; ⏳ version IA en attente de clé | Anthropic / Tesseract | `ANTHROPIC_API_KEY` | ~0,0005 $ / image | Tesseract.js (gratuit, privé) |
| Romans IA, évaluation de l'écrit (test CECRL) | ⏳ en attente de clé | Anthropic (modèle premium) | `ANTHROPIC_API_KEY` | ~0,04 $ (évaluation) à ~0,18 $ (chapitre de roman) | aucune |
| Illustrations du vocabulaire | ✅ images libres (Openverse) ; pictogramme IA avec clé Anthropic | Openverse / Anthropic | — | ~0,001 $ / pictogramme | Openverse |
| Images générées (option) | ⏸ désactivé par défaut | OpenAI | `OPENAI_API_KEY` + `FLUENT30_PAID_IMAGES=1` | ~0,04 $ / image | Openverse, pictogramme |
| Transcription audio serveur | ⏳ en attente de clé (facultatif) | OpenAI | `OPENAI_API_KEY` | ~0,003 $ / minute | reconnaissance vocale du navigateur |
| Comptes, sauvegarde cloud, statistiques fiables, cache partagé | ⏳ en attente de configuration (facultatif mais conseillé) | Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | gratuit jusqu'à 500 Mo, puis 25 $/mois | données sur l'appareil + export |
| Tableau de bord administrateur | ✅ testé | — | `FLUENT30_ADMIN_TOKEN` | 0 € | — |
| Plafonds et alertes de dépenses | ✅ testé (quota, clé invalide) | — | `FLUENT30_MONTHLY_BUDGET_USD`, `FLUENT30_ALERT_WEBHOOK_URL` | 0 € | — |

Les montants sont des estimations à partir des tarifs publics (novembre 2026) : Claude Haiku 5.5 0,10 $/0,50 $,
Sonnet 5.5 2 $/10 $, Opus 5.5 4 $/20 $ par million de jetons (entrée/sortie). Vérifie-les sur la page de tarifs d'Anthropic.

## 3. Obtenir la clé Anthropic (la seule vraiment importante)

1. Va sur **https://console.anthropic.com** et crée un compte (e-mail + mot de passe).
2. Menu **Billing / Facturation** : ajoute un moyen de paiement et achète des crédits (10 $ suffisent pour démarrer).
3. Toujours dans la console, règle une **limite de dépense mensuelle** (Limits) : c'est une sécurité supplémentaire.
4. Menu **API Keys** → **Create Key** → nomme-la « fluent30 » → **copie la clé** (elle commence par `sk-ant-`).
   Elle ne s'affiche qu'une fois : colle-la tout de suite à l'étape 6.

## 4. (Facultatif) Supabase : comptes et sauvegarde

1. **https://supabase.com** → New project (gratuit).
2. Dans le projet : **SQL Editor** → colle le contenu du fichier `supabase/schema.sql` → **Run**.
3. **Project Settings → API** : copie l'**URL**, la clé **anon public** et la clé **service_role** (secrète).

## 5. (Facultatif) OpenAI

Seulement si tu veux des images générées sur mesure ou la transcription pour les navigateurs sans reconnaissance
vocale : **https://platform.openai.com/api-keys** → Create new secret key.

## 6. Renseigner les clés dans Vercel

1. Ouvre **https://vercel.com** → ton projet **fluent30** → **Settings** → **Environment Variables**.
2. Pour chaque ligne ci-dessous : **Key** = le nom, **Value** = la valeur, coche **Production** (et Preview), **Save**.

| Nom | Valeur | Obligatoire ? |
|---|---|---|
| `ANTHROPIC_API_KEY` | ta clé `sk-ant-…` | oui pour les fonctions IA |
| `FLUENT30_ADMIN_TOKEN` | un long mot de passe inventé (20 caractères ou plus) | oui pour l'espace admin |
| `FLUENT30_MONTHLY_BUDGET_USD` | par ex. `50` (plafond global, bloque les appels payants à 100 %) | conseillé |
| `FLUENT30_ALERT_WEBHOOK_URL` | adresse d'un webhook Slack/Discord/ntfy pour les alertes 50/80/100 % | facultatif |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | valeurs Supabase | facultatif |
| `OPENAI_API_KEY` | clé OpenAI | facultatif |
| `MYMEMORY_EMAIL` | ton e-mail (quota gratuit ×10) | conseillé |

3. Onglet **Deployments** → sur le dernier déploiement, menu **⋯** → **Redeploy**. Les clés sont prises en compte
   après ce redéploiement (2–3 minutes).
4. Vérifie : ouvre `https://<ton-site>/admin`, saisis ton `FLUENT30_ADMIN_TOKEN`, puis **Tester** sur chaque service.

Toutes les autres variables (modèles par tâche, quotas, plafonds par utilisateur) ont des valeurs par défaut
économiques ; elles sont décrites dans `.env.example`.

## 7. Coûts simulés (voir aussi /admin → Simulation)

Hypothèses : 60 % d'utilisateurs occasionnels, 30 % réguliers, 10 % intensifs ; 50 % des requêtes génériques
servies par le cache partagé ; 70 % des illustrations trouvées gratuitement ; plafond de 0,80 $ par utilisateur et par mois.

| Profil | Coût IA / mois |
|---|---|
| Occasionnel (≈ 100 actions IA/mois) | ≈ 0,09 € |
| Régulier (≈ 450 actions IA/mois) | ≈ 0,56 € |
| Intensif (≈ 1 500 actions IA/mois) | ≈ 2,40 € sans plafond → 0,74 € avec plafond |

| Utilisateurs actifs | Avec plafond par utilisateur | Sans plafond |
|---|---|---|
| 100 | ≈ 30 € / mois | ≈ 47 € / mois |
| 1 000 | ≈ 300 € / mois | ≈ 465 € / mois |
| 10 000 | ≈ 3 000 € / mois | ≈ 4 650 € / mois |
| 100 000 | ≈ 30 000 € / mois | ≈ 46 500 € / mois |

Soit **≈ 0,30 € par utilisateur actif et par mois** avec les réglages par défaut (objectif < 0,50 € atteint),
≈ 0,47 € sans aucun plafond. Hors hébergement (Vercel, Supabase). Ces chiffres sont des simulations :
les coûts réels s'affichent dans `/admin` dès que l'application est utilisée.
