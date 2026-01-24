<!-- refresh github -->

# Planning PWA

Application web progressive de gestion de planning.  
Projet personnel développé en JavaScript vanilla.

© 2026 – Tous droits réservés.

---

## Prototype métier offline-first

Application PWA conçue par un chauffeur pour résoudre un problème réel de consultation et de saisie de planning quotidien, en conditions de terrain (smartphone, réseau instable, rapidité).

Fonctionne 100% offline, sans serveur, sans authentification, avec stockage local des données.

---

## Objectif métier

Permettre à un chauffeur de bus de :

- Consulter son planning instantanément
- Naviguer jour / mois rapidement
- Saisir son planning facilement
- Disposer d’un outil personnel, fiable, toujours disponible

Voir : CONTEXTE_METIER.md

---

## Architecture technique

- HTML / CSS / JavaScript vanilla
- Router maison par masquage DOM
- IndexedDB + LocalStorage
- Service Worker avec cache versionné
- Hébergement GitHub Pages
- Aucune dépendance externe

Voir : ARCHITECTURE.md

---

## Gestion du offline et des mises à jour

Voir : SERVICE_WORKER.md

---

## Installation sur smartphone (PWA)

L’application peut être installée sur l’écran d’accueil comme une application native.

### Android (Chrome)

1. Ouvrir l’application dans Chrome.
2. Appuyer sur les trois points en haut à droite.
3. Choisir **Ajouter à l’écran d’accueil**.
4. Choisir **Téléchargement**.

L’icône apparaît sur le téléphone comme une application.

### iPhone / iPad (Safari)

1. Ouvrir l’application dans Safari.
2. Appuyer sur le bouton **Partager**.
3. Choisir **Sur l’écran d’accueil**.

L’icône apparaît comme une application native.

---

## Aperçu de l’application

### Accueil

![Home](docs/home.jpg)

### Vue jour

![Day](docs/day.jpg)

### Vue mois

![Month](docs/month.jpg)

### Saisie guidée

![Guided Month](docs/guided-month.jpg)
