# SESSION_CONTEXT - Planningo (etat global du projet)

Ce document doit permettre a une personne externe de comprendre rapidement:

- ce que fait le projet aujourd hui,
- ce qui est deja en production sur `main`,
- ce qui est en preparation pour une version "officielle entreprise",
- et ce qui reste a faire.

Derniere mise a jour: 2026-02-12

## 1) Resume executif

Planningo est une PWA mobile-first de gestion de planning chauffeur bus, offline-first, sans backend obligatoire.
L app est deja utilisable en conditions reelles par des chauffeurs.

Etat actuel:

- `main` = branche stable utilisateurs (GitHub Pages).
- `enterprise-ready` = branche isolee pour preparer un raccordement SI entreprise sans impacter les utilisateurs actuels.

Objectif court terme:

- laisser vivre la version stable actuelle.

Objectif moyen terme:

- etre pret a brancher le SI entreprise (planning auto, echanges serveurs, multi-utilisateurs) avec bascule progressive.

## 2) Contexte metier

Probleme resolu:

- consultation et saisie de planning sur smartphone, meme sans reseau.

Contraintes terrain:

- usage mobile prioritaire,
- besoin de rapidite/lisibilite,
- connexions instables,
- fiabilite locale indispensable.

Positionnement actuel:

- outil personnel metier,
- pas encore officiellement branche au SI entreprise.

## 3) Etat Git / branches

Branche active attendue pour le produit live:

- `main` (HEAD recemment observe: `9e42a7b`)

Branche preparation entreprise:

- `enterprise-ready` (HEAD recemment observe: `8162f50`)
- commit cle: "Scaffold enterprise-ready flags and planning provider adapter"

Autres branches vues dans le repo:

- `feature/exchanges` (travaux echanges),
- `avancement`, `principal`, etc. (historique de travail).

Regle de travail:

- aucune evolution entreprise ne doit casser `main`,
- les changements SI doivent etre testes et isoles sur `enterprise-ready`.

## 4) Architecture (vue simple)

Stack:

- HTML/CSS/JS vanilla (pas de framework externe),
- IndexedDB + LocalStorage,
- Service Worker (cache versionne),
- hebergement statique GitHub Pages.

Separation logique:

- `js/components/` = UI / rendu,
- `js/domain/` = regles metier pures,
- `js/data/` = acces donnees (storage/API clients),
- `js/state/` = etat applicatif,
- `js/adapters/` = abstraction de provider (en preparation enterprise),
- `tests/` = suites domaine + echange + UI/PWA smoke.

## 5) Fonctionnalites importantes deja implementees

### 5.1 Planning (coeur app)

- Vue "Mon planning" (home) avec calendrier mois + infos du jour.
- Saisie guidee mois ("Saisie guidee") avec suggestions intelligentes (types/lignes/TAD/formation/repos).
- Edition d un jour ("Modifier le jour") avec UI refondue.
- Consultation date.
- Vue statistiques/recapitulatif.
- Gestion conges et periode saisonniere.
- Export / import complet des donnees (changement de telephone).

### 5.2 Edition d un jour (comportements metier en place)

- Champ service code.
- Toggle panier avec override possible:
  - si service a panier par defaut: ON initial,
  - si service sans panier: OFF initial,
  - mais utilisateur peut forcer ON/OFF.
- Heures supplementaires:
  - un seul bloc UI,
  - type choisi (majorees / non majorees),
  - saisie en minutes.
- Heures non effectuees deduites:
  - saisie en minutes,
  - deduction du total heures travaillees recap.
- Service FORMATION:
  - en saisie guidee: base 7h00,
  - modifiable ensuite via "Modifier le jour".
- Regle conges:
  - un jour conges ne doit pas recevoir panier/heures sup/options incompatibles.

### 5.3 Recapitulatif / statistiques

Totaux calcules avec:

- jours travailles,
- paniers,
- jours repos,
- jours conges,
- total heures travaillees.

Regles heures:

- heures supplementaires majorees: comptent dans "heures supplementaires" + total heures travaillees.
- heures supplementaires non majorees: comptent dans le total heures travaillees.
- heures non effectuees deduites: retirees du total heures travaillees.

### 5.4 Alerte repos legal (11h)

Regle:

- warning si repos entre fin service jour A et debut service jour B < 11h.

Ou visible:

- en saisie guidee (warning persistant),
- sur home (indicateur visuel sur service du jour illegal).

But:

- rendre visible un cas interdit legalement.

### 5.5 Reveil intelligent (Android opt-in)

Feature gate utilisateur:

- `alarm_sync_enabled` (opt-in explicite).
- par defaut: nouveaux users non forces a utiliser la synchro reveil.
- anciens users avec traces d usage reveil: migration douce vers active.

Fonctions:

- regler avance en minutes (pas de 2 minutes),
- importer plan alarmes vers app reveil (APK),
- verifier prochaine alarme,
- diagnostic environnement,
- sections UI repliables (installation / verifications).

Regles eligibilite reveil:

- DM,
- codes numeriques impairs (>= 3 chiffres),
- TAD matin explicitement pris en charge: TAD 1, TAD 3, TAD 5.
- DAM exclu.

### 5.6 Onboarding (tour 5 etapes)

Etat actuel:

- onboarding persistant (seen flag),
- "Passer" ferme et redirige vers saisie guidee,
- fin "Terminer" redirige vers saisie guidee,
- body lock pendant onboarding,
- spotlight visuel sur etape saisie guidee,
- copy orientee action pour 5 ecrans:
  - Saisie guidee,
  - Mon planning,
  - Modifier un jour,
  - Conges & periode,
  - Changement de telephone.

### 5.7 Changement de telephone

Vue dediee:

- bloc "Ancien telephone" -> sauvegarder mes donnees,
- bloc "Nouveau telephone" -> restaurer mes donnees.

Objectif:

- continuite utilisateur sans perte planning.

### 5.8 Suggestions / ameliorations

- vue feedback avec message clair pour joindre une capture en cas de bug visuel.

## 6) Module Echanges (etat reel)

Important:

- module deja construit en partie avancee cote client.

Ce qui existe:

- route `exchanges`,
- UI demandes / conversations / thread,
- etats auth/requests/conversations/messages,
- clients HTTP prets (`js/data/exchange/*`),
- regles domaine echanges + tests,
- spec API/BDD de reference (`docs/exchanges-api-v1.md`).

Ce qui manque pour production reelle:

- backend live (auth/session/messages/persistence),
- integration securite SI (auth, depot, gouvernance),
- tests E2E multi-utilisateurs avec environnement reel.

Visibilite en production actuelle:

- UI echanges desactivee hors localhost.
- flag local: `ff_exchanges_ui`.

## 7) Enterprise-ready (preparation deja commencee)

Branche dediee:

- `enterprise-ready` (isolee de `main`).

Elements ajoutes:

- `js/state/enterprise-flags.js`
- `js/adapters/planning-provider.js`
- tests associes:
  - `tests/domain/enterprise-flags.test.js`
  - `tests/domain/planning-provider.test.js`
- plan: `docs/ENTERPRISE_READY_PLAN.md`

Principe:

- mode `local` par defaut,
- bascule enterprise uniquement via flags explicites,
- aucun impact tant que flags inactifs.

## 8) PWA, cache et icones

Etat actuel:

- manifest sur icones v5 (`icon-192-v5.png`, `icon-512-v5.png`, plus `apple-touch icon-180-v5.png`),
- service worker versionne via placeholder `__APP_VERSION__`,
- nettoyage des anciens caches a l activation,
- banniere MAJ geree cote app + SW handshake.

Point de vigilance normal:

- une icone d ecran d accueil peut rester ancienne tant que l utilisateur ne reinstalle pas le raccourci (comportement OS/PWA connu).

## 9) Stockage et migrations

Stockage local:

- IndexedDB `planningDB`, version 5, stores:
  - `planning`,
  - `services`,
  - `config`.

Retention:

- conservation max 36 mois planning.

Migration notable:

- conversion legacy vers `FORMATION` idempotente + retry safe.

## 10) Qualite, tests et garde-fous

Commande standard qualite:

- `powershell -ExecutionPolicy Bypass -File ./scripts/check-quality.ps1`

Cette commande execute:

- verification syntaxe JS (`node --check`),
- tests domaine (`tests/run-domain-tests.js`),
- tests UI/PWA smoke (`tests/run-ui-pwa-tests.js`),
- scan anti-patterns + marqueurs conflit.

Suites presentes:

- domaine planning/conges/periodes/jour/alarme,
- domaine et etat module echange,
- route guard echanges,
- smoke UI/PWA.

## 11) Ecarts doc / code a connaitre

Des documents legacy mentionnent encore un ancien flux "activation par code":

- `README.md`,
- `docs/ACTIVATION.md`,
- `docs/SAUVEGARDE_RESTAURATION.md` (partiellement),
- references secondaires.

Etat reel du runtime actuel:

- aucun module activation trouve dans `js/`.

Action conseillee (non bloquante):

- faire un nettoyage documentaire pour aligner 100% docs et code.

## 12) Deploiement actuel et strategie domaine

Production actuelle:

- GitHub Pages (utilisateurs existants et nouveaux).

Domaine reserve:

- `planningo.fr` (Gandi), reserve pour phase officielle.

Strategie validee:

- ne pas basculer le trafic actuel vers le domaine officiel tant que le raccordement SI n est pas valide.

## 13) Ce qui est en attente (backlog realiste)

Priorite haute (si passage officiel):

1. Backend enterprise sandbox + endpoints planning/echanges.
2. Authentification et autorisations SI.
3. Jeux de donnees de test (ou generateur) multi-utilisateurs.
4. Tests E2E integration (planning reel, echanges, conflits, droits).
5. Monitoring erreurs et observabilite minimale production officielle.

Priorite moyenne:

1. Nettoyage docs legacy activation.
2. Durcir encore tests UI sur parcours complets mobile.
3. Clarifier politique de rollback de version en prod.

## 14) Donnees a demander a l entreprise le jour J

Minimum pour brancher:

- URL/API sandbox + prod,
- specification endpoint planning (lecture + eventuels updates),
- specification endpoint echanges (workflow complet),
- mode auth (SSO, OAuth2, token, etc.),
- perimetre depot/roles/droits,
- contraintes RGPD et retention,
- referent SI (technique + metier),
- jeu de donnees test ou acces environnement preprod.

## 15) Checklist reprise de session (obligatoire)

1. Verifier branche active:
   - `git branch --show-current`
2. Verifier etat local:
   - `git status --short`
3. Lancer check qualite:
   - `powershell -ExecutionPolicy Bypass -File ./scripts/check-quality.ps1`
4. Lire ce fichier entierement.
5. Confirmer objectif session (`main` stable ou `enterprise-ready` preparation).

## 16) Regles de non regression projet

- Ne jamais casser le flux local offline de `main`.
- Ne jamais activer des features enterprise par defaut.
- Conserver compatibilite donnees utilisateur existantes.
- Eviter toute logique metier dans le service worker.
- Toute evolution critique doit passer par tests + check qualite avant push.

## 17) Evaluation synthetique actuelle (etat percu)

Niveau global actuel:

- produit personnel robuste et credibilite elevee pour discussion entreprise,
- architecture claire et deja separable pour industrialisation,
- module echanges bien avance cote client/spec mais pas encore "prod enterprise".

En bref:

- `main` est exploitable et stable pour usage perso/collegues,
- `enterprise-ready` est le bon point de depart pour officialisation future.
