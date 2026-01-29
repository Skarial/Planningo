# Sauvegarde et restauration des données

Ce document décrit le mécanisme de sauvegarde et de restauration des données de l’application.

Toutes les opérations sont effectuées **localement**, sans serveur et sans connexion réseau.

---

## Principe général

L’application permet :

- l’export complet des données locales dans un fichier,
- l’import de ce fichier sur le même appareil ou un autre appareil,
  avec restauration complète et immédiate de l’état applicatif.

Ces mécanismes permettent de conserver l’état de l’application en cas de :

- changement de téléphone,
- réinstallation,
- réinitialisation volontaire.

---

## Données concernées par la sauvegarde

La sauvegarde contient l’intégralité des données stockées localement, notamment :

- le planning,
- les services,
- les paramètres,
- l’état d’activation.
- le Device ID,

Le fichier de sauvegarde représente un **instantané complet** de l’état local
de l’application à un instant donné.

Toutes les données proviennent de la base IndexedDB de l’application.

---

## Export des données

### Fonctionnement

Lors d’un export :

1. La base de données locale est ouverte.
2. Tous les stores connus sont lus.
3. Les données sont regroupées dans un objet structuré.
4. Un fichier de sauvegarde est généré.

Le fichier contient :

- les données,
- des métadonnées (version, date, format).

Aucune donnée n’est transmise à l’extérieur.

---

## Import des données

### Fonctionnement

Lors d’un import :

1. Le fichier de sauvegarde est chargé.
2. Son format est validé.
3. Les données locales existantes sont supprimées.
4. Les données du fichier sont restaurées.
5. L’application redémarre automatiquement.

La restauration est **totale**.

La restauration a priorité absolue sur tout autre mécanisme applicatif,
y compris l’activation.

---

## Effet sur l’activation

L’activation fait partie intégrante des données sauvegardées.

Lors d’un import valide :

- l’état d’activation est restauré tel quel,
- aucun code d’activation n’est requis,
- aucun recalcul ou recontrôle n’est effectué,
- l’écran d’activation est définitivement ignoré.

Ce comportement est indépendant :

- de la version de l’application,
- du Device ID courant,
- du Service Worker.

---

## Compatibilité des sauvegardes

- Le format de sauvegarde est versionné.
- Une sauvegarde incompatible est refusée.
- Aucune tentative de migration automatique n’est effectuée.

La validité d’un fichier repose notamment sur :

- une signature explicite du format,
- une version de format supportée,
- une structure cohérente des données.

---

## Sécurité et confidentialité

- Les données ne quittent jamais l’appareil sans action explicite.
- Aucun chiffrement n’est appliqué au fichier de sauvegarde.
- La confidentialité repose sur le contrôle du fichier par  
  l’utilisateur.

La restauration permet volontairement de rétablir un état d’activation,
y compris sur un autre appareil.

Ce choix est assumé et fait partie du modèle d’usage.

---

## Relation entre sauvegarde et activation

La sauvegarde est le mécanisme de persistance ultime de l’application.

À ce titre :

- elle prévaut sur toute règle d’activation,
- elle permet une continuité d’usage sans friction,
- elle garantit l’absence de perte fonctionnelle lors d’un changement d’appareil.

Toute évolution future devra préserver cette priorité.

## Limites

- La sauvegarde ne protège pas contre une suppression définitive sans export préalable.
- Le fichier peut être modifié manuellement, ce qui peut entraîner un import invalide.

---

## Statut du document

Ce document décrit un comportement **contractuel**.

Toute modification du mécanisme de sauvegarde ou de restauration doit être :

- implémentée dans le code,
- reflétée strictement dans ce document,
- compatible avec les sauvegardes existantes,
- non régressive pour les utilisateurs actifs.
