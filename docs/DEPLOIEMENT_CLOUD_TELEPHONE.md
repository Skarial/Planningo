# Deploiement Cloud Depuis Telephone

Ce document permet de piloter Planningo sans PC allume.

## Principe

1. Le code est dans GitHub (`main`).
2. Le workflow `CI` verifie qualite/tests.
3. Le workflow `Deploy Pages` publie en production sur GitHub Pages.
4. Tout est execute dans GitHub Actions (cloud).

## Activation initiale (une seule fois)

1. Ouvrir GitHub > `Settings` > `Pages`.
2. Dans `Source`, choisir `GitHub Actions`.
3. Verifier la presence des workflows:
   - `.github/workflows/ci.yml`
   - `.github/workflows/deploy-pages.yml`
4. (Recommande) Proteger `main`:
   - `Settings` > `Branches` > branch protection sur `main`
   - exiger le check `CI / quality`

## Utilisation depuis telephone

### Deploiement automatique

- Faire un commit/merge vers `main` (depuis app GitHub ou web).
- `CI` se lance.
- Si `CI` est vert, `Deploy Pages` publie automatiquement.

### Deploiement manuel / rollback

1. Ouvrir `Actions` > `Deploy Pages`.
2. `Run workflow`.
3. Renseigner `ref`:
   - `main` pour redeployer l'etat courant
   - un hash de commit pour rollback
   - un tag si necessaire
4. Lancer le workflow.

## Verification production

1. Ouvrir l'URL GitHub Pages du repo.
2. Verifier que la date de dernier deploiement a change dans `Actions`.
3. Sur mobile, faire un hard refresh si besoin (cache SW).

## Notes de securite

- Aucune cle de deploiement locale n'est necessaire pour GitHub Pages.
- Garder 2FA actif sur le compte GitHub.
- Limiter les droits d'ecriture repo aux personnes autorisees.
