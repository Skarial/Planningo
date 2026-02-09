# ARCHITECTURE - Planningo

---

## 1. Vue d'ensemble

Application web PWA offline-first destinee a la consultation et a la saisie de planning en usage mobile.

Contraintes structurantes :

- Usage smartphone prioritaire
- Reseau absent ou instable
- Demarrage rapide
- Fonctionnement 100 % hors ligne
- Aucune authentification
- Aucune donnee serveur

Technologies utilisees :

- HTML / CSS / JavaScript vanilla
- IndexedDB + LocalStorage
- Service Worker avec cache versionne
- Hebergement statique (GitHub Pages)
- Router interne par masquage DOM

---

## 2. Arborescence du projet

index.html
service-worker.js
manifest.webmanifest

css/
  style.css
  tetribus.css

js/
  app.js
  router.js
  utils.js

  components/
    home.js
    home-month-calendar.js
    guided-month.js
    tetribus.js
    menu.js

  domain/
    conges.js
    day-status.js
    periods.js
    service-model.js
    service-suggestions.js
    services-availability.js

  data/
    db.js
    storage.js
    device.js
    export-db.js
    import-db.js
    services.js
    services-init.js
    services-catalog.js

  state/
    active-date.js
    home-mode.js
    month-calendar-state.js
    month-navigation.js
    ui-mode.js

  sw/
    sw-register.js

  games/
    tetribus/
      tetribus.game.js
      tetribus.render.js

docs/
  SAUVEGARDE_RESTAURATION.md
  SERVICE_WORKER.md
  CONTEXTE_METIER.md

---

## 3. Initialisation de l'application

app.js orchestre l'ordre d'execution.

Ordre strict :

1. Lecture de l'etat applicatif depuis les donnees locales
2. Initialisation du menu
3. Affichage de la vue d'accueil
4. Taches non bloquantes :
   - initialisation des services
   - enregistrement du Service Worker
   - surveillance des mises a jour


---

## 4. Navigation et vues

Le routing est interne et sans framework.

router.js :

- Une seule page HTML
- Vues sous forme de sections DOM
- Affichage par masquage / affichage
- Navigation declenchee uniquement par le menu

Chaque vue est un module autonome dans components/.

Etat actuel des vues

La vue Accueil est la vue centrale et regroupe :

- la consultation du jour actif
- le calendrier mensuel
- la navigation par mois
- la recherche de date (via le menu)

Les vues actives sont :

- home (vue centrale)
- guided-month (saisie guidee)
- tetribus

---

## 6. Stockage des donnees

LocalStorage :

- Etats legers et transitoires uniquement

IndexedDB :

- Planning
- Services
- Configuration
- Sauvegarde et restauration
- Retention planning : conservation automatique des 36 derniers mois (nettoyage apres ecriture)

Objectif : stockage structure, durable et hors ligne.

state/
active-date.js # date active globale
ui-mode.js # mode consultation / saisie
month-navigation.js # mois courant affiche
month-calendar-state.js # etat derive du calendrier mensuel

### Architecture de stockage

Le stockage est une couche d'adaptation plateforme.

- IndexedDB est l'implementation web actuelle
- Le stockage fichier est une implementation future (logiciel desktop)

Organisation :

- js/data/db.js : implementation IndexedDB (web)
- js/data/storage.interface.js : contrat abstrait
- js/data/storage.file.js : implementation fichier (mock, prete logiciel)

Le coeur metier (domain/) ne connait jamais le mecanisme de stockage.

---

## 7. Logique metier

Separation stricte :

- domain/ : logique metier pure
- data/ : acces et persistance des donnees
- state/ : etat global minimal partage

Aucune logique metier n'est implementee dans l'interface.

Conges :
- Support de plusieurs periodes de conges
- Format de config : { periods: [{ start: "jj/mm/aaaa", end: "jj/mm/aaaa" }] }
- Compatibilite maintenue avec l'ancien format { start, end }

## 7bis. Frontieres non negociables

Ces regles sont definitives et conditionnent toute evolution du projet.

### Domain (js/domain/)

- Ne depend jamais :
  - du navigateur
  - du DOM
  - du Service Worker
  - du stockage (IndexedDB, LocalStorage, fichier, etc.)
- Ne lit aucune donnee persistee.
- Recoit toutes les donnees necessaires par injection de parametres.
- Contient exclusivement :
  - les regles metier
  - la logique decisionnelle
  - des fonctions pures ou deterministes.

Interdictions absolues :

- getConfig ou equivalent
- acces direct aux API navigateur
- logique implicite ou magique

---

## 8. Service Worker

Le Service Worker gere :

- la mise en cache complete de l'application,
- le fonctionnement hors ligne total,
- la gestion explicite des mises a jour.

Regle unique :

- la banniere de mise a jour s'affiche uniquement si registration.waiting === true
- la banniere reste visible tant que l'utilisateur n'a pas clique
- un check periodique (15 min) detecte les nouvelles versions

Aucune decision de mise a jour n'est basee sur APP_VERSION cote interface.

Details : docs/SERVICE_WORKER.md

Interdictions absolues :

- aucune logique de decision fonctionnelle
- aucune comparaison de versions cote UI
- aucun stockage d'etat utilisateur
- aucune regle metier deguisee

Toute evolution fonctionnelle doit etre implementee exclusivement dans js/domain/, jamais dans le Service Worker.

---

## 9. Separation des responsabilites

components : interface utilisateur
domain : logique metier
data : persistance et acces aux donnees
state : etat global minimal
sw : cycle de vie PWA
games : module isole
css : presentation visuelle

## Migration et compatibilite

- Version IndexedDB : 5
- Migration automatique legacy : conversion vers le service FORMATION
- Migration idempotente, verrouillee et declenchee a l'ouverture DB

## Priorite de l'import

L'import de donnees constitue une restauration complete de l'etat applicatif.

A ce titre :

- il est independant :
  - de l'appareil,
  - du navigateur,
  - du domaine,
  - de l'installation PWA.

Ce comportement est contractuel et ne doit jamais etre contourne par l'interface ou le Service Worker.

---

## 10. Principes de conception

- Aucun framework
- Aucune dependance externe
- Offline-first reel
- Donnees locales uniquement
- Comportement deterministe
- Code lisible et structure

