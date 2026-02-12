# Compatibilite logiciel - Planningo

## Objectif

Ce document definit les environnements logiciels supportes, toleres et non supportes pour l'application Planningo.

Il a une valeur contractuelle.

## Garanties techniques acquises

### 1. Domain metier pur

- Aucun acces direct au stockage
- Aucune dependance navigateur
- Donnees injectees par parametres
- Logique deterministe et testable

Fichiers concernes :

- `domain/conges.js`
- `domain/periods.js`

---

## Stockage local

L'application repose sur :

- IndexedDB pour les donnees persistantes
- LocalStorage pour les etats legers
- Retention du planning : conservation automatique des 36 derniers mois

Limitations connues :

- La suppression des donnees navigateur supprime les donnees de l'application
- Le mode navigation privee peut bloquer IndexedDB

### 2. Stockage abstrait par contrat

Un contrat de stockage unique est defini :

- `data/storage.interface.js`

Toute implementation doit respecter ce contrat.

---

### 3. Adaptateurs interchangeables

Implementations existantes :

- `storage.memory.js` (tests / fallback)
- `storage.file.js` (mock logiciel)
- `storage.abstract.js` (point d'entree stable)
- `storage.selector.js` (selection runtime)

Le domain ne connait jamais l'implementation concrete.

---

### 4. IndexedDB isole

Le stockage IndexedDB reste cantonne a :

- `data/storage.js`

Il n'est jamais utilise par le domain.

---

### 5. Tests unitaires fiables

- Runner asynchrone sans framework
- Tests executes reellement
- Aucun faux positif

Tous les adaptateurs respectent le contrat par les tests.

---

## Environnements non supportes

Les environnements suivants ne sont pas supportes :

- Navigateurs obsoletes sans Service Worker
- Navigateurs sans IndexedDB
- Mode navigation privee bloquant le stockage
- Navigateurs embarques non standards

## Specificites Android

- Support stable d'IndexedDB
- Service Worker fiable
- PWA fortement recommandee

## Plateformes supportees

L'application est officiellement supportee sur :

- Android (Chrome, WebView)
- iOS (Safari, PWA installee)
- Desktop (Chrome, Edge, Firefox recents)

Conditions :

- JavaScript active
- IndexedDB disponible
- Service Worker supporte
- LocalStorage disponible

## Mode d'installation

L'application peut etre utilisee :

- en navigation web
- en PWA installee

Le mode PWA est recommande pour :

- la persistance hors ligne
- la stabilite
- la gestion correcte du cache

## Fonctionnement hors ligne

- L'application fonctionne integralement hors ligne
- Aucune connexion reseau n'est requise apres le premier chargement
- Aucune fonctionnalite ne depend d'un serveur distant

## Evolutions futures

Une version logicielle desktop pourra etre envisagee.

Dans ce cas :

- le stockage fichier remplacera IndexedDB
- le coeur metier restera inchange

## Conclusion

Le projet peut evoluer vers :

- un logiciel desktop (Electron, Tauri)
- un stockage fichier reel
- un autre runtime

sans modification du domain ni des regles metier.

Toute evolution future devra respecter ces garanties.

Toute configuration hors de ce perimetre n'est pas garantie comme fonctionnelle.
