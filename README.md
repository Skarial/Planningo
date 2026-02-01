# Planning PWA

Application web progressive de gestion de planning, developpee en JavaScript vanilla.

Projet personnel, concu pour un usage reel sur smartphone, en conditions de mobilite.

---

## Presentation generale

Planning PWA est une application offline-first permettant la consultation et la saisie d'un planning de travail.

L'application fonctionne :

- sans serveur,
- sans compte utilisateur,
- sans dependance externe,
- avec stockage local uniquement.

Elle est concue pour etre installee comme une application native via les mecanismes PWA.

---

## Objectif fonctionnel

L'application permet de :

- consulter rapidement un planning (jour + mois depuis la vue Accueil),
- naviguer par jour et par mois depuis une seule vue centrale,
- saisir et modifier les services (saisie directe + saisie guidee),
- fonctionner de maniere fiable hors connexion.

Le perimetre fonctionnel est volontairement restreint et maitrise.

---

## Contexte metier

L'application a ete concue a partir d'un besoin reel de terrain, avec les contraintes suivantes :

- usage principal sur smartphone,
- reseau instable ou absent,
- necessite de rapidite et de lisibilite,
- fiabilite des donnees locales.

Voir : `docs/CONTEXTE_METIER.md`

---

## Architecture technique

- HTML / CSS / JavaScript vanilla
- Architecture modulaire (components / domain / data / state)
- Router interne par masquage DOM
- IndexedDB pour les donnees persistantes
- Retention automatique du planning : 36 derniers mois
- LocalStorage pour l'etat applicatif leger
- Service Worker avec cache versionne
- Hebergement GitHub Pages

Aucune bibliotheque externe n'est utilisee.

Voir : `ARCHITECTURE.md`

---

## Offline et mises a jour

L'application est concue pour fonctionner entierement hors ligne.

La gestion du cache et des mises a jour repose exclusivement sur le Service Worker, avec un comportement deterministe et controle.

Voir : `docs/SERVICE_WORKER.md`

---

## Activation de l'application

L'application necessite une activation locale par code lors de la premiere utilisation sur un appareil.

L'activation est :

- liee a l'appareil,
- stockee localement,
- restaurable via sauvegarde.

Voir : `docs/ACTIVATION.md`

---

## Sauvegarde et restauration

Les donnees peuvent etre :

- sauvegardees dans un fichier local,
- restaurees integralement sur le meme appareil ou un autre.

La sauvegarde inclut l'activation si elle est presente.

Voir : `docs/SAUVEGARDE_RESTAURATION.md`

---

## Installation en tant qu'application (PWA)

### Android (Chrome)

1. Ouvrir l'application dans Chrome.
2. Menu ⋮ → Ajouter a l'ecran d'accueil.
3. Valider.

### iOS (Safari)

1. Ouvrir l'application dans Safari.
2. Bouton Partager.
3. Sur l'ecran d'accueil.

L'application apparait ensuite comme une application native.

---

## Apercu

Captures a jour a ajouter (nouveau design en cours).

---

## Licence

Voir le fichier `LICENSE`.

---

## Statut

Projet stable, autonome, sans dependance externe.
Le comportement documente fait foi.
