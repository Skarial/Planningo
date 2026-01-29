## Générateur d’activation CLI (outil développeur)

Un script local permet de générer un code d’activation sans navigateur.

- Fichier :
  -- tools/generate-activation.py : logique de génération
  -- tools/gen-code : raccourci exécutable
- Usage : ./tools/gen-code DEVICE_ID
- Exemple :
  -- ./tools/gen-code a9c4f2d1-87b3
  -- Résultat : 3f8a91c4b2de
- Algorithme strictement identique au générateur HTML

# Compatibilité logiciel — Planning PWA

## Objectif

Ce document définit les environnements logiciels **supportés**, **tolérés** et **non supportés**
pour l’application Planning PWA Chauffeurs.

Il a une valeur **contractuelle**.

## Garanties techniques acquises

### 1. Domain métier pur

- Aucun accès direct au stockage
- Aucune dépendance navigateur
- Données injectées par paramètres
- Logique déterministe et testable

Fichiers concernés :

- `domain/conges.js`
- `domain/periods.js`
- `domain/services-grouping.js`
- `domain/activation.js`

---

## Stockage local

L’application repose sur :

- IndexedDB pour les données persistantes
- LocalStorage pour les états légers

Limitations connues :

- La suppression des données navigateur supprime les données de l’application
- Le mode navigation privée peut bloquer IndexedDB

### 2. Stockage abstrait par contrat

Un contrat de stockage unique est défini :

- `data/storage.interface.js`

Toute implémentation doit respecter ce contrat.

---

### 3. Adaptateurs interchangeables

Implémentations existantes :

- `storage.memory.js` (tests / fallback)
- `storage.file.js` (mock logiciel)
- `storage.abstract.js` (point d’entrée stable)
- `storage.selector.js` (sélection runtime)

Le domain ne connaît jamais l’implémentation concrète.

---

### 4. IndexedDB isolé

Le stockage IndexedDB reste cantonné à :

- `data/storage.js`

Il n’est jamais utilisé par le domain.

---

### 5. Tests unitaires fiables

- Runner asynchrone sans framework
- Tests exécutés réellement
- Aucun faux positif

Tous les adaptateurs respectent le contrat par les tests.

---

## Environnements non supportés

Les environnements suivants ne sont **pas supportés** :

- Navigateurs obsolètes sans Service Worker
- Navigateurs sans IndexedDB
- Mode navigation privée bloquant le stockage
- Navigateurs embarqués non standards

## Spécificités Android

- Support stable d’IndexedDB
- Service Worker fiable
- PWA fortement recommandée

## Plateformes supportées

L’application est officiellement supportée sur :

- Android (Chrome, WebView)
- iOS (Safari, PWA installée)
- Desktop (Chrome, Edge, Firefox récents)

Conditions :

- JavaScript activé
- IndexedDB disponible
- Service Worker supporté
- LocalStorage disponible

## Mode d’installation

L’application peut être utilisée :

- en navigation web
- en PWA installée

Le mode PWA est **recommandé** pour :

- la persistance hors ligne
- la stabilité
- la gestion correcte du cache

## Fonctionnement hors ligne

- L’application fonctionne intégralement hors ligne
- Aucune connexion réseau n’est requise après le premier chargement
- Aucune fonctionnalité ne dépend d’un serveur distant

## Évolutions futures

Une version logicielle desktop pourra être envisagée.

Dans ce cas :

- le stockage fichier remplacera IndexedDB
- le cœur métier restera inchangé

## Conclusion

Le projet peut évoluer vers :

- un logiciel desktop (Electron, Tauri)
- un stockage fichier réel
- un autre runtime

sans modification du domain ni des règles métier.

Toute évolution future devra respecter ces garanties.

Toute configuration hors de ce périmètre
n’est pas garantie comme fonctionnelle.
