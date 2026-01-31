import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { UnknownAction } from 'redux';

import { RootState, RootStore } from 'app/store';
import { AuthState } from 'entities/auth/model';
import { AuthStore } from 'entities/auth/model/types';
import { creatureActions } from 'entities/creature/model';
import {
  encounterActions,
  EncounterSave,
  EncounterState,
  EncounterStore,
  FogHistoryGrid,
  Participant as EncounterParticipant,
  setNewSaveEncounterVersion,
} from 'entities/encounter/model';
import { loggerActions } from 'entities/logger/model';
import {
  BattleInfoData,
  EncounterPatchData,
  FogHistoryPatchData,
  Participant,
  ParticipantsInfoData,
  SessionContext,
  SessionMessage,
} from 'entities/session/model';
import { ParticipantsSessionContext } from 'entities/session/model/sessionContext';
import { toast } from 'react-toastify';
import { computeFogHistoryPatch, computeParticipantsCoordsPatch, isOnlyCoordsChange, UUID } from 'shared/lib';
import { Placeholder } from 'shared/ui';
import { Props } from './types';

const DEBOUNCE_TIME = 200;
const FULL_STATE_INTERVAL_MS = 10_000;

// Stable client ID for the lifetime of this tab
const CLIENT_ID = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const EncounterTrackerSessionProvider = ({ children }: Props) => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const [isSaveFirstFetch, setIsSaveFirstFetch] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [encounterId, setEncounterId] = useState<UUID | null>(null);
  const [saveVersionHash, setSaveVersionHash] = useState<UUID>('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  // --- Patch sync refs ---
  // Last known participants state (updated on every send AND remote apply)
  const lastKnownParticipantsRef = useRef<EncounterParticipant[]>([]);
  // Last known fog history (updated on every send AND remote apply)
  const lastKnownFogHistoryRef = useRef<FogHistoryGrid | null>(null);
  // Last known encounter-level meta (updated on every send AND remote apply)
  const lastKnownEncounterMetaRef = useRef({
    currentRound: 1,
    currentTurnIndex: 0,
    hasStarted: false,
  });
  const lastFullSentAtRef = useRef<number>(0);
  // true while applying remote data — blocks outbound sync
  const isApplyingRemoteRef = useRef<boolean>(false);
  // Gate: no PATCH allowed until first FULL exchange succeeded
  const hasSyncedInitialFullRef = useRef<boolean>(false);
  // Stable debounce timer (not recreated on render)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    `${import.meta.env.VITE_WS_HOST}/api/table/session/${id}/connect`,
    {
      onOpen(_event) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('WebSocket connected, clientId:', CLIENT_ID);
        }
        toast.success('Соединение установлено');
        // Force full state on reconnect
        lastFullSentAtRef.current = 0;
        hasSyncedInitialFullRef.current = false;
      },
      onClose(_event) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('WebSocket disconnected');
        }
      },
      onError(error) {
        if (import.meta.env.DEV) {
          console.error('WebSocket error:', error);
        }
        toast.error('Упс, произошла ошибка');
      },
      shouldReconnect: () => !isError,
      reconnectAttempts: 5,
      reconnectInterval: 2000,
    },
  );

  const { id: userId } = useSelector<AuthStore>((state) => state.auth) as AuthState;
  const { encounterId: stateEncounterId } = useSelector<EncounterStore>(
    (state) => state.encounter,
  ) as EncounterState;

  // ========================
  // Helper: merge patch into ref so diff base stays current
  // ========================
  const applyPatchToRef = (patch: Record<string, { cellsX: number; cellsY: number }>) => {
    const updated = lastKnownParticipantsRef.current.map((p) => {
      const coords = patch[p.id];
      if (coords) {
        return { ...p, cellsCoords: { cellsX: coords.cellsX, cellsY: coords.cellsY } };
      }
      return p;
    });
    lastKnownParticipantsRef.current = updated;
  };

  // ========================
  // Helper: apply fog patch to diff base ref
  // ========================
  const applyFogPatchToRef = (cells: FogHistoryPatchData['cells']) => {
    const grid = lastKnownFogHistoryRef.current;
    if (!grid) return;
    // Deep clone rows that are affected (Immer-style: only changed rows)
    const cloned = [...grid];
    for (const [row, col, val] of cells) {
      if (row >= 0 && row < cloned.length && col >= 0 && col < (cloned[0]?.length ?? 0)) {
        // Clone row on first mutation
        if (cloned[row] === grid[row]) {
          cloned[row] = [...grid[row]];
        }
        cloned[row][col] = val;
      }
    }
    lastKnownFogHistoryRef.current = cloned;
  };

  // ========================
  // Handle incoming messages
  // ========================
  useEffect(() => {
    if (!lastJsonMessage) return;

    const message = lastJsonMessage as SessionMessage;

    switch (message.type) {
      case 'error':
        toast.error('Упс, произошла ошибка');
        setIsError(true);
        break;

      case 'participantsInfo': {
        if (!message.data) return;

        const data = message.data as ParticipantsInfoData;

        setParticipants(data.participants);

        if (isAdmin) return;

        const admin = data.participants.find(({ role }) => role === 'admin');
        if (admin?.id === userId) {
          setIsAdmin(true);
        }
        break;
      }

      case 'battleInfo': {
        if (!message.data) return;

        const state = (message.data as BattleInfoData).encounterData;

        if (
          saveVersionHash &&
          state.encounterState &&
          saveVersionHash === state.encounterState?.saveVersionHash
        ) {
          setEncounterId(state.encounterState.encounterId);
          setIsSaveFirstFetch(false);
          return;
        }

        if (isAdmin && isSaveFirstFetch && state.encounterState.encounterId === stateEncounterId) {
          setEncounterId(state.encounterState.encounterId);
          dispatch(setNewSaveEncounterVersion() as unknown as UnknownAction);
          setIsSaveFirstFetch(false);
          return;
        }

        // Mark remote — blocks outbound sync until microtask clears
        isApplyingRemoteRef.current = true;

        dispatch(encounterActions.setState(state.encounterState));
        dispatch(creatureActions.setState(state.creaturesState));
        dispatch(loggerActions.setState(state.loggerState));
        dispatch(encounterActions.setEncounterId(state.encounterState.encounterId));
        setEncounterId(state.encounterState.encounterId);

        // Sync diff bases to received state
        lastKnownParticipantsRef.current = [...state.encounterState.participants];
        lastKnownFogHistoryRef.current = state.encounterState.fog?.historyParty ?? null;
        lastKnownEncounterMetaRef.current = {
          currentRound: state.encounterState.currentRound,
          currentTurnIndex: state.encounterState.currentTurnIndex,
          hasStarted: state.encounterState.hasStarted,
        };

        // Mark initial full as synced — PATCH is now allowed
        hasSyncedInitialFullRef.current = true;

        // Release flag on next microtask (after React batch commits)
        Promise.resolve().then(() => {
          isApplyingRemoteRef.current = false;
        });
        break;
      }

      case 'encounter_patch': {
        if (!message.data) return;

        const patchData = message.data as EncounterPatchData;

        // Anti-echo: ignore our own messages
        if (patchData.origin === CLIENT_ID) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[PATCH] skip own');
          }
          return;
        }

        // Patch-before-full: if we haven't synced initial full yet, ignore
        // (full state will arrive shortly and contains all coords)
        if (!hasSyncedInitialFullRef.current) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[PATCH] skip — no initial full yet');
          }
          return;
        }

        // Mark remote
        isApplyingRemoteRef.current = true;

        dispatch(encounterActions.patchParticipantsCoords(patchData.patch.participants));

        // Update diff base so we don't echo these coords back
        applyPatchToRef(patchData.patch.participants);

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[PATCH] applied remote:', patchData.patch.participants);
        }

        // Release flag on next microtask
        Promise.resolve().then(() => {
          isApplyingRemoteRef.current = false;
        });
        break;
      }

      case 'fog_history_patch': {
        if (!message.data) return;

        const patchData = message.data as FogHistoryPatchData;

        // Anti-echo: ignore our own messages
        if (patchData.origin === CLIENT_ID) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[FOG PATCH] skip own');
          }
          return;
        }

        // Patch-before-full gate
        if (!hasSyncedInitialFullRef.current) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[FOG PATCH] skip — no initial full yet');
          }
          return;
        }

        // Mark remote
        isApplyingRemoteRef.current = true;

        dispatch(encounterActions.applyFogHistoryPatchParty(patchData.cells));

        // Update fog diff base
        applyFogPatchToRef(patchData.cells);

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[FOG PATCH] applied remote:', patchData.cells.length, 'cells');
        }

        // Release flag on next microtask
        Promise.resolve().then(() => {
          isApplyingRemoteRef.current = false;
        });
        break;
      }
    }
  }, [lastJsonMessage]);

  // ========================
  // State selectors
  // ========================
  const {
    logger: loggerState,
    encounter: encounterState,
    creatures: creaturesState,
  } = useSelector<RootStore>((state) => state) as RootState;

  // ========================
  // Stable sync function (ref-based debounce, not recreated on render)
  // ========================
  const syncState = useCallback(
    (body: EncounterSave, wsReadyState: ReadyState) => {
      clearTimeout(syncTimerRef.current);

      syncTimerRef.current = setTimeout(() => {
        if (encounterId === null || wsReadyState !== ReadyState.OPEN) {
          return;
        }

        // Anti-echo: skip if applying remote
        if (isApplyingRemoteRef.current) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[SYNC] skip — remote in progress');
          }
          return;
        }

        const now = Date.now();
        const timeSinceLastFull = now - lastFullSentAtRef.current;
        const shouldSendFull =
          !hasSyncedInitialFullRef.current || timeSinceLastFull > FULL_STATE_INTERVAL_MS;

        // Compute diffs
        const coordsPatch = computeParticipantsCoordsPatch(
          lastKnownParticipantsRef.current,
          body.encounterState.participants,
        );

        const fogPatch =
          lastKnownFogHistoryRef.current && body.encounterState.fog?.historyParty
            ? computeFogHistoryPatch(
                lastKnownFogHistoryRef.current,
                body.encounterState.fog.historyParty,
              )
            : null;

        // Nothing changed at all → don't send anything
        if (coordsPatch === null && fogPatch === null && !shouldSendFull) {
          return;
        }

        // Guard: encounter-level meta fields unchanged (round, turn, hasStarted).
        // If any differ → FULL is required regardless of PATCH eligibility.
        const meta = lastKnownEncounterMetaRef.current;
        const encounterMetaUnchanged =
          meta.currentRound === body.encounterState.currentRound &&
          meta.currentTurnIndex === body.encounterState.currentTurnIndex &&
          meta.hasStarted === body.encounterState.hasStarted;

        const onlyCoordsChanged =
          coordsPatch !== null &&
          fogPatch === null &&
          encounterMetaUnchanged &&
          isOnlyCoordsChange(
            lastKnownParticipantsRef.current,
            body.encounterState.participants,
          );

        // fogPatch exists, no coord changes, and no non-coord participant fields changed.
        // isOnlyCoordsChange checks all Participant keys except cellsCoords by ===.
        // encounterMetaUnchanged checks encounter-level fields outside participants[].
        const onlyFogChanged =
          fogPatch !== null &&
          coordsPatch === null &&
          encounterMetaUnchanged &&
          isOnlyCoordsChange(
            lastKnownParticipantsRef.current,
            body.encounterState.participants,
          );

        if (onlyCoordsChanged && !shouldSendFull && coordsPatch) {
          // Send coords PATCH
          sendJsonMessage({
            type: 'encounter_patch',
            data: {
              origin: CLIENT_ID,
              patch: { participants: coordsPatch },
            },
          });

          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[SYNC] sent coords PATCH:', coordsPatch);
          }
        } else if (onlyFogChanged && !shouldSendFull && fogPatch) {
          // Send fog PATCH
          sendJsonMessage({
            type: 'fog_history_patch',
            data: {
              origin: CLIENT_ID,
              scope: 'party',
              playerId: null,
              cells: fogPatch,
            },
          });

          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[SYNC] sent fog PATCH:', fogPatch.length, 'cells');
          }
        } else {
          // Send FULL state (fallback — always safe)
          sendJsonMessage(body);
          lastFullSentAtRef.current = now;
          hasSyncedInitialFullRef.current = true;

          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[SYNC] sent FULL', !encounterMetaUnchanged ? '(meta changed)' : '');
          }
        }

        // Update diff bases
        lastKnownParticipantsRef.current = [...body.encounterState.participants];
        lastKnownFogHistoryRef.current = body.encounterState.fog?.historyParty ?? null;
        lastKnownEncounterMetaRef.current = {
          currentRound: body.encounterState.currentRound,
          currentTurnIndex: body.encounterState.currentTurnIndex,
          hasStarted: body.encounterState.hasStarted,
        };
      }, DEBOUNCE_TIME);
    },
    [encounterId, sendJsonMessage],
  );

  // ========================
  // Sync triggers
  // ========================

  // Trigger on saveVersionHash change (non-coord changes: turns, initiative, etc.)
  useEffect(() => {
    setSaveVersionHash(encounterState.saveVersionHash);
    syncState({ loggerState, encounterState, creaturesState }, readyState);
  }, [encounterState.saveVersionHash]);

  // Trigger on participants change (coord-only changes from local drag)
  useEffect(() => {
    // Skip initial populate
    if (
      lastKnownParticipantsRef.current.length === 0 &&
      encounterState.participants.length > 0
    ) {
      lastKnownParticipantsRef.current = [...encounterState.participants];
      return;
    }

    syncState({ loggerState, encounterState, creaturesState }, readyState);
  }, [encounterState.participants]);

  // Trigger on fog history change (brush strokes / auto-reveal)
  useEffect(() => {
    // Skip until initial fog is set
    if (!lastKnownFogHistoryRef.current && encounterState.fog?.historyParty) {
      lastKnownFogHistoryRef.current = encounterState.fog.historyParty;
      return;
    }

    syncState({ loggerState, encounterState, creaturesState }, readyState);
  }, [encounterState.fog?.historyParty]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => clearTimeout(syncTimerRef.current);
  }, []);

  return (
    <SessionContext value={true}>
      <ParticipantsSessionContext value={participants}>
        {isError ? (
          <Placeholder
            title='Ошибка'
            subtitle='Проверьте правильность данных сессии'
            buttonText='Перейти в бестиарий'
          ></Placeholder>
        ) : (
          children
        )}
      </ParticipantsSessionContext>
    </SessionContext>
  );
};
