# Enterprise-Ready Plan (Branche isolee)

Ce document decrit la preparation technique pour un raccordement futur au SI entreprise,
sans impacter les utilisateurs actuels.

## Objectif

- Garder le comportement actuel en local pour tous les utilisateurs existants.
- Permettre un basculement progressif vers des services entreprise (planning, echanges).
- Eviter les regressions via des flags et des adapters.

## Principe

- Branche dediee: `enterprise-ready`.
- Mode par defaut: `local`.
- Activation entreprise seulement si:
  - `enterpriseSyncEnabled = true`
  - `enterprisePlanningSource = "enterprise_api"`
  - `enterpriseApiBaseUrl` renseigne

## Composants prepares

- `js/state/enterprise-flags.js`
  - Flags centralises, normalisation, persistance config.
- `js/adapters/planning-provider.js`
  - Selection de provider (local vs enterprise).
  - Local actif par defaut.
  - Enterprise reserve au futur branchement API.

## Roadmap conseilee

1. Brancher un backend sandbox (pas prod).
2. Implementer `enterprise provider` sur endpoints reels.
3. Activer les flags en staging uniquement.
4. Valider multi-utilisateurs (echanges, conflits, droits).
5. Deploiement progressif par groupe pilote.

## Garantie de non-impact actuel

- Aucune bascule automatique.
- Aucune suppression de flux local.
- Aucun changement metier actif tant que les flags restent par defaut.
