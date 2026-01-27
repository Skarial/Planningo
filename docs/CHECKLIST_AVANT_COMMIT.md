# Checklist avant commit — Planning PWA

Cette checklist doit être validée avant chaque commit.

## 1. Architecture

- [ ] Aucun fichier dans `js/domain/` n’importe :
  - `data/`
  - `components/`
  - le navigateur (`window`, `document`, `crypto`, etc.)
- [ ] Aucune logique métier dans `js/components/`
- [ ] Les règles métier sont explicites et localisées dans `js/domain/`

## 2. Données et stockage

- [ ] Le domain ne lit jamais directement le stockage
- [ ] Les données sont injectées au domain par paramètres
- [ ] Aucun format implicite ou magique

## 3. Service Worker

- [ ] Aucune règle fonctionnelle dans le Service Worker
- [ ] Aucune comparaison de version côté UI
- [ ] La mise à jour repose uniquement sur `registration.waiting`

## 4. Activation

- [ ] La règle d’activation n’a pas changé
- [ ] Aucun utilisateur existant n’est réévalué
- [ ] Aucun calcul crypto dans le domain

## 5. Sécurité et régression

- [ ] Aucune donnée utilisateur n’est perdue
- [ ] Aucun comportement existant n’est modifié
- [ ] Toute modification est justifiée et traçable
