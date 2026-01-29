# Activation de l’application

Ce document décrit le fonctionnement du système d’activation de l’application.

Il s’agit d’un mécanisme **local**, **hors ligne**, sans compte utilisateur et sans serveur,
pouvant être **court-circuité définitivement par restauration de données**.

Il s’agit d’un mécanisme **local**, **hors ligne**, sans compte utilisateur et sans serveur,
pouvant être **court-circuité définitivement par restauration de données**.

---

## Principe général

L’application nécessite une **activation par code** lors de la première utilisation sur un appareil.

Cette activation permet :

- de contrôler l’accès à l’application,
- de lier l’utilisation à un appareil unique,
- sans authentification,
- sans création de compte,
- sans communication réseau.

Une fois activée, l’application reste utilisable sans nouvelle vérification sur le même appareil.

---

## Device ID

Lors du premier lancement :

- un identifiant unique appelé **Device ID** est généré,
- il est propre à l’appareil,
- il est stocké localement,
- il n’est jamais modifié automatiquement.

Le Device ID est affiché à l’écran d’activation.

---

## Procédure d’activation

1. L’utilisateur ouvre l’application.
2. Un écran **« Activation requise »** s’affiche.
3. Le **Device ID** est visible à l’écran.
4. Le Device ID est transmis pour génération du code.
5. Un **code d’activation** correspondant est fourni.
6. Le code est saisi dans l’application.
7. L’activation est validée.

Une fois l’activation validée :

- l’écran d’activation disparaît,
- l’application démarre normalement,
- l’activation est conservée localement.

### Cas particulier — Restauration par import

Si l’utilisateur importe un fichier de sauvegarde valide :

- l’état d’activation est restauré,
- aucun code d’activation n’est requis,
- l’écran d’activation disparaît immédiatement,
- l’application démarre en mode normal.

L’import de données a priorité absolue sur toute procédure d’activation manuelle.

---

## Vérification du code

- Le code est vérifié **localement** dans l’application.
- Aucun code n’est stocké en clair.
- La vérification repose sur :
  - le Device ID,
  - un secret intégré à l’application.

Aucune liste de codes n’est embarquée.

La vérification du code n’est effectuée **qu’une seule fois** par appareil.

Une fois l’activation validée :

- aucune revalidation n’est effectuée,
- aucun recalcul n’est déclenché,
- aucune dépendance à la version applicative n’existe.

---

## Persistance de l’activation

L’état d’activation :

- est stocké localement,
- est indépendant de la version de l’application,
- n’est pas lié au Service Worker,
- n’est pas réinitialisé lors d’une mise à jour.
- est restaurée intégralement lors d’un import de données.

---

## Erreur d’activation

Si le code saisi est invalide :

- l’activation est refusée,
- l’application reste bloquée sur l’écran d’activation,
- aucune donnée n’est modifiée.

---

## Priorité de l’import sur l’activation

La restauration de données constitue une reprise complète de l’état applicatif.

À ce titre :

- elle neutralise définitivement l’écran d’activation,
- elle rend le Device ID non pertinent,
- elle interdit toute demande ultérieure de code d’activation,
- elle prévaut sur toute règle d’activation existante ou future.

Ce comportement est contractuel.

## Portée et limites

Ce système :

- n’est pas un DRM,
- n’a pas vocation à être inviolable,
- peut être contourné par un utilisateur technique.

Il s’agit d’un **contrôle d’usage**, pas d’un mécanisme de sécurité forte.

---

## Statut du document

Ce document décrit un comportement **contractuel**.

Toute modification du système d’activation ou de restauration doit être :

- implémentée dans le code,
- reflétée strictement dans ce document,
- compatible avec les données existantes,
- non régressive pour les utilisateurs déjà activés.
