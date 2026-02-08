# Module Echange v1 - BDD + API (spec finale)

## 1) Portee et principes

- Module 100% online (messagerie + demandes d'echange).
- Aucune logique metier planning dans le Service Worker.
- Aucune modification automatique du planning local.
- Pas de push, pas d'historique.
- Auth obligatoire cote serveur.
- Email jamais affiche dans les listes publiques.
- Acces serveur restreint au depot via `DEPOT_ID`.

## 2) Conventions

- Dates/horodatages: ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- Date metier planning: `YYYY-MM-DD` (`DateISO`).
- IDs: `TEXT` (UUID/ULID recommande).
- Auth: token de session opaque dans `Authorization: Bearer <token>`.
- Restriction depot: header obligatoire `X-Planningo-Depot: <DEPOT_ID>`.

## 3) Schema BDD SQLite (v1)

`PRAGMA foreign_keys = ON;`

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  last_seen_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE exchange_requests (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  offered_date_iso TEXT NOT NULL,
  offered_service_kind TEXT NOT NULL CHECK (offered_service_kind IN ('CATALOG','REST','FREE_TEXT')),
  offered_service_code TEXT,
  offered_service_text TEXT,
  status TEXT NOT NULL CHECK (status IN ('open','closed')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (
    (offered_service_kind = 'CATALOG' AND offered_service_code IS NOT NULL AND offered_service_text IS NULL) OR
    (offered_service_kind = 'REST' AND offered_service_code IS NOT NULL AND offered_service_text IS NULL) OR
    (offered_service_kind = 'FREE_TEXT' AND offered_service_code IS NULL AND offered_service_text IS NOT NULL)
  )
);

CREATE TABLE exchange_request_proposals (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  wanted_date_iso TEXT NOT NULL,
  wanted_service_kind TEXT NOT NULL CHECK (wanted_service_kind IN ('CATALOG','REST','FREE_TEXT')),
  wanted_service_code TEXT,
  wanted_service_text TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  CHECK (
    (wanted_service_kind = 'CATALOG' AND wanted_service_code IS NOT NULL AND wanted_service_text IS NULL) OR
    (wanted_service_kind = 'REST' AND wanted_service_code IS NOT NULL AND wanted_service_text IS NULL) OR
    (wanted_service_kind = 'FREE_TEXT' AND wanted_service_code IS NULL AND wanted_service_text IS NOT NULL)
  )
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_a_id TEXT NOT NULL,
  user_b_id TEXT NOT NULL,
  chosen_wanted_date_iso TEXT,
  chosen_wanted_service_kind TEXT CHECK (chosen_wanted_service_kind IN ('CATALOG','REST','FREE_TEXT')),
  chosen_wanted_service_code TEXT,
  chosen_wanted_service_text TEXT,
  status TEXT NOT NULL CHECK (status IN ('active','locked','closed')),
  accepted_by_a INTEGER NOT NULL DEFAULT 0 CHECK (accepted_by_a IN (0,1)),
  accepted_by_b INTEGER NOT NULL DEFAULT 0 CHECK (accepted_by_b IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  locked_at TEXT,
  closed_at TEXT,
  FOREIGN KEY (request_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (
    (
      chosen_wanted_date_iso IS NULL AND
      chosen_wanted_service_kind IS NULL AND
      chosen_wanted_service_code IS NULL AND
      chosen_wanted_service_text IS NULL
    )
    OR
    (
      chosen_wanted_date_iso IS NOT NULL AND
      (
        (chosen_wanted_service_kind = 'CATALOG' AND chosen_wanted_service_code IS NOT NULL AND chosen_wanted_service_text IS NULL) OR
        (chosen_wanted_service_kind = 'REST' AND chosen_wanted_service_code IS NOT NULL AND chosen_wanted_service_text IS NULL) OR
        (chosen_wanted_service_kind = 'FREE_TEXT' AND chosen_wanted_service_code IS NULL AND chosen_wanted_service_text IS NOT NULL)
      )
    )
  ),
  UNIQUE (request_id, user_a_id, user_b_id)
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_user_id TEXT NOT NULL,
  client_message_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (conversation_id, sender_user_id, client_message_id)
);

CREATE UNIQUE INDEX uq_exchange_requests_open_owner_offer
ON exchange_requests (
  owner_user_id,
  offered_date_iso,
  offered_service_kind,
  COALESCE(offered_service_code, ''),
  COALESCE(LOWER(TRIM(offered_service_text)), '')
)
WHERE status = 'open';

CREATE INDEX idx_exchange_requests_status_expires ON exchange_requests(status, expires_at);
CREATE INDEX idx_exchange_requests_status_created ON exchange_requests(status, created_at DESC);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at ASC);
```

## 4) Pagination (figee)

Methode unique: pagination par page.

- Query: `page` (entier >= 1, defaut `1`)
- Taille fixe serveur: `PAGE_SIZE = 20`
- `GET /exchanges/requests`: tri `createdAt DESC`
- `GET /exchanges/conversations`: tri `updatedAt DESC`

Format:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "hasNext": false
  }
}
```

## 5) Transitions de statut (explicites)

### `exchange_requests.status`

- `open` -> `closed`: quand A choisit B via `POST /exchanges/conversations/:id/choose`.
- `open` -> supprimee: a expiration (`expires_at <= now`) via purge.
- `open` -> supprimee: quand double acceptation A+B est atteinte (nettoyage final sans historique).
- `closed` -> supprimee: a expiration (`expires_at <= now`) via purge.
- Interdit: `closed` -> `open`.

### `conversations.status`

- `active` -> `locked`: quand A choisit B.
- `active` -> `closed`: refus avant lock, ou fermeture des conversations non retenues apres un `choose`.
- `locked` -> supprimee: double acceptation A+B (nettoyage final).
- Interdit: annulation in-app apres `locked` (hors app uniquement). Si besoin: A recree une demande.
- Interdit: retour `locked` -> `active`.

### Regle `updated_at` (conversations)

- Initialisation a la creation: `updated_at = created_at`.
- Mis a jour a chaque evenement conversationnel:
  - envoi de message
  - `choose` (lock)
  - `accept`
  - fermeture (`closed`)

## 6) Limites, validations et erreurs

### Limites minimales v1

- Nombre max de contre-propositions par demande: `5`.
- Message:
  - longueur min apres trim: `1`
  - longueur max: `1000` caracteres
- `service_text`:
  - requis uniquement pour `FREE_TEXT`
  - longueur max recommandee: `120` caracteres

### Rate limit minimum (serveur)

- `POST /auth/register`: `5` requetes / `15 min` / IP.
- `POST /auth/login`: `5` requetes / `15 min` / IP.
- `POST /exchanges/conversations/:id/message`: `30` requetes / minute / session.

### Erreurs standard (codes recommandes)

- `400 BAD_REQUEST`: payload invalide.
- `401 UNAUTHORIZED`: token absent/invalide/expire.
- `403 FORBIDDEN`: non participant, auto-reponse owner, depot interdit.
- `404 NOT_FOUND`: ressource absente.
- `409 CONFLICT`: demande/conversation verrouillee ou conflit d'etat.
- `410 GONE`: demande/conversation expiree.
- `429 TOO_MANY_REQUESTS`: limite de debit atteinte.

## 7) Contrat API v1

Erreur standard:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Message lisible"
  }
}
```

### Auth

#### `POST /auth/register`
Body:
```json
{ "prenom": "Jean", "nom": "Dupont", "email": "jean@example.com", "password": "motdepasse" }
```
`201`:
```json
{
  "token": "opaque_session_token",
  "expiresAt": "2026-03-01T10:00:00.000Z",
  "user": { "id": "u_1", "prenom": "Jean", "nom": "Dupont" }
}
```

#### `POST /auth/login`
Body:
```json
{ "email": "jean@example.com", "password": "motdepasse" }
```
`200`: meme format que register.

#### `POST /auth/logout`
Auth requise. `204`.

#### `GET /me`
Auth requise.
`200`:
```json
{
  "user": { "id": "u_1", "prenom": "Jean", "nom": "Dupont", "email": "jean@example.com" }
}
```

### Requests

#### `GET /exchanges/requests?page=1`
Auth requise. Retourne demandes `open` non expirees.
`200`:
```json
{
  "items": [
    {
      "id": "r_1",
      "owner": { "id": "u_a", "prenom": "Alice", "nom": "Martin" },
      "offeredDateISO": "2026-02-20",
      "offeredService": { "kind": "CATALOG", "code": "S1", "text": null },
      "counterProposals": [
        {
          "wantedDateISO": "2026-02-22",
          "wantedService": { "kind": "REST", "code": "REST", "text": null }
        }
      ],
      "status": "open",
      "createdAt": "2026-02-08T12:00:00.000Z",
      "expiresAt": "2026-03-10T12:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "hasNext": false }
}
```

#### `POST /exchanges/requests`
Auth requise.
Body:
```json
{
  "offeredDateISO": "2026-02-20",
  "offeredService": { "kind": "CATALOG", "code": "S1", "text": null },
  "counterProposals": [
    {
      "wantedDateISO": "2026-02-22",
      "wantedService": { "kind": "REST", "code": "REST", "text": null }
    }
  ]
}
```
`201`:
```json
{ "requestId": "r_1", "expiresAt": "2026-03-10T12:00:00.000Z" }
```
`409` si doublon ouvert.

#### `POST /exchanges/requests/:id/respond`
Auth requise.
Regles:
- owner ne peut pas repondre (`403`)
- idempotent via `UNIQUE (request_id, user_a_id, user_b_id)`
Body:
```json
{
  "wantedDateISO": "2026-02-22",
  "wantedService": { "kind": "REST", "code": "REST", "text": null }
}
```
Reponse:
- `201` si cree
- `200` si deja existante
```json
{ "conversationId": "c_1", "status": "active", "idempotent": false }
```

### Conversations

#### `GET /exchanges/conversations?page=1`
Auth requise. Retourne conversations de l'utilisateur.
`200`:
```json
{
  "items": [
    {
      "id": "c_1",
      "requestId": "r_1",
      "userA": { "id": "u_a", "prenom": "Alice", "nom": "Martin" },
      "userB": { "id": "u_b", "prenom": "Bob", "nom": "Durand" },
      "chosenProposal": null,
      "status": "active",
      "acceptedByA": false,
      "acceptedByB": false,
      "updatedAt": "2026-02-08T13:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "hasNext": false }
}
```

#### `POST /exchanges/conversations/:id/choose`
Auth requise. A uniquement.
Body:
```json
{
  "chosenProposal": {
    "wantedDateISO": "2026-02-22",
    "wantedService": { "kind": "REST", "code": "REST", "text": null }
  }
}
```
Effets:
- conversation cible -> `locked`
- autres conversations de la demande -> fermees/supprimees
- demande -> `closed`
`200`:
```json
{ "status": "locked" }
```

#### `POST /exchanges/conversations/:id/accept`
Auth requise (A ou B).
`200`:
```json
{ "status": "locked", "bothAccepted": false }
```
ou
```json
{ "status": "closed", "bothAccepted": true }
```
Si `bothAccepted=true`: suppression definitive (demande + conversations + messages).

#### `POST /exchanges/conversations/:id/message`
Auth requise.
Body:
```json
{ "clientMessageId": "cli-msg-123", "body": "Salut, dispo pour valider ?" }
```
Idempotent par `(conversation_id, sender_user_id, client_message_id)`:
- `201` creation
- `200` deja existant
Reponse:
```json
{ "messageId": "m_1", "createdAt": "2026-02-08T13:02:00.000Z", "idempotent": false }
```

#### `GET /exchanges/conversations/:id/messages`
Auth requise + participant.
`200`:
```json
{
  "items": [
    {
      "id": "m_1",
      "senderUserId": "u_b",
      "clientMessageId": "cli-msg-123",
      "body": "Salut, dispo pour valider ?",
      "createdAt": "2026-02-08T13:02:00.000Z"
    }
  ]
}
```

## 8) Expiration v1 (exacte, SQLite compatible)

Strategie hybride:

1. Purge au demarrage serveur.
2. Purge periodique interne toutes les 15 minutes (`setInterval`).
3. Purge opportuniste avant:
   - `GET /exchanges/requests`
   - `POST /exchanges/requests`
   - `POST /exchanges/requests/:id/respond`
   - `GET /exchanges/conversations`

SQL:

```sql
DELETE FROM exchange_requests
WHERE expires_at <= :now_iso;
```

Grace a `ON DELETE CASCADE`, proposals/conversations/messages associes sont supprimes.

## 9) Liste fichiers client (arborescence stricte)

Note: `js/views/` n'existe pas actuellement, il sera cree pour `js/views/exchange/...`.

### `js/data/exchange/...`
- `js/data/exchange/config.js`: baseURL API, timeout, cles storage token.
- `js/data/exchange/http-client.js`: wrapper fetch + auth + depot header + erreurs normalisees.
- `js/data/exchange/auth-client.js`: appels `/auth/register|login|logout|me`.
- `js/data/exchange/requests-client.js`: appels `/exchanges/requests` et `/respond`.
- `js/data/exchange/conversations-client.js`: appels `/exchanges/conversations*` + messages.

### `js/domain/exchange/...`
- `js/domain/exchange/service-value.js`: validation/normalisation `kind + (code|text)`.
- `js/domain/exchange/request-rules.js`: validations de demande et contre-propositions.
- `js/domain/exchange/conversation-rules.js`: transitions `active/locked/closed`.
- `js/domain/exchange/message-rules.js`: validation message + `clientMessageId`.

### `js/state/exchange/...`
- `js/state/exchange/auth-state.js`: `currentUser` + statut auth + erreurs.
- `js/state/exchange/requests-state.js`: liste demandes, filtre, selection, loading/error.
- `js/state/exchange/conversations-state.js`: liste conversations, selection, loading/error.
- `js/state/exchange/messages-state.js`: cache messages + queue offline pending + retry.

### `js/components/exchange/...`
- `js/components/exchange/auth-panel.js`: UI auth exchange.
- `js/components/exchange/requests-list.js`: UI liste demandes publiques.
- `js/components/exchange/request-form.js`: UI creation demande.
- `js/components/exchange/conversations-list.js`: UI liste conversations.
- `js/components/exchange/conversation-thread.js`: UI conversation (messages + actions).

### `js/views/exchange/...`
- `js/views/exchange/exchange-view.js`: orchestration de la vue Echange.
- `js/views/exchange/exchange-route.js`: point d'entree routeur pour `#view-exchanges`.

## 10) Restriction depot

- Variable serveur: `PLANNINGO_DEPOT_ID`.
- Header client obligatoire: `X-Planningo-Depot`.
- Middleware serveur: `403 DEPOT_FORBIDDEN` si mismatch.

## 11) Note de deploiement SQLite

SQLite requiert un stockage persistant cote serveur (disque/volume).

- En conteneur: monter un volume persistant.
- Sans volume persistant, redemarrage serveur = perte des donnees (users/sessions/demandes/conversations/messages).
