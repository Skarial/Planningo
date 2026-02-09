# Checklist avant commit

Ce document définit les vérifications **obligatoires** à effectuer avant tout commit.

Il a une valeur **contractuelle**.
Aucun commit ne doit être effectué si un point est en échec.

## Architecture et séparation des responsabilités

### Domain

- [ ] Aucun accès au DOM
- [ ] Aucun accès au navigateur
- [ ] Aucun accès au stockage
- [ ] Aucune dépendance IndexedDB / LocalStorage
- [ ] Fonctions pures ou déterministes uniquement

### Components

- [ ] Aucune logique métier
- [ ] Aucun calcul de règle fonctionnelle
- [ ] Interface uniquement

### Data

- [ ] Accès aux données uniquement
- [ ] Aucune règle métier
- [ ] Aucune logique UI

## 2. Données et stockage

- [ ] Le domain ne lit jamais directement le stockage
- [ ] Les données sont injectées au domain par paramètres
- [ ] Aucun format implicite ou magique
- [ ] La retention du planning est reglee sur 36 mois

## 3. Service Worker

- [ ] Aucune logique métier
- [ ] Aucune décision fonctionnelle
- [ ] Aucune comparaison de version applicative côté UI
- [ ] Aucun stockage d’état utilisateur
- [ ] Gestion des mises à jour basée uniquement sur `registration.waiting`


## 4. Sécurité et régression

- [ ] Aucune donnée utilisateur n’est perdue
- [ ] Aucun comportement existant n’est modifié
- [ ] Toute modification est justifiée et traçable

## Sauvegarde et restauration

- [ ] Le fichier d’export contient :
  - [ ] une signature explicite
  - [ ] une version de format
  - [ ] les métadonnées
  - [ ] tous les stores connus
- [ ] L’import valide le format avant toute modification locale
- [ ] L’import efface intégralement les données existantes
- [ ] Un import valide entraîne un redémarrage automatique

## Vérifications générales

- [ ] L’application démarre sans erreur en mode hors ligne
- [ ] Aucun warning bloquant dans la console
- [ ] Aucun code mort ou temporaire laissé en place
- [ ] Les noms de variables et fonctions sont explicites
- [ ] Aucun `console.log` résiduel

## Tests

- [ ] Les tests domain passent
- [ ] Aucun test cassé ou désactivé
- [ ] Toute règle métier modifiée est couverte

## Documentation

- [ ] La documentation reflète exactement le comportement du code
- [ ] Aucun comportement implicite non documenté
- [ ] Les documents contractuels sont à jour :
  - [ ] ARCHITECTURE.md
  - [ ] SAUVEGARDE_RESTAURATION.md

Un commit effectué sans validation complète de cette checklist
est considéré comme invalide.

