# Network Sync Contract

> Canonical reference for WebSocket synchronization rules in Encounterium.
> All sync logic lives in `src/app/providers/encounterTrackerSessionProvider.tsx`.

---

## 1. Terms

| Term | Definition |
|------|-----------|
| **FULL state sync** | Sending the entire `EncounterSave` (`{encounterState, creaturesState, loggerState}`) via `battleInfo` message. Receiver replaces local state entirely. |
| **PATCH sync** | Sending a minimal diff for a specific domain (e.g. `encounter_patch` carries only changed `participants.cellsCoords`). Receiver merges into existing state. |
| **Origin / anti-echo** | Each client has a stable `CLIENT_ID`. Every outbound PATCH includes `origin: CLIENT_ID`. Inbound PATCHes with matching origin are silently dropped. |
| **Initial FULL gate** | `hasSyncedInitialFullRef` — no PATCH is sent or applied until the first FULL exchange completes on this connection. Gate opens on whichever happens first: receiving inbound `battleInfo` (line 177) or sending outbound FULL (line 303). Resets to `false` on every `onOpen`. |
| **Periodic FULL** | Every `FULL_STATE_INTERVAL_MS` (10 s) a FULL is sent regardless of change type, guaranteeing convergence. |
| **Diff base** | `lastKnownParticipantsRef` — the participant snapshot used to compute the next diff. Updated on every outbound send AND every inbound remote apply. |

---

## 2. Main Principle

> **If in doubt — send FULL. PATCH is allowed only under strictly described rules below. A redundant FULL is harmless; a wrong PATCH corrupts state.**

---

## 3. PATCH Rules

### Patch Domains (canonical registry)

> **This table is the single source of truth for all PATCH types.** A domain must be listed here before any code is written. Architecture details and payload shapes are in `docs/АРХИТЕКТУРНЫЙ ПЛАН ВНЕДРЕНИЯ НОВЫХ ФИЧ.md`.

| Domain | Message type | Stored fields patched | Who can send | Privacy | Fallback | Status |
|--------|-------------|----------------------|-------------|---------|----------|--------|
| Token coordinates | `encounter_patch` | `participants[].cellsCoords` | Any client (drag) | None — broadcast | If non-coord fields changed → FULL | **Implemented** |
| Fog history | `fog_history_patch` | `fog.historyParty` or `fog.historyByPlayer[playerId]` cells (`0\|1` only, never `2`) | DM (brush) or mover client (auto-reveal) | `scope='party'`: broadcast. `scope='player'`: requires server fan-out (Mode B) for privacy. | If unsure whether only fog changed → FULL | **Implemented** (party mode) |
| Light sources | `vision_patch` | `vision.sources[]` (upsert/remove `LightSource` entities) | DM only | None — broadcast | If unsure → FULL | **Planned** (Iter 2) |
| Terrain grid | `pathing_patch` | `pathing.grid` cells (`0\|1\|2`) | DM only | None — broadcast | If unsure → FULL | **Planned** (Iter 2–3) |
| Visibility mask | — | **Not synced.** Computed locally from `vision.sources` + occlusion + token positions. | — | — | — | N/A (ephemeral) |
| Derived fog (0/1/2) | — | **Not synced.** Computed locally from fog history + visibility mask. | — | — | — | N/A (ephemeral) |

Everything not listed above (initiative, turn, round, participant add/remove, creatures, logger) **must** go as FULL.

### Gate

PATCH is never sent before initial FULL exchange (`hasSyncedInitialFullRef === false` blocks outbound). See `encounterTrackerSessionProvider.tsx:264-265`.

### Inbound PATCH without base

Current project decision: **ignore** (skip with DEV log). The initial FULL will arrive shortly and contains all data. No buffering. See `encounterTrackerSessionProvider.tsx:200-208`.

### Anti-echo pipeline

1. Outbound PATCH includes `origin: CLIENT_ID`
2. Inbound handler checks `patchData.origin === CLIENT_ID` → skip
3. `isApplyingRemoteRef = true` before dispatch → blocks outbound sync
4. `applyPatchToRef(patch)` merges coords into diff base → prevents diff from "seeing" remote change as local
5. `Promise.resolve().then()` releases `isApplyingRemoteRef` after React batch commit

---

## 4. Invariants

1. **Diff base is updated on both send and remote apply.** `lastKnownParticipantsRef` must reflect the latest known state from any source. If not — echo loop.
2. **After remote PATCH, no outbound PATCH fires for the same change.** Guaranteed by `isApplyingRemoteRef` + diff base update.
3. **Periodic FULL is unconditional (while connected).** Even if only coords changed, FULL is sent after `FULL_STATE_INTERVAL_MS` — but only when `readyState === OPEN` (line 249). This is the convergence safety net.
4. **`isOnlyCoordsChange` compares ALL participant keys except `cellsCoords`.** Uses `===` on every own key. New fields added to `Participant` type are automatically covered — no allowlist to maintain. See `computeParticipantsCoordsPatch.ts:48-74`.
5. **PATCH reducer does NOT bump `saveVersionHash`.** Only FULL-triggering actions (turns, initiative, add/remove) change the hash. Coords are high-frequency and bumping the hash would trigger redundant FULL syncs via the `saveVersionHash` effect. See `encounter.slice.ts:84-93`.
6. **`hasSyncedInitialFullRef` resets on reconnect.** Set to `false` in `onOpen`. First outbound sync after reconnect is always FULL.
7. **Sync function is debounced via `syncTimerRef` (200 ms).** Not recreated on render. Single stable `useCallback`.
8. **Missing entity in PATCH is silently skipped.** `patchParticipantsCoords` does `find()` — if participant ID not found, no mutation. No crash.
9. **Local drag never fires intermediate syncs.** DOM-only during drag; single `setCellsCoordinates` dispatch on dragEnd.
10. **Noop guard: if `coordsPatch === null && !shouldSendFull` — nothing is sent.** Prevents empty PATCHes and unnecessary FULLs.
11. **Encounter meta guard blocks PATCH when encounter-level fields changed.** `lastKnownEncounterMetaRef` tracks `{currentRound, currentTurnIndex, hasStarted}`. Both `onlyCoordsChanged` and `onlyFogChanged` require `encounterMetaUnchanged === true`; otherwise FULL is sent. Prevents PATCH when debounce coalesces a high-frequency change (drag/fog) with a turn/round action.

---

## 5. How to Add a New PATCH Type

Step-by-step procedure:

### 5.0 Register in Patch Domains table
Add the domain to the "Patch Domains" table in section 3 above **before writing any code**. Specify: message type, stored fields, who can send, privacy implications, fallback rule. Mark status as "Planned". Update to "Implemented" after PR merges. Also add the payload shape to `docs/АРХИТЕКТУРНЫЙ ПЛАН ВНЕДРЕНИЯ НОВЫХ ФИЧ.md` section F.

### 5.1 Add message type
In `src/entities/session/model/types.ts`: add new literal to `SessionMessage.type` union (e.g. `'fog_history_patch'`). Add a corresponding data type with `origin: string` and the patch payload.

### 5.2 Add reducer
In the relevant slice (e.g. `encounter.slice.ts`): add the apply action. It must:
- Merge patch into state without bumping `saveVersionHash`
- Silently skip unknown IDs / missing entities

### 5.3 Add compute function
Create `computeFogPatch(prev, next): FogPatch | null` following the pattern in `computeParticipantsCoordsPatch.ts`:
- Return `null` if nothing changed
- Add an `isOnlyFogChange()` guard that returns `false` if ANY non-fog field differs

### 5.4 Wire into provider
In `encounterTrackerSessionProvider.tsx`:
- Add inbound handler case with anti-echo (`origin === CLIENT_ID` check), initial FULL gate, `isApplyingRemoteRef`, `applyPatchToRef` equivalent
- Add outbound logic in `syncState`: compute diff, check `isOnlyXxxChange`, send PATCH or fall through to FULL
- **Always fall back to FULL when unsure**

### 5.5 Manual verification (mandatory before PR)
Run all checks from section 6 below.

---

## 6. Pre-PR Checklist

- [ ] **Two tabs**: open session in two browser tabs. Make the patched change in tab A. Verify tab B receives it correctly.
- [ ] **No echo loop**: after tab B applies the remote change, verify tab B does NOT send a PATCH back. Check console: no `[SYNC] sent PATCH` in tab B after receiving.
- [ ] **Reconnect**: disconnect tab B (e.g. toggle network in DevTools), make changes in tab A, reconnect tab B. Verify tab B receives full state and is consistent.
- [ ] **Patch-before-full**: open tab B, immediately send a PATCH from tab A before tab B finishes initial FULL. Verify tab B ignores the early PATCH (check `[PATCH] skip — no initial full yet` in console).
- [ ] **Non-patch changes → FULL**: make a non-coords change (e.g. change initiative, nextTurn). Verify console shows `[SYNC] sent FULL`, not PATCH.
- [ ] **Missing entity**: send a PATCH referencing a non-existent participant ID. Verify no crash, no state corruption.
- [ ] **Periodic FULL fires**: wait 10+ seconds after a PATCH-only period. Verify `[SYNC] sent FULL` appears.
- [ ] **`tsc --noEmit` passes**: no type errors after changes.

---

## FOR CODE AGENTS

```
1. НЕ отправляй PATCH для полей, не перечисленных в таблице "Patch Domains" (раздел 3).
   Если нужный домен не в таблице — сначала зарегистрируй его по процедуре из раздела 5.

2. ВСЕГДА добавляй origin: CLIENT_ID в каждый outbound PATCH.

3. ВСЕГДА проверяй origin === CLIENT_ID в inbound handler и пропускай свои сообщения.

4. ВСЕГДА оборачивай dispatch inbound PATCH в isApplyingRemoteRef = true / Promise.resolve().then(() => false).

5. ВСЕГДА обновляй diff base (lastKnownParticipantsRef или аналог) после КАЖДОГО применения remote PATCH.
   Пропуск этого шага = echo loop.

6. НЕ отправляй PATCH до завершения initial FULL exchange (проверяй hasSyncedInitialFullRef).

7. ВСЕГДА добавляй fallback на FULL: если isOnlyXxxChange() вернула false или есть любые
   сомнения — отправляй FULL. Лишний FULL безвреден.

8. НЕ добавляй новый PATCH тип без прохождения всех 8 пунктов чеклиста из раздела 6.
```
