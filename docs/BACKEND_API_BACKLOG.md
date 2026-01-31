# Backend API / WS Backlog

> Backlog of backend endpoints and WebSocket events needed for Fog, Vision, Pathing, and per-player privacy features.
> Frontend architecture reference: `docs/АРХИТЕКТУРНЫЙ ПЛАН ВНЕДРЕНИЯ НОВЫХ ФИЧ.md`.
> Sync contract: `docs/NETWORK_SYNC_CONTRACT.md`.

---

## Legend

- **Direction:** `C→S` = client to server, `S→C` = server to client, `C↔S` = both directions
- **Priority:** P0 = required for MVP (Iteration 1), P1 = Iteration 2, P2 = Iteration 3
- **Auth/Role:** DM = only DM can send/trigger, Player = any authenticated player, All = broadcast to all

---

## Endpoints & Events

| # | Type | Name | Direction | Payload (high-level) | Auth/Role | Needed for | Priority | Notes |
|---|------|------|-----------|---------------------|-----------|------------|----------|-------|
| 1 | WS | `fog_history_patch` | C→S→All | `{ origin, scope: 'party', playerId: null, cells: [row,col,0\|1][] }` | DM (manual brush), Any (auto-reveal) | Fog | P0 | Relay broadcast. Values are history only (0/1), never 2. See sync contract. |
| 2 | WS | `battleInfo` (extended) | S→C | Existing full state + `fog: FogState, vision: VisionState, pathing: PathingState` | All (receive) | Fog, Vision, Pathing | P0 | Initial snapshot on connect/reconnect. Must include fog history + light sources + terrain grid. |
| 3 | WS | `vision_patch` | C→S→All | `{ origin, op: 'upsert'\|'remove', sources: LightSource[] }` | DM | Vision | P1 | Light source CRUD. Broadcast to all — no privacy concern. |
| 4 | WS | `pathing_patch` | C→S→All | `{ origin, cells: [row,col,0\|1\|2][] }` | DM | Pathing | P2 | Terrain grid changes. Broadcast to all. |
| 5 | WS | `fog_history_patch` (perPlayer) | C→S→**filtered** | `{ origin, scope: 'player', playerId, cells: [...] }` | DM + owning Player | Per-player fog privacy | P2 | **Requires Mode B.** Server sends only to `playerId` client + DM. Other players must NOT receive. |
| 6 | WS | Fan-out filter logic | S internal | Server inspects `scope` field on `fog_history_patch`. If `scope='player'`, route to `playerId` + DM only. | — | Per-player fog privacy | P2 | Requires server to maintain `playerId → connectionId` mapping. |
| 7 | HTTP | `GET /api/session/:id/fog/:playerId` | C→S | Response: `{ history: FogHistoryGrid }` | Player (own) or DM (any) | Per-player fog (initial load) | P2 | **Decision point:** alternative to embedding per-player fog in `battleInfo`. Useful if per-player grids are large or numerous. |
| 8 | HTTP | `PUT /api/session/:id/fog/mode` | C→S | `{ mode: 'party' \| 'perPlayer' }` | DM | Per-player fog config | P2 | DM switches fog mode. Server may need to initialize `historyByPlayer` from `historyParty` on switch. |
| 9 | WS | Role/permissions check | S internal | Server validates that only DM can send `vision_patch`, `pathing_patch`, `fog_history_patch` (manual brush). Auto-reveal patches from players are allowed. | — | Security | P1 | Without this, any client can modify fog/terrain. MVP can skip if trust model is "DM shares link only with trusted players". |
| 10 | HTTP | `POST /api/session/:id/save` | C→S | Full `EncounterSave` including fog/vision/pathing | DM | Persistence | P0 | Existing endpoint, needs schema extension to include new subsystem state. |
| 11 | HTTP | `GET /api/session/:id/save` | S→C | Full `EncounterSave` | DM or Player | Persistence (load) | P0 | Same as above — response schema must include fog/vision/pathing. |
| 12 | WS | Connection identity | C→S (on connect) | `{ clientId, userId, role }` | All | Fan-out routing | P2 | Server needs to know which connection belongs to which player for per-player fog routing. May already exist in current auth handshake. |

---

## Mode A vs Mode B Summary

| Aspect | Mode A (relay-only) | Mode B (server-filtered) |
|--------|--------------------|-----------------------|
| Backend changes | None (existing relay) | Fan-out filter + connection→player mapping |
| Fog mode support | `party` only | `party` + `perPlayer` |
| Privacy | None — all clients see all data | Per-player fog is private |
| Rows from table above | #1, #2, #3, #4, #10, #11 | All rows (#1–#12) |
| Target iteration | Iterations 1–2 | Iteration 3 |

---

## Notes

- All WS events follow the anti-echo / sync contract from `docs/NETWORK_SYNC_CONTRACT.md`: `origin` field, `isApplyingRemoteRef` pattern, initial FULL gate.
- Auto-reveal is **mover-authoritative** (locked decision D1 in arch plan): the mover's client computes newly visible cells and sends `fog_history_patch`. Other clients apply the patch only.
- Existing `encounter_patch` (token coords) is unaffected by these changes.
- `battleInfo` schema extension is backward-compatible: new fields (`fog`, `vision`, `pathing`) can be optional/undefined for sessions created before the feature ships.
