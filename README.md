# Planning PWA — Gestion de planning chauffeur

Application Web Progressive (PWA) de gestion de planning, conçue pour un usage **terrain**, **hors ligne**, sur smartphone.

Projet développé en **JavaScript vanilla**, sans backend, sans dépendance externe, avec un contrôle total des données et des mises à jour.

© 2026 — Tous droits réservés.

---

## Positionnement du logiciel

Planning PWA est un **logiciel métier offline-first**, pensé pour les chauffeurs (bus, transport, services roulants) confrontés à :

- un accès réseau instable ou inexistant,
- un besoin de consultation rapide,
- une saisie simple et fiable,
- une utilisation quotidienne sur smartphone.

L’application fonctionne **sans serveur**, **sans compte utilisateur**, et reste entièrement opérationnelle hors connexion.

---

## Fonctionnalités principales

- Consultation instantanée du planning (jour / mois)
- Saisie guidée du planning
- Gestion des congés et périodes saisonnières
- Fonctionnement 100 % hors ligne
- Activation locale par code (sans backend)
- Sauvegarde et restauration complètes des données
- Installation PWA (Android / iOS)
- Mini-jeu intégré (Tetribus)

---

## Principes techniques clés

- **Offline-first strict**
- **Stockage local uniquement**
  - IndexedDB
  - LocalStorage
- **Aucun serveur**
- **Aucune authentification distante**
- **Aucune dépendance externe**
- **Contrôle explicite des mises à jour**

---

## Architecture technique

- HTML / CSS / JavaScript vanilla
- Router maison par masquage DOM
- Architecture modulaire (data / domain / components / state)
- Service Worker avec cache versionné
- Hébergement GitHub Pages

📄 Voir : [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## Activation et sécurité

L’accès à l’application est contrôlé par une **activation locale par code**, liée à l’appareil.

- Pas de compte
- Pas de serveur
- Pas de transmission de données
- Activation demandée une seule fois par appareil
- L’activation est restaurée automatiquement après import des données

📄 Voir : [`docs/ACTIVATION.md`](docs/ACTIVATION.md)

---

## Sauvegarde et restauration des données

Le logiciel permet :

- l’export complet des données utilisateur,
- la restauration intégrale sur un nouvel appareil,
- le changement de téléphone **sans perte de données ni réactivation**.

Les données restent **strictement locales**.

📄 Voir : [`docs/SAUVEGARDE_RESTAURATION.md`](docs/SAUVEGARDE_RESTAURATION.md)

---

## Service Worker et mises à jour

Le Service Worker est conçu pour garantir :

- disponibilité permanente,
- cache maîtrisé,
- mises à jour prévisibles et contrôlées,
- absence de blocage sur ancienne version.

La notification de mise à jour n’apparaît **uniquement** lorsqu’une nouvelle version est réellement prête.

📄 Voir : [`docs/SERVICE_WORKER.md`](docs/SERVICE_WORKER.md)

---

## Installation sur smartphone (PWA)

### Android (Chrome)

1. Ouvrir l’application dans Chrome.
2. Menu ⋮ → **Ajouter à l’écran d’accueil**.
3. Confirmer.

### iOS (Safari)

1. Ouvrir l’application dans Safari.
2. Bouton **Partager**.
3. **Sur l’écran d’accueil**.

L’application se comporte alors comme une application native.

---

## Aperçu visuel

### Accueil

![Accueil](docs/home.jpg)

### Vue jour

![Jour](docs/day.jpg)

### Vue mois

![Mois](docs/month.jpg)

### Saisie guidée

![Saisie guidée](docs/guided-month.jpg)

---

## Licence

Projet propriétaire.  
Toute utilisation, reproduction ou diffusion sans autorisation est interdite.

Voir le fichier [`LICENSE`](LICENSE).
