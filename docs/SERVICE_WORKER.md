# Service Worker — Gestion hors ligne et mises à jour

Ce document décrit le rôle, les responsabilités et les limites
du Service Worker de l’application Planning PWA Chauffeurs.

Il a une valeur **contractuelle**.

## Rôle du Service Worker

Le Service Worker est responsable exclusivement de :

- la mise en cache de l’application
- le fonctionnement hors ligne
- la gestion contrôlée des mises à jour

Il n’a **aucune responsabilité fonctionnelle**.

## Mise en cache

Le Service Worker :

- met en cache l’ensemble des fichiers applicatifs
- permet un démarrage hors ligne
- ne dépend d’aucune donnée utilisateur

Le cache est versionné et renouvelé uniquement lors d’une mise à jour.

## Cycle de mise à jour

Lorsqu’une nouvelle version est détectée :

1. Le nouveau Service Worker est installé
2. Il reste en attente (`waiting`)
3. L’interface affiche une bannière de mise à jour
4. L’utilisateur déclenche manuellement le rechargement

Aucune mise à jour n’est appliquée automatiquement.

## Bannière de mise à jour

La bannière de mise à jour s’affiche uniquement si :

registration.waiting === true

Aucune autre condition n’est autorisée.

## Interdictions absolues

Le Service Worker ne doit jamais :

- contenir de logique métier
- comparer des versions applicatives
- lire ou écrire des données utilisateur
- décider de comportements fonctionnels
- dépendre d’IndexedDB ou de LocalStorage
- modifier l’état d’activation

## Relation avec l’interface

Le Service Worker :

- communique uniquement par messages simples
- ne pilote jamais l’interface
- n’impose jamais de rechargement

## 1. Objectif

Garantir un comportement **prévisible, maîtrisé et professionnel** concernant :

- le fonctionnement 100 % hors ligne,
- la gestion du cache,
- l’apparition des mises à jour,
- l’expérience utilisateur.

Aucun comportement implicite.  
Aucune logique basée sur des suppositions.

---

## 2. Principes fondamentaux

Cette application PWA repose sur les règles suivantes :

- Le Service Worker est **la seule source de vérité** pour les mises à jour.
- La version de l’application (`APP_VERSION`) **n’est jamais utilisée seule** pour décider d’afficher une mise à jour.
- **Aucune bannière de mise à jour n’est affichée sans Service Worker en attente**.

---

## 3. Règle UNIQUE d’affichage de la bannière de mise à jour

La bannière de mise à jour **s’affiche uniquement si** :

```js
registration.waiting === true;
```

---

## 4. Cycle de mise à jour

Lorsqu’une nouvelle version de l’application est déployée :

1. Le navigateur installe un nouveau Service Worker.
2. Ce Service Worker passe à l’état `waiting`.
3. Tant que l’utilisateur n’a pas validé la mise à jour :
   - l’ancien Service Worker reste actif,
   - l’application continue de fonctionner normalement.

---

## 5. Validation utilisateur

Lorsque l’utilisateur valide la mise à jour :

1. L’application envoie le message `SKIP_WAITING` au Service Worker en attente.
2. Le nouveau Service Worker devient actif.
3. L’événement `controllerchange` est déclenché.
4. L’application est rechargée automatiquement.
5. La nouvelle version est immédiatement utilisée.

Aucune mise à jour n’est appliquée sans action explicite de l’utilisateur.

---

## Évolutions futures

Toute évolution du Service Worker doit :

- respecter strictement ce document
- ne jamais introduire de logique métier
- rester indépendante du domaine fonctionnel

## 6. Portée de la règle

Cette logique :

- est indépendante de l’activation par code,
- est indépendante des données locales,
- est indépendante du statut nouvel utilisateur / utilisateur existant.

Le Service Worker reste l’unique autorité décisionnelle.

---

## 7. Statut du document

Ce document décrit un **comportement contractuel**.

Toute modification du mécanisme de mise à jour doit entraîner :

- une mise à jour du code,
- une mise à jour de ce document.

Toute violation de ces règles constitue
une rupture de l’architecture du projet.
