# ARCHITECTURE — Planning PWA Chauffeurs

---

## Outil interne — Générateur d’activation

Un outil interne est intégré au dépôt pour générer les codes d’activation
par appareil.

### Emplacement

tools/generator-activation/

### Caractéristiques

- Usage développeur uniquement
- Aucune dépendance fonctionnelle avec l’application principale
- PWA installable indépendamment
- Fonctionne hors ligne
- Service Worker isolé (scope propre)
- Aucune donnée utilisateur
- Aucun impact sur les utilisateurs existants

### Règles

- Ne doit jamais être lié depuis l’interface utilisateur
- Ne dépend pas de l’application principale
- Partage uniquement un **module pur commun** servant de **source unique de vérité algorithmique**
- Aucun couplage UI, stockage ou runtime avec l’application
- Ne doit contenir aucune logique métier Planning
- Peut évoluer indépendamment

### Accès (GitHub Pages)

---

## 1. Vue d’ensemble

Application web **PWA offline-first** destinée à la consultation et à la saisie de planning en usage mobile.

Contraintes structurantes :

- Usage smartphone prioritaire
- Réseau absent ou instable
- Démarrage rapide
- Fonctionnement 100 % hors ligne
- Aucune authentification
- Aucune donnée serveur

Technologies utilisées :

- HTML / CSS / JavaScript vanilla
- IndexedDB + LocalStorage
- Service Worker avec cache versionné
- Hébergement statique (GitHub Pages)
- Router interne par masquage DOM

---

## 2. Arborescence du projet

index.html  
service-worker.js  
manifest.webmanifest

css/  
&nbsp;&nbsp;style.css  
&nbsp;&nbsp;tetribus.css

js/  
&nbsp;&nbsp;app.js  
&nbsp;&nbsp;router.js  
&nbsp;&nbsp;utils.js

&nbsp;&nbsp;components/  
&nbsp;&nbsp;&nbsp;&nbsp;activationScreen.js  
&nbsp;&nbsp;&nbsp;&nbsp;home.js  
&nbsp;&nbsp;&nbsp;&nbsp;month.js  
&nbsp;&nbsp;&nbsp;&nbsp;guided-month.js  
&nbsp;&nbsp;&nbsp;&nbsp;tetribus.js  
&nbsp;&nbsp;&nbsp;&nbsp;menu.js

&nbsp;&nbsp;domain/  
&nbsp;&nbsp;&nbsp;&nbsp;activation.js  
&nbsp;&nbsp;&nbsp;&nbsp;conges.js  
&nbsp;&nbsp;&nbsp;&nbsp;periods.js  
&nbsp;&nbsp;&nbsp;&nbsp;services-availability.js  
&nbsp;&nbsp;&nbsp;&nbsp;services-grouping.js

&nbsp;&nbsp;data/  
&nbsp;&nbsp;&nbsp;&nbsp;db.js  
&nbsp;&nbsp;&nbsp;&nbsp;storage.js  
&nbsp;&nbsp;&nbsp;&nbsp;device.js  
&nbsp;&nbsp;&nbsp;&nbsp;export-db.js  
&nbsp;&nbsp;&nbsp;&nbsp;import-db.js  
&nbsp;&nbsp;&nbsp;&nbsp;services.js  
&nbsp;&nbsp;&nbsp;&nbsp;services-init.js  
&nbsp;&nbsp;&nbsp;&nbsp;services-catalog.js

&nbsp;&nbsp;sw/  
&nbsp;&nbsp;&nbsp;&nbsp;sw-register.js

&nbsp;&nbsp;games/  
&nbsp;&nbsp;&nbsp;&nbsp;tetribus/  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tetribus.game.js  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tetribus.render.js

docs/  
&nbsp;&nbsp;ACTIVATION.md  
&nbsp;&nbsp;SAUVEGARDE_RESTAURATION.md  
&nbsp;&nbsp;SERVICE_WORKER.md  
&nbsp;&nbsp;CONTEXTE_METIER.md

---

## 3. Initialisation de l’application

`app.js` orchestre l’ordre d’exécution.

Ordre strict :

1. Lecture de l’état applicatif depuis les données locales :
   - `config.activation_ok`
   - `config.imported_ok`
2. Si l’application n’est ni activée **ni restaurée par import** :
   - affichage exclusif de l’écran d’activation
   - aucune autre initialisation
3. Si l’application est activée **ou** restaurée par import :
   - initialisation du menu
   - affichage de la vue d’accueil
4. Tâches non bloquantes :
   - initialisation des services
   - enregistrement du Service Worker
   - surveillance des mises à jour

Aucune vue métier n’est accessible tant que l’état applicatif n’est pas valide.

---

## 4. Activation

L’activation est **locale, hors ligne et sans serveur**.

- Interface : `components/activationScreen.js`
- Logique : `domain/activation.js`
- Identifiant appareil : `data/device.js`
- Persistance : IndexedDB (`config.activation_ok`)

Caractéristiques :

- Une activation initiale par appareil, restaurable par import de données
- Aucun compte utilisateur
- Aucun échange réseau
- Activation restaurable via import des données

Détails fonctionnels : `docs/ACTIVATION.md`

### Règle post-import

Lorsqu’une restauration de données est effectuée :

- l’état applicatif est considéré comme valide,
- l’écran d’activation ne doit plus jamais apparaître,
- aucun code d’activation n’est redemandé,
- le Device ID n’intervient plus dans le flux utilisateur,
- l’application démarre immédiatement en mode normal.

L’import de données est prioritaire sur toute règle d’activation.

### Règle d’activation

Le code d’activation est calculé selon la règle suivante :

SHA-256("PLANNING_PWA_SECRET_V1:DEVICE_ID").slice(0, 12)

- La règle d’activation est définie dans un **module pur partagé** :
  `tools/activation-algo.js`
- Ce module constitue la **source unique de vérité**
- L’adaptateur web consomme cette règle
- Le domain peut la consommer si nécessaire, sans jamais la redéfinir
- Les utilisateurs déjà activés ne sont jamais réévalués

**Principe clé**

- Toute évolution de la règle d’activation doit être effectuée **exclusivement** dans  
  `tools/activation-algo.js`
- Aucune autre implémentation ne doit exister

---

## 5. Navigation et vues

Le routing est interne et sans framework.

`router.js` :

- Une seule page HTML
- Vues sous forme de sections DOM
- Affichage par masquage / affichage
- Navigation déclenchée uniquement par le menu

Chaque vue est un module autonome dans `components/`.

❗ État actuel des vues

La vue "day" n’est plus exposée :

- aucune navigation active
- aucune section DOM correspondante
- aucun état dédié

Les vues actives sont :

- home (vue centrale)
- guided-month (saisie guidée)
- tetribus

---

## 6. Stockage des données

LocalStorage :

- États légers et transitoires uniquement

IndexedDB :

- Planning
- Services
- Configuration
- Activation
- Sauvegarde et restauration

Objectif : stockage structuré, durable et hors ligne.

state/
active-date.js # date active globale
ui-mode.js # mode consultation / saisie
month-navigation.js # mois courant affiché
month-calendar-state.js # état dérivé du calendrier mensuel

### Architecture de stockage

Le stockage est une couche d’adaptation plateforme.

- IndexedDB est l’implémentation **web actuelle**
- Le stockage fichier est une implémentation **future (logiciel desktop)**

Organisation :

- `js/data/db.js` : implémentation IndexedDB (web)
- `js/data/storage.interface.js` : contrat abstrait
- `js/data/storage.file.js` : implémentation fichier (mock, prête logiciel)

Le cœur métier (`domain/`) ne connaît **jamais** le mécanisme de stockage.

---

## 7. Logique métier

Séparation stricte :

- `domain/` : logique métier pure
- `data/` : accès et persistance des données
- `state/` : état global minimal partagé

Aucune logique métier n’est implémentée dans l’interface.

## 7bis. Frontières non négociables

Ces règles sont définitives et conditionnent toute évolution du projet.

### Domain (`js/domain/`)

- Ne dépend jamais :
  - du navigateur
  - du DOM
  - du Service Worker
  - du stockage (IndexedDB, LocalStorage, fichier, etc.)
- Ne lit aucune donnée persistée.
- Reçoit toutes les données nécessaires **par injection de paramètres**.
- Contient exclusivement :
  - les règles métier
  - la logique décisionnelle
  - des fonctions pures ou déterministes.

❌ Interdictions absolues :

- `getConfig` ou équivalent
- accès direct aux API navigateur
- logique implicite ou magique

---

## 8. Service Worker

Le Service Worker gère :

- la mise en cache complète de l’application,
- le fonctionnement hors ligne total,
- la gestion explicite des mises à jour.

Règle unique :

- la bannière de mise à jour s’affiche uniquement si `registration.waiting === true`.

Aucune décision de mise à jour n’est basée sur `APP_VERSION` côté interface.

Détails : `docs/SERVICE_WORKER.md`

Interdictions absolues :

- aucune logique de décision fonctionnelle
- aucune comparaison de versions côté UI
- aucun stockage d’état utilisateur
- aucune règle métier déguisée

Toute évolution fonctionnelle doit être implémentée exclusivement
dans `js/domain/`, jamais dans le Service Worker.

---

## 9. Séparation des responsabilités

components : interface utilisateur  
domain : logique métier  
data : persistance et accès aux données  
state : état global minimal  
sw : cycle de vie PWA  
games : module isolé  
css : présentation visuelle

## Priorité de l’import sur l’activation

L’import de données constitue une restauration complète de l’état applicatif.

À ce titre :

- il remplace toute activation manuelle,
- il neutralise définitivement l’écran d’activation,
- il est indépendant :
  - de l’appareil,
  - du navigateur,
  - du domaine,
  - de l’installation PWA.

Ce comportement est contractuel et ne doit jamais être contourné par l’interface ou le Service Worker.

---

## 10. Principes de conception

- Aucun framework
- Aucune dépendance externe
- Offline-first réel
- Données locales uniquement
- Comportement déterministe
- Code lisible et structuré
