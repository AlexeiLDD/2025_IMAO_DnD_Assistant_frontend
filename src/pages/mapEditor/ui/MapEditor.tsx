// MapEditor.tsx
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { MapFull } from 'entities/maps';
import type { MapTile, MapTileCategory } from 'entities/mapTiles';
import { useGetTileCategoriesQuery } from 'entities/mapTiles/api';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { toast } from 'react-toastify';

import { deserializeMapData, serializeGrid } from '../lib';
import { BoardControls } from './BoardControls';
import { LoadMapDialog } from './LoadMapDialog';
import { MapBoardGrid } from './MapBoardGrid';
import s from './MapEditor.module.scss';
import { MapEditorHeader } from './MapEditorHeader';
import { SaveMapDialog } from './SaveMapDialog';
import { TilePalette } from './TilePalette';
import type { Cell, CellPos, Grid, TileId } from './types';

// -------------------- types --------------------
type DragOrigin = 'palette' | 'cell';

type ActiveDrag = {
  tileId: TileId;
  rotation: number;
  tile: MapTile;
  sourceCell: CellPos | null;
  pointerId: number;
  anchorOffset?: { x: number; y: number };
  origin: DragOrigin;
};

// -------------------- constants --------------------
const MIN_GRID_SIZE = 4;
const MAX_GRID_SIZE = 64;
const DEFAULT_GRID_ROWS = 8;
const DEFAULT_GRID_COLUMNS = 8;

const MIN_CELL_SIZE = 80;
const MAX_CELL_SIZE = 200;
const CELL_SIZE_STEP = 10;
const TARGET_BOARD_PIXEL_SIZE = 900;

const normalizeRotation = (value: number): number => {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const clampGridSize = (value: number): number => {
  if (Number.isNaN(value)) return MIN_GRID_SIZE;
  return Math.min(Math.max(Math.trunc(value), MIN_GRID_SIZE), MAX_GRID_SIZE);
};

let cellIdCounter = 0;

const clampCellSize = (value: number): number => {
  if (Number.isNaN(value)) return MIN_CELL_SIZE;

  const rounded = Math.round(value / CELL_SIZE_STEP) * CELL_SIZE_STEP;
  return Math.min(Math.max(rounded, MIN_CELL_SIZE), MAX_CELL_SIZE);
};

const getAutoCellSize = (rows: number, columns: number): number => {
  const largestDimension = Math.max(rows, columns);
  if (largestDimension <= 0) return MIN_CELL_SIZE;

  const estimated = Math.floor(TARGET_BOARD_PIXEL_SIZE / largestDimension);
  return clampCellSize(estimated);
};

const generateCellId = (): string => {
  cellIdCounter += 1;
  return `cell-${cellIdCounter}`;
};

const createCell = (tileId: TileId | null = null, rotation = 0): Cell => ({
  id: generateCellId(),
  tileId,
  rotation,
});

const createEmptyGrid = (rows: number, columns: number): Grid =>
  Array.from({ length: rows }, () => Array.from({ length: columns }, () => createCell()));

const resizeGrid = (grid: Grid, rows: number, columns: number): Grid => {
  return Array.from({ length: rows }, (_, rowIndex) => {
    const existingRow = grid[rowIndex] ?? [];
    const preservedCells = existingRow.slice(0, columns);

    if (preservedCells.length === columns) {
      return preservedCells;
    }

    return preservedCells.concat(
      Array.from({ length: columns - preservedCells.length }, () => createCell()),
    );
  });
};

const cloneGrid = (grid: Grid): Grid => grid.map((row) => row.map((cell) => ({ ...cell })));

// -------------------- helpers --------------------
function isFetchError(e: unknown): e is FetchBaseQueryError {
  return typeof e === 'object' && e !== null && 'status' in e;
}

function extractErrorMessage(err: unknown): string {
  if (isFetchError(err)) {
    // data может быть строкой или объектом
    const data: unknown = err.data;
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
      const maybeMsg = 'message' in data ? (data as Record<string, unknown>).message : undefined;
      const maybeErr = 'error' in data ? (data as Record<string, unknown>).error : undefined;
      if (typeof maybeMsg === 'string') return maybeMsg;
      if (typeof maybeErr === 'string') return maybeErr;
    }
    return `HTTP ${String(err.status)}`;
  }

  if (err instanceof Error) return err.message;
  if ((err as SerializedError)?.message) return String((err as SerializedError).message);
  return 'Не удалось загрузить плитки';
}

// -------------------- component --------------------
export const MapEditor = () => {
  // ---------- данные из RTK Query ----------
  const { data, isLoading, isError, isSuccess, error } = useGetTileCategoriesQuery();

  const categories = useMemo<MapTileCategory[]>(() => data ?? [], [data]);

  // Превращаем флаги RTKQ в один статус
  const status: 'idle' | 'loading' | 'succeeded' | 'failed' = isLoading
    ? 'loading'
    : isError
      ? 'failed'
      : isSuccess
        ? 'succeeded'
        : 'idle';

  const errorMessage = isError ? extractErrorMessage(error) : null;

  // ---------- состояние редактора ----------
  const [rows, setRows] = useState<number>(DEFAULT_GRID_ROWS);
  const [columns, setColumns] = useState<number>(DEFAULT_GRID_COLUMNS);
  const [rowsInput, setRowsInput] = useState<string>(String(DEFAULT_GRID_ROWS));
  const [columnsInput, setColumnsInput] = useState<string>(String(DEFAULT_GRID_COLUMNS));
  const [grid, setGrid] = useState<Grid>(() =>
    createEmptyGrid(DEFAULT_GRID_ROWS, DEFAULT_GRID_COLUMNS),
  );
  const [cellSize, setCellSize] = useState<number>(() =>
    getAutoCellSize(DEFAULT_GRID_ROWS, DEFAULT_GRID_COLUMNS),
  );
  const [isCellSizeManual, setIsCellSizeManual] = useState<boolean>(false);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const dragOverlayRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerCaptureTargetRef = useRef<Element | null>(null);
  const pointerMoveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const pointerUpHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const keyDownHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const blurHandlerRef = useRef<(() => void) | null>(null);

  // ---------- map persistence state ----------
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [currentMapName, setCurrentMapName] = useState<string>('');

  const setActiveDragState = useCallback(
    (updater: ActiveDrag | null | ((prev: ActiveDrag | null) => ActiveDrag | null)): void => {
      setActiveDrag((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (prevState: ActiveDrag | null) => ActiveDrag | null)(prev)
            : updater;
        activeDragRef.current = next;
        return next;
      });
    },
    [],
  );

  const disposeDragOverlay = useCallback(() => {
    const overlay = dragOverlayRef.current;
    if (overlay?.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    dragOverlayRef.current = null;
  }, []);

  const updateDragOverlayPosition = useCallback((left: number, top: number) => {
    const overlay = dragOverlayRef.current;
    if (!overlay) return;
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
  }, []);

  const createDragOverlay = useCallback(
    (tile: MapTile, rotation: number, left: number, top: number) => {
      disposeDragOverlay();

      const overlay = document.createElement('div');
      overlay.className = s.dragOverlay;
      overlay.style.width = `${cellSize}px`;
      overlay.style.height = `${cellSize}px`;
      overlay.style.left = `${left}px`;
      overlay.style.top = `${top}px`;
      overlay.style.setProperty('--rotation', `${rotation}deg`);

      const img = document.createElement('img');
      img.src = tile.imageUrl;
      img.alt = tile.name;
      img.draggable = false;

      overlay.appendChild(img);
      document.body.appendChild(overlay);
      dragOverlayRef.current = overlay;
    },
    [cellSize, disposeDragOverlay],
  );

  const applyOverlayRotation = useCallback((rotation: number) => {
    const overlay = dragOverlayRef.current;
    if (overlay) {
      overlay.style.setProperty('--rotation', `${rotation}deg`);
    }
  }, []);

  useEffect(() => {
    setGrid((prevGrid) => resizeGrid(prevGrid, rows, columns));
  }, [rows, columns]);

  useEffect(() => {
    if (isCellSizeManual) return;
    setCellSize(getAutoCellSize(rows, columns));
  }, [rows, columns, isCellSizeManual]);

  useEffect(() => {
    const overlay = dragOverlayRef.current;
    if (overlay) {
      overlay.style.width = `${cellSize}px`;
      overlay.style.height = `${cellSize}px`;
    }
  }, [cellSize]);

  useEffect(() => {
    if (activeDrag) {
      applyOverlayRotation(activeDrag.rotation);
    }
  }, [activeDrag, applyOverlayRotation]);

  const rotateActiveDrag = useCallback(
    (delta: number) => {
      setActiveDragState((prev) => {
        if (!prev) return prev;
        const nextRotation = normalizeRotation(prev.rotation + delta);
        applyOverlayRotation(nextRotation);
        return { ...prev, rotation: nextRotation };
      });
    },
    [applyOverlayRotation, setActiveDragState],
  );

  const resetActiveDragRotation = useCallback(() => {
    setActiveDragState((prev) => {
      if (!prev) return prev;
      applyOverlayRotation(0);
      return { ...prev, rotation: 0 };
    });
  }, [applyOverlayRotation, setActiveDragState]);

  const hitTestCellAt = useCallback((clientX: number, clientY: number): CellPos | null => {
    let element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    while (element) {
      const rowAttr = element.getAttribute('data-row');
      const colAttr = element.getAttribute('data-col');
      if (rowAttr !== null && colAttr !== null) {
        const row = Number(rowAttr);
        const col = Number(colAttr);
        if (Number.isFinite(row) && Number.isFinite(col)) {
          return { row, col };
        }
      }
      element = element.parentElement;
    }
    return null;
  }, []);

  const detachGlobalListeners = useCallback(() => {
    if (pointerMoveHandlerRef.current) {
      window.removeEventListener('pointermove', pointerMoveHandlerRef.current);
      pointerMoveHandlerRef.current = null;
    }
    if (pointerUpHandlerRef.current) {
      window.removeEventListener('pointerup', pointerUpHandlerRef.current);
      pointerUpHandlerRef.current = null;
    }
    if (keyDownHandlerRef.current) {
      window.removeEventListener('keydown', keyDownHandlerRef.current);
      keyDownHandlerRef.current = null;
    }
    if (blurHandlerRef.current) {
      window.removeEventListener('blur', blurHandlerRef.current);
      blurHandlerRef.current = null;
    }
  }, []);

  const teardownDrag = useCallback(() => {
    const drag = activeDragRef.current;
    detachGlobalListeners();

    if (drag && pointerCaptureTargetRef.current instanceof Element) {
      try {
        pointerCaptureTargetRef.current.releasePointerCapture(drag.pointerId);
      } catch {
        // ignore release errors
      }
    }

    pointerCaptureTargetRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    disposeDragOverlay();
    setActiveDragState(null);
  }, [detachGlobalListeners, disposeDragOverlay, setActiveDragState]);

  const applyDropLogic = useCallback((destination: CellPos, drag: ActiveDrag) => {
    setGrid((prev) => {
      const destinationRow = prev[destination.row];
      const destinationCell = destinationRow?.[destination.col];
      if (!destinationCell) return prev;

      const next = cloneGrid(prev);
      const nextDestinationCell = next[destination.row]?.[destination.col];
      if (!nextDestinationCell) return prev;

      // Drag from palette: place/replace at destination
      if (!drag.sourceCell) {
        nextDestinationCell.tileId = drag.tile.id;
        nextDestinationCell.rotation = drag.rotation;
        return next;
      }

      // Drag from cell
      const { row: sourceRow, col: sourceCol } = drag.sourceCell;

      // BUG 3 fix: Same cell - update rotation if changed
      if (sourceRow === destination.row && sourceCol === destination.col) {
        if (nextDestinationCell.rotation === drag.rotation) {
          return prev; // No change needed
        }
        nextDestinationCell.rotation = drag.rotation;
        return next;
      }

      const nextSourceCell = next[sourceRow]?.[sourceCol];
      if (!nextSourceCell) return prev;

      // Capture destination payload before modifying (tileId + rotation as a unit)
      const destTileId = nextDestinationCell.tileId;
      const destRotation = nextDestinationCell.rotation;

      // Place dragged tile at destination with its (possibly modified) rotation
      nextDestinationCell.tileId = drag.tile.id;
      nextDestinationCell.rotation = drag.rotation;

      // Handle source cell based on whether destination was occupied
      if (destTileId !== null) {
        // BUG 1 & 2 fix: Destination was occupied - swap payloads
        // Rotation travels with the tile (payload = tileId + rotation)
        nextSourceCell.tileId = destTileId;
        nextSourceCell.rotation = destRotation;
      } else {
        // Destination was empty - clear source
        nextSourceCell.tileId = null;
        nextSourceCell.rotation = 0;
      }

      return next;
    });
  }, []);

  const attachGlobalListeners = useCallback(() => {
    detachGlobalListeners();

    const pointerMoveHandler = (event: PointerEvent): void => {
      const drag = activeDragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const anchor = drag.anchorOffset ?? { x: 0, y: 0 };
      updateDragOverlayPosition(event.clientX - anchor.x, event.clientY - anchor.y);
    };

    const pointerUpHandler = (event: PointerEvent): void => {
      const drag = activeDragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const targetCell = hitTestCellAt(event.clientX, event.clientY);
      if (targetCell) {
        applyDropLogic(targetCell, drag);
      }
      teardownDrag();
    };

    const keyDownHandler = (event: KeyboardEvent): void => {
      if (!activeDragRef.current) return;

      const { key, code } = event;
      const isRotateCounterClockwise =
        code === 'KeyQ' || key === 'q' || key === 'Q' || key === 'й' || key === 'Й';
      const isRotateClockwise =
        code === 'KeyE' || key === 'e' || key === 'E' || key === 'у' || key === 'У';
      const isResetRotation =
        code === 'KeyR' || key === 'r' || key === 'R' || key === 'к' || key === 'К';
      const isEscape = code === 'Escape' || key === 'Escape';

      if (isRotateCounterClockwise) {
        event.preventDefault();
        rotateActiveDrag(-90);
      } else if (isRotateClockwise) {
        event.preventDefault();
        rotateActiveDrag(90);
      } else if (isResetRotation) {
        event.preventDefault();
        resetActiveDragRotation();
      } else if (isEscape) {
        event.preventDefault();
        teardownDrag();
      }
    };

    const blurHandler = (): void => {
      if (!activeDragRef.current) return;
      teardownDrag();
    };

    pointerMoveHandlerRef.current = pointerMoveHandler;
    pointerUpHandlerRef.current = pointerUpHandler;
    keyDownHandlerRef.current = keyDownHandler;
    blurHandlerRef.current = blurHandler;

    window.addEventListener('pointermove', pointerMoveHandler);
    window.addEventListener('pointerup', pointerUpHandler);
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('blur', blurHandler);
  }, [
    applyDropLogic,
    detachGlobalListeners,
    hitTestCellAt,
    resetActiveDragRotation,
    rotateActiveDrag,
    teardownDrag,
    updateDragOverlayPosition,
  ]);

  const beginDragFromPalette = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, tile: MapTile) => {
      if (activeDragRef.current) return;
      if (event.button !== 0 && event.pointerType !== 'touch') return;

      event.preventDefault();

      const anchorOffset = { x: cellSize / 2, y: cellSize / 2 };
      const rotation = 0;
      const left = event.clientX - anchorOffset.x;
      const top = event.clientY - anchorOffset.y;

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointerCaptureTargetRef.current = event.currentTarget;
      } catch {
        pointerCaptureTargetRef.current = event.currentTarget;
      }

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      createDragOverlay(tile, rotation, left, top);

      const drag: ActiveDrag = {
        tileId: tile.id,
        rotation,
        tile,
        sourceCell: null,
        pointerId: event.pointerId,
        anchorOffset,
        origin: 'palette',
      };

      setActiveDragState(drag);
      attachGlobalListeners();
    },
    [attachGlobalListeners, cellSize, createDragOverlay, setActiveDragState],
  );

  const beginDragFromCell = useCallback(
    (
      event: ReactPointerEvent<HTMLDivElement>,
      cellPos: CellPos,
      tile: MapTile,
      rotation: number,
    ) => {
      if (activeDragRef.current) return;
      if (event.button !== 0 && event.pointerType !== 'touch') return;

      event.preventDefault();

      const normalizedRotation = normalizeRotation(rotation);
      const anchorOffset = { x: cellSize / 2, y: cellSize / 2 };
      const left = event.clientX - anchorOffset.x;
      const top = event.clientY - anchorOffset.y;

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointerCaptureTargetRef.current = event.currentTarget;
      } catch {
        pointerCaptureTargetRef.current = event.currentTarget;
      }

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      createDragOverlay(tile, normalizedRotation, left, top);

      const drag: ActiveDrag = {
        tileId: tile.id,
        rotation: normalizedRotation,
        tile,
        sourceCell: cellPos,
        pointerId: event.pointerId,
        anchorOffset,
        origin: 'cell',
      };

      setActiveDragState(drag);
      attachGlobalListeners();
    },
    [attachGlobalListeners, cellSize, createDragOverlay, setActiveDragState],
  );

  useEffect(
    () => () => {
      if (activeDragRef.current) {
        detachGlobalListeners();
      }
      if (pointerCaptureTargetRef.current && activeDragRef.current) {
        try {
          pointerCaptureTargetRef.current.releasePointerCapture(activeDragRef.current.pointerId);
        } catch {
          // ignore
        }
      }
      pointerCaptureTargetRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      disposeDragOverlay();
      activeDragRef.current = null;
    },
    [detachGlobalListeners, disposeDragOverlay],
  );

  const tilesById = useMemo<Record<TileId, MapTile>>(() => {
    return categories.reduce<Record<TileId, MapTile>>((acc, category) => {
      category.tiles.forEach((tile) => {
        acc[tile.id] = tile;
      });
      return acc;
    }, {});
  }, [categories]);

  const handleReset = (): void => {
    setGrid(createEmptyGrid(rows, columns));
    setCurrentMapId(null);
    setCurrentMapName('');
  };

  const handleOpenSaveDialog = (): void => {
    setIsSaveDialogOpen(true);
  };

  const handleOpenLoadDialog = (): void => {
    setIsLoadDialogOpen(true);
  };

  const handleSaveSuccess = (id: string, name: string): void => {
    setCurrentMapId(id);
    setCurrentMapName(name);
  };

  const handleLoadMap = (map: MapFull): void => {
    const result = deserializeMapData(map.data, tilesById);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    // Show warnings if any
    result.warnings.forEach((warning) => {
      toast.warning(warning);
    });

    // Update editor state
    setRows(result.rows);
    setColumns(result.columns);
    setRowsInput(String(result.rows));
    setColumnsInput(String(result.columns));
    setGrid(result.grid);
    setCurrentMapId(map.id);
    setCurrentMapName(map.name);
    setIsCellSizeManual(false);
  };

  const handleRowsChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    setRowsInput(value);

    if (value === '') return;

    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;

    if (parsed >= MIN_GRID_SIZE && parsed <= MAX_GRID_SIZE) {
      const normalized = Math.trunc(parsed);
      setRows(normalized);
      setRowsInput(String(normalized));
    }
  };

  const handleColumnsChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    setColumnsInput(value);

    if (value === '') return;

    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;

    if (parsed >= MIN_GRID_SIZE && parsed <= MAX_GRID_SIZE) {
      const normalized = Math.trunc(parsed);
      setColumns(normalized);
      setColumnsInput(String(normalized));
    }
  };

  const handleRowsBlur = (): void => {
    const clamped = clampGridSize(Number(rowsInput));
    setRows(clamped);
    setRowsInput(String(clamped));
  };

  const handleColumnsBlur = (): void => {
    const clamped = clampGridSize(Number(columnsInput));
    setColumns(clamped);
    setColumnsInput(String(clamped));
  };

  const handleZoomChange = (delta: number): void => {
    setIsCellSizeManual(true);
    setCellSize((prev) => clampCellSize(prev + delta));
  };

  const handleZoomIn = (): void => {
    handleZoomChange(CELL_SIZE_STEP);
  };

  const handleZoomOut = (): void => {
    handleZoomChange(-CELL_SIZE_STEP);
  };

  const handleZoomReset = (): void => {
    setIsCellSizeManual(false);
    setCellSize(getAutoCellSize(rows, columns));
  };

  const canZoomOut = cellSize > MIN_CELL_SIZE;
  const canZoomIn = cellSize < MAX_CELL_SIZE;

  const handleClearCell = (
    rowIndex: number,
    columnIndex: number,
    event?: MouseEvent<HTMLDivElement>,
  ): void => {
    if (event) event.preventDefault();

    setGrid((prev) => {
      const targetCell = prev[rowIndex]?.[columnIndex];
      if (!targetCell?.tileId) return prev;

      const next = cloneGrid(prev);
      next[rowIndex][columnIndex].tileId = null;
      next[rowIndex][columnIndex].rotation = 0;
      return next;
    });
  };

  const mapData = useMemo(() => serializeGrid(grid, rows, columns), [grid, rows, columns]);

  return (
    <div className={s.editorPage} ref={rootRef}>
      <MapEditorHeader
        onReset={handleReset}
        onSave={handleOpenSaveDialog}
        onLoad={handleOpenLoadDialog}
        currentMapName={currentMapName || null}
      />

      <div className={s.workspace}>
        <TilePalette
          status={status}
          categories={categories}
          errorMessage={errorMessage}
          onTilePointerDown={beginDragFromPalette}
        />

        <section className={s.boardSection}>
          <BoardControls
            rowsInput={rowsInput}
            columnsInput={columnsInput}
            cellSize={cellSize}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            minGridSize={MIN_GRID_SIZE}
            maxGridSize={MAX_GRID_SIZE}
            onRowsChange={handleRowsChange}
            onColumnsChange={handleColumnsChange}
            onRowsBlur={handleRowsBlur}
            onColumnsBlur={handleColumnsBlur}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
          />

          <MapBoardGrid
            grid={grid}
            rows={rows}
            columns={columns}
            cellSize={cellSize}
            tilesById={tilesById}
            boardRef={boardRef}
            onCellClear={handleClearCell}
            onCellPointerDown={beginDragFromCell}
          />
        </section>
      </div>

      <SaveMapDialog
        isOpen={isSaveDialogOpen}
        setIsOpen={setIsSaveDialogOpen}
        mapData={mapData}
        currentMapId={currentMapId}
        currentMapName={currentMapName}
        onSaveSuccess={handleSaveSuccess}
      />

      <LoadMapDialog
        isOpen={isLoadDialogOpen}
        setIsOpen={setIsLoadDialogOpen}
        onLoadMap={handleLoadMap}
        tilesById={tilesById}
      />
    </div>
  );
};
