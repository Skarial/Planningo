# CONTEXTE MÉTIER — Pourquoi cette application existe

## 1. Problème réel rencontré par les chauffeurs

Les chauffeurs de bus consultent leur planning via des outils internes qui :

- ne sont pas adaptés au smartphone
- nécessitent du réseau
- sont lents à charger
- ne permettent pas une vision rapide et claire des journées
- ne permettent pas d’annoter ou structurer facilement son planning personnel

En pratique, beaucoup de chauffeurs :

- prennent des captures d’écran
- notent sur papier
- utilisent des notes personnelles

Il n’existe pas d’outil simple, rapide, personnel, utilisable partout.

---

## 2. Contraintes terrain

Réalité quotidienne :

- Zones sans réseau
- Besoin de consulter son planning en quelques secondes
- Usage quasi exclusif sur smartphone
- Besoin d’un affichage clair, sans navigation complexe
- Aucun besoin de synchronisation serveur
- Données strictement personnelles

Ces contraintes rendent les applications web classiques inadaptées.

---

## 3. Pourquoi une PWA offline-first

Choix techniques dictés par le terrain :

- Fonctionnement total sans réseau
- Installation sur l’écran d’accueil comme une application native
- Chargement instantané
- Données stockées uniquement sur le téléphone
- Aucune authentification nécessaire
- Respect de la vie privée par conception

---

## 4. Objectif de l’application

Permettre à un chauffeur de :

- Consulter son planning immédiatement
- Naviguer jour / mois très rapidement
- Saisir son planning facilement
- Regrouper visuellement ses services
- Avoir un outil personnel, fiable, toujours disponible

---

## 5. Ce que cette application n’est pas

- Ce n’est pas un outil officiel
- Ce n’est pas connecté au SI de l’entreprise
- Ce n’est pas un outil collaboratif
- Ce n’est pas une application serveur

C’est un **outil personnel métier**, optimisé pour l’usage réel.

---

## 6. Intérêt pour une équipe de développement

Ce projet apporte :

- Un retour terrain authentique
- Un cas réel où offline-first est indispensable
- Une démonstration qu’un outil très simple peut résoudre un problème concret
- Une base fonctionnelle pouvant être industrialisée et intégrée à un SI existant
