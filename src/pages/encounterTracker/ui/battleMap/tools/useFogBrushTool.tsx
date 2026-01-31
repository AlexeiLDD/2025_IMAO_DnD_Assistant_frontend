import { ReactNode, useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { encounterActions, FogHistoryCellPatch, FogHistoryValue } from 'entities/encounter/model';
import { MapPointerEvent } from 'shared/lib/battleMapEventBus';
import { Tool } from './Tool';

type UseFogBrushToolOptions = {
  cellSize: number;
  rows: number;
  cols: number;
  /** Current d3 scale — used for stroke scaling */
  scale: number;
};

/**
 * World coordinates → grid cell indices.
 * Returns null if out of bounds.
 */
function worldToCell(
  worldX: number,
  worldY: number,
  cellSize: number,
  rows: number,
  cols: number,
): { row: number; col: number } | null {
  const col = Math.floor(worldX / cellSize);
  const row = Math.floor(worldY / cellSize);
  if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
  return { row, col };
}

/**
 * Hook that creates a FogBrushTool — paint/erase fog history cells.
 * LMB = reveal (set 1), Shift+LMB = hide (set 0).
 * Returns the Tool object and the overlay ReactNode.
 */
export function useFogBrushTool({ cellSize, rows, cols, scale }: UseFogBrushToolOptions): {
  tool: Tool;
  overlay: ReactNode;
} {
  const dispatch = useDispatch();

  const isDrawingRef = useRef(false);
  const brushValueRef = useRef<FogHistoryValue>(1);
  const strokeCellsRef = useRef<FogHistoryCellPatch[]>([]);
  // Track visited cells to avoid duplicate patches in same stroke
  const visitedRef = useRef<Set<string>>(new Set());

  // Preview cell for overlay
  const [previewCell, setPreviewCell] = useState<{ row: number; col: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const onPointerDown = useCallback(
    (e: MapPointerEvent): boolean | void => {
      if (e.button !== 0) return; // LMB only

      const cell = worldToCell(e.world.x, e.world.y, cellSize, rows, cols);
      if (!cell) return;

      const value: FogHistoryValue = e.shiftKey ? 0 : 1;
      brushValueRef.current = value;
      isDrawingRef.current = true;
      strokeCellsRef.current = [[cell.row, cell.col, value]];
      visitedRef.current = new Set([`${cell.row},${cell.col}`]);
      setIsDrawing(true);

      return true;
    },
    [cellSize, rows, cols],
  );

  const onPointerMove = useCallback(
    (e: MapPointerEvent): boolean | void => {
      const cell = worldToCell(e.world.x, e.world.y, cellSize, rows, cols);
      setPreviewCell(cell);

      if (!isDrawingRef.current) return;

      if (!cell) return;

      const key = `${cell.row},${cell.col}`;
      if (visitedRef.current.has(key)) return;

      visitedRef.current.add(key);
      strokeCellsRef.current.push([cell.row, cell.col, brushValueRef.current]);

      return true;
    },
    [cellSize, rows, cols],
  );

  const onPointerUp = useCallback(
    (): boolean | void => {
      if (!isDrawingRef.current) return;

      isDrawingRef.current = false;
      setIsDrawing(false);

      if (strokeCellsRef.current.length > 0) {
        dispatch(encounterActions.applyFogHistoryPatchParty(strokeCellsRef.current));
      }

      strokeCellsRef.current = [];
      visitedRef.current.clear();

      return true;
    },
    [dispatch],
  );

  const tool: Tool = {
    id: 'fog-brush',
    cursor: 'crosshair',
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };

  const overlay: ReactNode =
    previewCell ? (
      <rect
        x={previewCell.col * cellSize}
        y={previewCell.row * cellSize}
        width={cellSize}
        height={cellSize}
        fill={isDrawing ? (brushValueRef.current === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') : 'rgba(128,128,128,0.2)'}
        stroke='white'
        strokeWidth={2 / scale}
        strokeDasharray={`${4 / scale},${4 / scale}`}
        pointerEvents='none'
      />
    ) : null;

  return { tool, overlay };
}
