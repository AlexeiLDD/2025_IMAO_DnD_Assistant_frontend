import { FogHistoryCellPatch, FogHistoryGrid } from 'entities/encounter/model';

/**
 * Compute diff between two FogHistoryGrid instances.
 * Returns array of [row, col, value] patches, or null if no changes.
 */
export function computeFogHistoryPatch(
  prev: FogHistoryGrid,
  next: FogHistoryGrid,
): FogHistoryCellPatch[] | null {
  const patches: FogHistoryCellPatch[] = [];

  for (let row = 0; row < next.length; row++) {
    const prevRow = prev[row];
    const nextRow = next[row];
    if (!prevRow || !nextRow) continue;
    if (prevRow === nextRow) continue; // same reference = no change (Immer guarantee)
    for (let col = 0; col < nextRow.length; col++) {
      if (prevRow[col] !== nextRow[col]) {
        patches.push([row, col, nextRow[col]]);
      }
    }
  }

  return patches.length > 0 ? patches : null;
}
