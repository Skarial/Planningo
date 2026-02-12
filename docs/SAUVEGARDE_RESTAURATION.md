# Sauvegarde et restauration des donnees

Ce document decrit le mecanisme de sauvegarde et de restauration des donnees de l'application.

Toutes les operations sont effectuees localement, sans serveur et sans connexion reseau.

---

## Principe general

L'application permet :

- l'export complet des donnees locales dans un fichier,
- l'import de ce fichier sur le meme appareil ou un autre appareil,
  avec restauration complete et immediate de l'etat applicatif.

Ces mecanismes permettent de conserver l'etat de l'application en cas de :

- changement de telephone,
- reinstallation,
- reinitialisation volontaire.

---

## Donnees concernees par la sauvegarde

La sauvegarde contient l'integralite des donnees stockees localement, notamment :

- le planning,
- les services,
- les parametres,
- l'etat d'activation,
- le Device ID.

Note : le planning conserve automatiquement les 36 derniers mois.
Les donnees plus anciennes sont purgees avant la sauvegarde.

Le fichier de sauvegarde represente un instantane complet de l'etat local de l'application a un instant donne.

Toutes les donnees proviennent de la base IndexedDB de l'application.

---

## Export des donnees

### Fonctionnement

Lors d'un export :

1. La base de donnees locale est ouverte.
2. Tous les stores connus sont lus.
3. Les donnees sont regroupees dans un objet structure.
4. Un fichier de sauvegarde est genere.

Le fichier contient :

- les donnees,
- des metadonnees (version, date, format).

Aucune donnee n'est transmise a l'exterieur.

---

## Import des donnees

### Fonctionnement

Lors d'un import :

1. Le fichier de sauvegarde est charge.
2. Son format est valide.
3. Les donnees locales existantes sont supprimees.
4. Les donnees du fichier sont restaurees.
5. L'application redemarre automatiquement.

La restauration est totale.

La restauration a priorite absolue sur tout autre mecanisme applicatif,
y compris l'activation.

---

## Effet sur l'activation

L'activation fait partie integrante des donnees sauvegardees.

Lors d'un import valide :

- l'etat d'activation est restaure tel quel,
- aucun code d'activation n'est requis,
- aucun recalcul ou recontrole n'est effectue,
- l'ecran d'activation est definitivement ignore.

Ce comportement est independant :

- de la version de l'application,
- du Device ID courant,
- du Service Worker.

---

## Compatibilite des sauvegardes

- Le format de sauvegarde est versionne.
- Une sauvegarde incompatible est refusee.
- Aucune tentative de migration automatique n'est effectuee.

La validite d'un fichier repose notamment sur :

- une signature explicite du format,
- une version de format supportee,
- une structure coherente des donnees.

---

## Securite et confidentialite

- Les donnees ne quittent jamais l'appareil sans action explicite.
- Aucun chiffrement n'est applique au fichier de sauvegarde.
- La confidentialite repose sur le controle du fichier par l'utilisateur.

La restauration permet volontairement de retablir un etat d'activation,
y compris sur un autre appareil.

Ce choix est assume et fait partie du modele d'usage.

---

## Relation entre sauvegarde et activation

La sauvegarde est le mecanisme de persistance ultime de l'application.

A ce titre :

- elle prevaut sur toute regle d'activation,
- elle permet une continuite d'usage sans friction,
- elle garantit l'absence de perte fonctionnelle lors d'un changement d'appareil.

Toute evolution future devra preserver cette priorite.

## Limites

- La sauvegarde ne protege pas contre une suppression definitive sans export prealable.
- Le fichier peut etre modifie manuellement, ce qui peut entrainer un import invalide.

---

## Statut du document

Ce document decrit un comportement contractuel.

Toute modification du mecanisme de sauvegarde ou de restauration doit etre :

- implementee dans le code,
- refletee strictement dans ce document,
- compatible avec les sauvegardes existantes,
- non regressive pour les utilisateurs actifs.
