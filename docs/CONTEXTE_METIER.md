# CONTEXTE METIER — Pourquoi cette application existe

## 1. Probleme reel rencontre par les chauffeurs

Les chauffeurs de bus consultent leur planning via des outils internes qui :

- ne sont pas adaptes au smartphone
- necessitent du reseau
- sont lents a charger
- ne permettent pas une vision rapide et claire des journees
- ne permettent pas d'annoter ou structurer facilement son planning personnel

En pratique, beaucoup de chauffeurs :

- prennent des captures d'ecran
- notent sur papier
- utilisent des notes personnelles

Il n'existe pas d'outil simple, rapide, personnel, utilisable partout.

---

## 2. Contraintes terrain

Realite quotidienne :

- Zones sans reseau
- Besoin de consulter son planning en quelques secondes
- Usage quasi exclusif sur smartphone
- Besoin d'un affichage clair, sans navigation complexe
- Aucun besoin de synchronisation serveur
- Donnees strictement personnelles

Ces contraintes rendent les applications web classiques inadaptees.

---

## 3. Pourquoi une PWA offline-first

Choix techniques dictes par le terrain :

- Fonctionnement total sans reseau
- Installation sur l'ecran d'accueil comme une application native
- Chargement instantane
- Donnees stockees uniquement sur le telephone
- Aucune authentification necessaire
- Respect de la vie privee par conception

---

## 4. Objectif de l'application

Permettre a un chauffeur de :

- Consulter son planning immediatement
- Naviguer jour / mois tres rapidement
- Saisir son planning facilement
- Regrouper visuellement ses services
- Avoir un outil personnel, fiable, toujours disponible

---

## 5. Ce que cette application n'est pas

- Ce n'est pas un outil officiel
- Ce n'est pas connecte au SI de l'entreprise
- Ce n'est pas un outil collaboratif
- Ce n'est pas une application serveur

C'est un outil personnel metier, optimise pour l'usage reel.

---

## 6. Interet pour une equipe de developpement

Ce projet apporte :

- Un retour terrain authentique
- Un cas reel ou offline-first est indispensable
- Une demonstration qu'un outil tres simple peut resoudre un probleme concret
- Une base fonctionnelle pouvant etre industrialisee et integree a un SI existant
