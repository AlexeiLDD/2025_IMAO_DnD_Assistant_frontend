import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import uniqid from 'uniqid';

import { CoordsPatch, UUID } from 'shared/lib';
import { CellsCoordinates, FogHistoryCellPatch, FogHistoryGrid, FogHistoryValue, FogState, Participant } from './types';

// Grid constants (match BattleMap.tsx:24-26)
const FOG_ROWS = 18;
const FOG_COLS = 26;

export function createFogGrid(
  rows: number,
  cols: number,
  initial: FogHistoryValue = 0,
): FogHistoryGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => initial),
  );
}

const initialFogState: FogState = {
  enabled: false,
  mode: 'party',
  historyParty: createFogGrid(FOG_ROWS, FOG_COLS),
};

export type EncounterState = {
  encounterId: UUID | null;
  saveVersionHash: UUID;
  hasStarted: boolean;
  currentRound: number;
  currentTurnIndex: number;
  participants: Participant[];
  fog: FogState;
};

export const initialState: EncounterState = {
  encounterId: null,
  saveVersionHash: uniqid(),
  hasStarted: false,
  currentRound: 1,
  currentTurnIndex: 0,
  participants: [],
  fog: initialFogState,
};

export const setNewSaveEncounterVersion = createAsyncThunk<UUID, void>(
  'encounter/setNewSaveEncounterVersion',
  () => uniqid(),
);

const encounterSlice = createSlice({
  name: 'encounter',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(setNewSaveEncounterVersion.fulfilled, (state, action) => {
      state.saveVersionHash = action.payload;
    });
  },
  reducers: {
    setEncounterId: (state, action: PayloadAction<UUID | null>) => {
      state.encounterId = action.payload;
    },
    setState: (state, action: PayloadAction<EncounterState>) => {
      state.saveVersionHash = action.payload?.saveVersionHash;
      state.hasStarted = action.payload.hasStarted;
      state.currentRound = action.payload.currentRound;
      state.currentTurnIndex = action.payload.currentTurnIndex;
      state.participants = action.payload.participants;
      state.fog = action.payload.fog ?? initialFogState;
    },
    start: (state) => {
      state.hasStarted = true;
      state.participants.sort((a, b) => b.initiative - a.initiative);
    },
    nextTurn: (state) => {
      if (state.currentTurnIndex >= state.participants.length - 1) {
        state.currentRound++;
        state.currentTurnIndex = 0;
      } else {
        state.currentTurnIndex++;
      }
    },
    previousTurn: (state) => {
      if (state.currentTurnIndex === 0) {
        if (state.currentRound > 1) {
          state.currentRound--;
          state.currentTurnIndex = state.participants.length - 1;
        }
      } else {
        state.currentTurnIndex--;
      }
    },
    setCellsCoordinates: (state, action: PayloadAction<CellsCoordinates & { id: UUID }>) => {
      const { id, cellsX, cellsY } = action.payload;

      const creature = state.participants.find((part) => part.id === id);

      if (creature) {
        creature.cellsCoords = { cellsX, cellsY };
      }
    },
    /**
     * Batch update participant coordinates from a remote PATCH message.
     * Does NOT trigger saveVersionHash change - used for remote sync only.
     */
    patchParticipantsCoords: (state, action: PayloadAction<CoordsPatch>) => {
      const patch = action.payload;

      for (const [id, coords] of Object.entries(patch)) {
        const participant = state.participants.find((p) => p.id === id);
        if (participant) {
          participant.cellsCoords = { cellsX: coords.cellsX, cellsY: coords.cellsY };
        }
      }
    },
    setInitiativeOrder: (state, action: PayloadAction<Participant[]>) => {
      state.participants = action.payload;
    },
    addParticipant: (state, action: PayloadAction<Participant>) => {
      state.participants.push(action.payload);

      if (state.hasStarted) {
        state.participants.sort((a, b) => b.initiative - a.initiative);
      }
    },
    removeParticipant: (state, action: PayloadAction<UUID>) => {
      state.participants = state.participants.filter(
        (participant) => participant.id !== action.payload,
      );
    },
    sortByInitiative: (state) => {
      state.participants.sort((a, b) => b.initiative - a.initiative);
    },
    // ─── Fog reducers ───
    setFogEnabled: (state, action: PayloadAction<boolean>) => {
      state.fog.enabled = action.payload;
    },
    /**
     * Apply fog history patch (party mode). Merges cells into historyParty.
     * Does NOT bump saveVersionHash — used for high-frequency brush + auto-reveal.
     */
    applyFogHistoryPatchParty: (state, action: PayloadAction<FogHistoryCellPatch[]>) => {
      const grid = state.fog.historyParty;
      for (const [row, col, val] of action.payload) {
        if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
          grid[row][col] = val;
        }
      }
    },
    /**
     * Replace fog state entirely (from FULL sync).
     */
    setFogStateFromFull: (state, action: PayloadAction<FogState>) => {
      state.fog = action.payload;
    },

    updateInitiative: (state, action: PayloadAction<{ id: UUID; newInitiative: number }>) => {
      const { id, newInitiative } = action.payload;
      state.participants.forEach((creature) => {
        if (creature.id === id) {
          creature.initiative = newInitiative;
        }
      });

      state.participants.sort((a, b) => b.initiative - a.initiative);
    },
  },
});

export const encounterActions = encounterSlice.actions;

export default encounterSlice.reducer;
