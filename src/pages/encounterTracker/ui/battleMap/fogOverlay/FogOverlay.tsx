import { memo, useMemo } from 'react';

import { FogHistoryGrid } from 'entities/encounter/model';

type FogOverlayProps = {
  fogHistory: FogHistoryGrid;
  rows: number;
  cols: number;
  cellSize: number;
  /** DM sees fog at reduced opacity; players see full black */
  isAdmin: boolean;
};

/**
 * Fog of War overlay — renders as two single `<path>` elements:
 * - Hidden cells (history=0): opaque black (players) / semi-transparent (DM)
 * - Explored cells (history=1): no overlay in MVP (no visibility system yet)
 *
 * When visibility system is added (Iter 2), explored-but-not-visible cells
 * will get a semi-transparent overlay.
 *
 * Performance: 1-2 DOM elements for entire grid instead of rows×cols rects.
 */
function FogOverlayInner({ fogHistory, rows, cols, cellSize, isAdmin }: FogOverlayProps) {
  const hiddenPath = useMemo(() => {
    let d = '';
    for (let row = 0; row < rows; row++) {
      const fogRow = fogHistory[row];
      if (!fogRow) continue;
      for (let col = 0; col < cols; col++) {
        if (fogRow[col] === 0) {
          const x = col * cellSize;
          const y = row * cellSize;
          d += `M${x},${y}h${cellSize}v${cellSize}h${-cellSize}Z`;
        }
      }
    }
    return d;
  }, [fogHistory, rows, cols, cellSize]);

  if (!hiddenPath) return null;

  return (
    <g id='fog-overlay' pointerEvents='none'>
      <path
        d={hiddenPath}
        fill='black'
        opacity={isAdmin ? 0.3 : 1.0}
      />
    </g>
  );
}

export const FogOverlay = memo(FogOverlayInner);
