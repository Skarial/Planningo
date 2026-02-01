# Activation de l'application

Ce document decrit le fonctionnement du systeme d'activation de l'application.

Il s'agit d'un mecanisme local, hors ligne, sans compte utilisateur et sans serveur.

---

## Principe general

L'application necessite une activation par code lors de la premiere utilisation sur un appareil.

Cette activation permet :

- de controler l'acces a l'application,
- de lier l'utilisation a un appareil unique,
- sans authentification,
- sans creation de compte,
- sans communication reseau.

Une fois activee, l'application reste utilisable sans nouvelle verification sur le meme appareil.

---

## Device ID

Lors du premier lancement :

- un identifiant unique appele Device ID est genere,
- il est propre a l'appareil,
- il est stocke localement,
- il n'est jamais modifie automatiquement.

Le Device ID est affiche a l'ecran d'activation.

---

## Procedure d'activation

1. L'utilisateur ouvre l'application.
2. Un ecran "Activation requise" s'affiche.
3. Le Device ID est visible a l'ecran.
4. Le Device ID est transmis pour generation du code.
5. Un code d'activation correspondant est fourni.
6. Le code est saisi dans l'application.
7. L'activation est validee.

Une fois l'activation validee :

- l'ecran d'activation disparait,
- l'application demarre normalement,
- l'activation est conservee localement.

### Cas particulier — Restauration par import

Si l'utilisateur importe un fichier de sauvegarde valide :

- l'etat d'activation est restaure,
- aucun code d'activation n'est requis,
- l'ecran d'activation disparait immediatement,
- l'application demarre en mode normal.

L'import de donnees a priorite absolue sur toute procedure d'activation manuelle.

---

## Verification du code

- Le code est verifie localement dans l'application.
- Aucun code n'est stocke en clair.
- La verification repose sur :
  - le Device ID,
  - un secret integre a l'application.

Aucune liste de codes n'est embarquee.

La verification du code n'est effectuee qu'une seule fois par appareil.

Une fois l'activation validee :

- aucune revalidation n'est effectuee,
- aucun recalcul n'est declenche,
- aucune dependance a la version applicative n'existe.

---

## Persistance de l'activation

L'etat d'activation :

- est stocke localement,
- est independant de la version de l'application,
- n'est pas lie au Service Worker,
- n'est pas reinitialise lors d'une mise a jour,
- est restaure integralement lors d'un import de donnees.

---

## Erreur d'activation

Si le code saisi est invalide :

- l'activation est refusee,
- l'application reste bloquee sur l'ecran d'activation,
- aucune donnee n'est modifiee.

---

## Priorite de l'import sur l'activation

La restauration de donnees constitue une reprise complete de l'etat applicatif.

A ce titre :

- elle neutralise definitivement l'ecran d'activation,
- elle rend le Device ID non pertinent,
- elle interdit toute demande ulterieure de code d'activation,
- elle prevaut sur toute regle d'activation existante ou future.

Ce comportement est contractuel.

## Portee et limites

Ce systeme :

- n'est pas un DRM,
- n'a pas vocation a etre inviolable,
- peut etre contourne par un utilisateur technique.

Il s'agit d'un controle d'usage, pas d'un mecanisme de securite forte.

---

## Statut du document

Ce document decrit un comportement contractuel.

Toute modification du systeme d'activation ou de restauration doit etre :

- implementee dans le code,
- refletee strictement dans ce document,
- compatible avec les donnees existantes,
- non regressive pour les utilisateurs deja actives.
