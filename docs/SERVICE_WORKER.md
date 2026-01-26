# SERVICE WORKER — Offline et mises à jour

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
