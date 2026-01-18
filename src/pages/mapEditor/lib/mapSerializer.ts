import type { MapData, Placement, Rotation } from 'entities/maps';
import { MAP_UNITS_PER_TILE } from 'shared/lib';

import type { Grid, TilesById } from '../ui/types';

/** Units per placed tile (re-exported for backward compat) */
export const MACRO_CELL_UNITS = MAP_UNITS_PER_TILE;

/** Default tile dimensions in units (for tiles without explicit size) */
const DEFAULT_TILE_WIDTH = MAP_UNITS_PER_TILE;
const DEFAULT_TILE_HEIGHT = MAP_UNITS_PER_TILE;

/** Convert degrees (0, 90, 180, 270) to rotation index (0, 1, 2, 3) */
const degreesToRotation = (degrees: number): Rotation => {
  const normalized = ((degrees % 360) + 360) % 360;
  return (Math.round(normalized / 90) % 4) as Rotation;
};

/** Convert rotation index (0, 1, 2, 3) to degrees (0, 90, 180, 270) */
const rotationToDegrees = (rot: Rotation): number => rot * 90;

/** Generate a stable placement ID based on cell position */
const makePlacementId = (row: number, col: number): string => `cell:${row}:${col}`;

/** Create an empty grid of the specified dimensions */
const createEmptyGrid = (rows: number, columns: number): Grid => {
  let cellIdCounter = 0;
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => ({
      id: `cell-${++cellIdCounter}`,
      tileId: null,
      rotation: 0,
    })),
  );
};

/**
 * Serialize the editor's macro Grid into the persistence MapData format.
 * Uses stable deterministic placement IDs.
 */
export const serializeGrid = (grid: Grid, rows: number, columns: number): MapData => {
  const placements: Placement[] = [];

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.tileId) {
        placements.push({
          id: makePlacementId(rowIndex, colIndex),
          tileId: cell.tileId,
          x: colIndex * MACRO_CELL_UNITS,
          y: rowIndex * MACRO_CELL_UNITS,
          rot: degreesToRotation(cell.rotation),
        });
      }
    });
  });

  return {
    schemaVersion: 1,
    widthUnits: columns * MACRO_CELL_UNITS,
    heightUnits: rows * MACRO_CELL_UNITS,
    placements,
  };
};

export type DeserializeSuccess = {
  success: true;
  grid: Grid;
  rows: number;
  columns: number;
  warnings: string[];
};

export type DeserializeError = {
  success: false;
  error: string;
};

export type DeserializeResult = DeserializeSuccess | DeserializeError;

/**
 * Deserialize MapData into the editor's macro Grid format.
 * Returns an error if the map uses features not supported by current editor.
 */
export const deserializeMapData = (data: MapData, tilesById: TilesById): DeserializeResult => {
  const warnings: string[] = [];

  // Validate schema version
  if (data.schemaVersion !== 1) {
    return {
      success: false,
      error: `Неподдерживаемая версия схемы карты: ${String(data.schemaVersion)}`,
    };
  }

  // Calculate grid dimensions
  const rows = data.heightUnits / MACRO_CELL_UNITS;
  const columns = data.widthUnits / MACRO_CELL_UNITS;

  // Validate dimensions are whole numbers
  if (!Number.isInteger(rows) || !Number.isInteger(columns)) {
    return {
      success: false,
      error: `Размеры карты (${data.widthUnits}x${data.heightUnits}) не совместимы с текущим редактором`,
    };
  }

  // Validate reasonable grid size
  if (rows < 1 || rows > 64 || columns < 1 || columns > 64) {
    return {
      success: false,
      error: `Размер сетки (${columns}x${rows}) выходит за допустимые пределы (1-64)`,
    };
  }

  const grid = createEmptyGrid(rows, columns);

  for (const placement of data.placements) {
    // Check tile exists
    const tile = tilesById[placement.tileId];
    if (!tile) {
      warnings.push(`Плитка "${placement.tileId}" не найдена и будет пропущена`);
      continue;
    }

    // Check alignment to macro grid
    if (placement.x % MACRO_CELL_UNITS !== 0 || placement.y % MACRO_CELL_UNITS !== 0) {
      return {
        success: false,
        error: `Плитка "${tile.name}" расположена не по сетке (${placement.x}, ${placement.y})`,
      };
    }

    // Check tile dimensions (default to 8x8 if not specified)
    const tileWidth = (tile as { widthUnits?: number }).widthUnits ?? DEFAULT_TILE_WIDTH;
    const tileHeight = (tile as { heightUnits?: number }).heightUnits ?? DEFAULT_TILE_HEIGHT;

    if (tileWidth !== DEFAULT_TILE_WIDTH || tileHeight !== DEFAULT_TILE_HEIGHT) {
      return {
        success: false,
        error: `Плитка "${tile.name}" имеет размер ${tileWidth}x${tileHeight}, который не поддерживается текущей версией редактора`,
      };
    }

    // Calculate grid position
    const col = placement.x / MACRO_CELL_UNITS;
    const row = placement.y / MACRO_CELL_UNITS;

    // Validate bounds
    if (row < 0 || row >= rows || col < 0 || col >= columns) {
      warnings.push(`Плитка "${tile.name}" выходит за границы карты и будет пропущена`);
      continue;
    }

    // Place tile
    const cell = grid[row]?.[col];
    if (cell) {
      cell.tileId = placement.tileId;
      cell.rotation = rotationToDegrees(placement.rot);
    }
  }

  return {
    success: true,
    grid,
    rows,
    columns,
    warnings,
  };
};
