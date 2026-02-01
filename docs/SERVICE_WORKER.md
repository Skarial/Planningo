# Service Worker — Gestion hors ligne et mises a jour

Ce document decrit le role, les responsabilites et les limites du Service Worker de l'application Planning PWA Chauffeurs.

Il a une valeur contractuelle.

## Role du Service Worker

Le Service Worker est responsable exclusivement de :

- la mise en cache de l'application
- le fonctionnement hors ligne
- la gestion controlee des mises a jour

Il n'a aucune responsabilite fonctionnelle.

## Mise en cache

Le Service Worker :

- met en cache l'ensemble des fichiers applicatifs
- permet un demarrage hors ligne
- ne depend d'aucune donnee utilisateur

Le cache est versionne et renouvele uniquement lors d'une mise a jour.

## Cycle de mise a jour

L'application effectue un check periodique (toutes les 15 minutes) et au retour au premier plan afin de detecter les mises a jour meme si l'app reste ouverte.

Lorsqu'une nouvelle version est detectee :

1. Le nouveau Service Worker est installe
2. Il reste en attente (waiting)
3. L'interface affiche une banniere de mise a jour
4. L'utilisateur declenche manuellement le rechargement

Aucune mise a jour n'est appliquee automatiquement : l'utilisateur declenche la mise a jour via la banniere.

## Banniere de mise a jour

La banniere de mise a jour s'affiche uniquement si :

registration.waiting === true

La banniere reste visible tant que l'utilisateur n'a pas clique sur "Mettre a jour".

Aucune autre condition n'est autorisee.

## Interdictions absolues

Le Service Worker ne doit jamais :

- contenir de logique metier
- comparer des versions applicatives
- lire ou ecrire des donnees utilisateur
- decider de comportements fonctionnels
- dependre d'IndexedDB ou de LocalStorage
- modifier l'etat d'activation

## Relation avec l'interface

Le Service Worker :

- communique uniquement par messages simples
- ne pilote jamais l'interface
- n'impose jamais de rechargement

## 1. Objectif

Garantir un comportement previsible, maitrise et professionnel concernant :

- le fonctionnement 100 % hors ligne,
- la gestion du cache,
- l'apparition des mises a jour,
- l'experience utilisateur.

Aucun comportement implicite.
Aucune logique basee sur des suppositions.

---

## 2. Principes fondamentaux

Cette application PWA repose sur les regles suivantes :

- Le Service Worker est la seule source de verite pour les mises a jour.
- La version de l'application (APP_VERSION) n'est jamais utilisee seule pour decider d'afficher une mise a jour.
- Aucune banniere de mise a jour n'est affichee sans Service Worker en attente.

---

## 3. Regle unique d'affichage de la banniere de mise a jour

La banniere de mise a jour s'affiche uniquement si :

registration.waiting === true;

---

## 4. Cycle de mise a jour

Lorsqu'une nouvelle version de l'application est deployee :

1. Le navigateur installe un nouveau Service Worker.
2. Ce Service Worker passe a l'etat waiting.
3. Tant que l'utilisateur n'a pas valide la mise a jour :
   - l'ancien Service Worker reste actif,
   - l'application continue de fonctionner normalement.

---

## 5. Validation utilisateur

Lorsque l'utilisateur valide la mise a jour :

1. L'application envoie le message SKIP_WAITING au Service Worker en attente.
2. Le nouveau Service Worker devient actif.
3. L'evenement controllerchange est declenche.
4. L'application est rechargee automatiquement.
5. La nouvelle version est immediatement utilisee.

Aucune mise a jour n'est appliquee sans action explicite de l'utilisateur.

---

## Evolutions futures

Toute evolution du Service Worker doit :

- respecter strictement ce document
- ne jamais introduire de logique metier
- rester independante du domaine fonctionnel

## 6. Portee de la regle

Cette logique :

- est independante de l'activation par code,
- est independante des donnees locales,
- est independante du statut nouvel utilisateur / utilisateur existant.

Le Service Worker reste l'unique autorite decisionnelle.

---

## 7. Statut du document

Ce document decrit un comportement contractuel.

Toute modification du mecanisme de mise a jour doit entrainer :

- une mise a jour du code,
- une mise a jour de ce document.

Toute violation de ces regles constitue une rupture de l'architecture du projet.
