# Compatibilité logiciel — Planning PWA

## Objectif

Ce document atteste que l’application Planning PWA est structurellement
compatible avec une transformation future en logiciel (desktop ou natif),
sans refactor majeur du code métier.

---

## Garanties techniques acquises

### 1. Domain métier pur

- Aucun accès direct au stockage
- Aucune dépendance navigateur
- Données injectées par paramètres
- Logique déterministe et testable

Fichiers concernés :

- `domain/conges.js`
- `domain/periods.js`
- `domain/services-grouping.js`
- `domain/activation.js`

---

### 2. Stockage abstrait par contrat

Un contrat de stockage unique est défini :

- `data/storage.interface.js`

Toute implémentation doit respecter ce contrat.

---

### 3. Adaptateurs interchangeables

Implémentations existantes :

- `storage.memory.js` (tests / fallback)
- `storage.file.js` (mock logiciel)
- `storage.abstract.js` (point d’entrée stable)
- `storage.selector.js` (sélection runtime)

Le domain ne connaît jamais l’implémentation concrète.

---

### 4. IndexedDB isolé

Le stockage IndexedDB reste cantonné à :

- `data/storage.js`

Il n’est jamais utilisé par le domain.

---

### 5. Tests unitaires fiables

- Runner asynchrone sans framework
- Tests exécutés réellement
- Aucun faux positif

Tous les adaptateurs respectent le contrat par les tests.

---

## Conclusion

Le projet peut évoluer vers :

- un logiciel desktop (Electron, Tauri)
- un stockage fichier réel
- un autre runtime

sans modification du domain ni des règles métier.

Toute évolution future devra respecter ces garanties.
