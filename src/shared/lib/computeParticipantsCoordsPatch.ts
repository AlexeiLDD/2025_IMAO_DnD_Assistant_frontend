import { CellsCoordinates, Participant } from 'entities/encounter/model/types';
import { UUID } from './types';

export type CoordsPatch = Record<UUID, CellsCoordinates>;

/**
 * Computes a patch containing only changed participant coordinates.
 * Returns null if no coordinates changed.
 */
export function computeParticipantsCoordsPatch(
  prevParticipants: Participant[],
  nextParticipants: Participant[],
): CoordsPatch | null {
  const patch: CoordsPatch = {};
  let hasChanges = false;

  for (const next of nextParticipants) {
    const prev = prevParticipants.find((p) => p.id === next.id);

    // Skip if no coords on next
    if (!next.cellsCoords) continue;

    // New participant with coords or coords changed
    const prevCoords = prev?.cellsCoords;
    const nextCoords = next.cellsCoords;

    if (
      !prevCoords ||
      prevCoords.cellsX !== nextCoords.cellsX ||
      prevCoords.cellsY !== nextCoords.cellsY
    ) {
      patch[next.id] = { cellsX: nextCoords.cellsX, cellsY: nextCoords.cellsY };
      hasChanges = true;
    }
  }

  return hasChanges ? patch : null;
}

/**
 * CONTRACT: PATCH is only allowed for participants.cellsCoords changes.
 * Any other change in any Participant field → must send FULL state.
 *
 * This function compares every own key of each participant EXCEPT cellsCoords.
 * If a new field is added to Participant, it is automatically covered —
 * no allowlist maintenance required.
 */
export function isOnlyCoordsChange(
  prevParticipants: Participant[],
  nextParticipants: Participant[],
): boolean {
  if (prevParticipants.length !== nextParticipants.length) {
    return false;
  }

  for (const next of nextParticipants) {
    const prev = prevParticipants.find((p) => p.id === next.id);

    if (!prev) return false;

    // Compare every key except cellsCoords using ===
    // Immer guarantees unchanged fields keep the same reference
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    allKeys.delete('cellsCoords');

    for (const key of allKeys) {
      if ((prev as Record<string, unknown>)[key] !== (next as Record<string, unknown>)[key]) {
        return false;
      }
    }
  }

  return true;
}
