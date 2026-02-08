# Changelog Recent

## 2026-02-08

- Réveil intelligent:
  - Passage en mode simplifié: suppression du champ `Horizon (jours)` dans la vue.
  - Horizon interne fixé à 30 jours.
  - Nettoyage de la notice (suppression des mentions devenues inutiles).
- Synchronisation réveil:
  - Bouton `Réveil à resynchroniser` ajouté sur l'accueil pour les services du matin.
  - Bouton `Synchroniser le reveil` ajouté en fin de saisie guidée.
  - Clic sur ces deux boutons: ouverture de la vue Réveil + import automatique.
  - Bouton manuel `Importer dans Reveil` conservé en fallback.
- État de rappel:
  - Nouveau state `alarm-resync` (pending + masquage utilisateur).
  - Masquage du rappel via croix persisté en local.
  - Nettoyage automatique du rappel après import réussi.
- UX:
  - Remplacement des `alert(...)` du flux de réponse Exchange par des toasts globaux.

