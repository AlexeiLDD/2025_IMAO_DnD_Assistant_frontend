import { EncounterSave, FogHistoryCellPatch } from 'entities/encounter/model';
import { CoordsPatch } from 'shared/lib';

export type SessionMessage = {
  type: 'battleInfo' | 'participantsInfo' | 'error' | 'encounter_patch' | 'fog_history_patch';
  data?: BattleInfoData | ParticipantsInfoData | EncounterPatchData | FogHistoryPatchData;
  error?: string;
};

/**
 * Patch message for partial state sync (e.g., token movement).
 * Only contains changed participant coordinates.
 */
export type EncounterPatchData = {
  origin: string; // clientId that sent the patch
  patch: {
    participants: CoordsPatch;
  };
};

export type BattleInfoData = {
  encounterData: EncounterSave;
};

/**
 * Fog history patch for partial sync (brush strokes / auto-reveal).
 */
export type FogHistoryPatchData = {
  origin: string;
  scope: 'party';
  playerId: null;
  cells: FogHistoryCellPatch[];
};

export type ParticipantsInfoData = {
  id: number; // playerID
  participants: Participant[];
  status: 'connected' | 'disconnected';
};

export type Participant = {
  id: number;
  name: string;
  role: 'admin' | 'player';
};
