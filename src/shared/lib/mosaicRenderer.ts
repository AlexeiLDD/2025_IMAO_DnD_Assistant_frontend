import type { MapData, Rotation } from 'entities/maps';
import type { MapTile } from 'entities/mapTiles';

import { MAP_UNITS_PER_TILE } from './mapUnits';

/** Units per placed tile (same as MapEditor) */
const MACRO_CELL_UNITS = MAP_UNITS_PER_TILE;

export type TilesById = Record<string, MapTile>;

export type MosaicScaleMode = 'fit' | 'cellAligned' | 'trackerAligned';

export type MosaicRenderOptions = {
  mapData: MapData;
  tilesById: TilesById;
  /** Target width in CSS pixels (board width for trackerAligned mode) */
  targetWidthPx: number;
  /** Target height in CSS pixels (board height for trackerAligned mode) */
  targetHeightPx: number;
  /**
   * Scaling mode:
   * - "fit": scale map to fit inside target dimensions (may not fill board)
   * - "cellAligned": 1 macro cell = cellSizePx (default 50px), may exceed target
   * - "trackerAligned": render at exact target dimensions, each tile at grid position
   */
  mode?: MosaicScaleMode;
  /** Cell size in pixels for "cellAligned" and "trackerAligned" modes (default: 50) */
  cellSizePx?: number;
};

export type MosaicRenderResult = {
  /** Blob URL for the rendered mosaic image */
  blobUrl: string;
  /** Actual rendered width in CSS pixels */
  width: number;
  /** Actual rendered height in CSS pixels */
  height: number;
};

/** Shared cache for loaded images */
const imageCache = new Map<string, HTMLImageElement>();

/** Load an image with caching */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  const cached = imageCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};

/** Draw a tile with rotation on canvas context (coordinates in logical pixels) */
const drawRotatedTile = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  rot: Rotation,
) => {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((rot * Math.PI) / 2);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
};

export type ValidateMosaicResult = { valid: true } | { valid: false; error: string };

/**
 * Validates that map data is compatible with mosaic rendering.
 * Checks for proper MACRO_CELL_UNITS alignment.
 */
export const validateMapForMosaic = (mapData: MapData): ValidateMosaicResult => {
  if (mapData.widthUnits % MACRO_CELL_UNITS !== 0) {
    return {
      valid: false,
      error: `Ширина карты (${mapData.widthUnits}) не кратна ${MACRO_CELL_UNITS}`,
    };
  }

  if (mapData.heightUnits % MACRO_CELL_UNITS !== 0) {
    return {
      valid: false,
      error: `Высота карты (${mapData.heightUnits}) не кратна ${MACRO_CELL_UNITS}`,
    };
  }

  for (const placement of mapData.placements) {
    if (placement.x % MACRO_CELL_UNITS !== 0) {
      return {
        valid: false,
        error: `Тайл с id=${placement.tileId} имеет неверную позицию X (${placement.x})`,
      };
    }
    if (placement.y % MACRO_CELL_UNITS !== 0) {
      return {
        valid: false,
        error: `Тайл с id=${placement.tileId} имеет неверную позицию Y (${placement.y})`,
      };
    }
  }

  return { valid: true };
};

/**
 * Renders a map's tiles to a Blob URL with proper DPR scaling.
 * Background is transparent (no fill).
 */
export const renderMapMosaic = async (
  options: MosaicRenderOptions,
): Promise<MosaicRenderResult> => {
  const {
    mapData,
    tilesById,
    targetWidthPx,
    targetHeightPx,
    mode = 'fit',
    cellSizePx = 50,
  } = options;

  const cols = mapData.widthUnits / MACRO_CELL_UNITS;
  const rows = mapData.heightUnits / MACRO_CELL_UNITS;

  if (cols <= 0 || rows <= 0) {
    throw new Error('Некорректные размеры карты');
  }

  // Calculate logical pixel dimensions based on mode
  let logicalWidth: number;
  let logicalHeight: number;
  let unitPx: number;

  if (mode === 'trackerAligned') {
    // Render at exact target dimensions, each tile at grid position
    logicalWidth = targetWidthPx;
    logicalHeight = targetHeightPx;
    unitPx = cellSizePx; // Each tile renders as cellSizePx × cellSizePx
  } else if (mode === 'cellAligned') {
    // 1 macro cell = cellSizePx
    unitPx = cellSizePx;
    logicalWidth = cols * unitPx;
    logicalHeight = rows * unitPx;
  } else {
    // mode === 'fit': scale to fit inside target dimensions
    unitPx = Math.min(targetWidthPx / cols, targetHeightPx / rows);
    logicalWidth = cols * unitPx;
    logicalHeight = rows * unitPx;
  }

  // Use devicePixelRatio for crisp rendering
  const dpr = window.devicePixelRatio || 1;

  // Create offscreen canvas with physical pixel dimensions
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalWidth * dpr);
  canvas.height = Math.round(logicalHeight * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Не удалось создать canvas context');
  }

  // Scale context to account for DPR - draw in logical pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Clear canvas (transparent background)
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  // Collect unique tile URLs to load
  const urlsToLoad = new Set<string>();
  for (const placement of mapData.placements) {
    const tile = tilesById[placement.tileId];
    if (tile?.imageUrl) {
      urlsToLoad.add(tile.imageUrl);
    }
  }

  // Load all images in parallel
  await Promise.all([...urlsToLoad].map(loadImage));

  // Sort placements by layer (lower layers first)
  const sortedPlacements = [...mapData.placements].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));

  // Render placements
  for (const placement of sortedPlacements) {
    const tile = tilesById[placement.tileId];
    if (!tile?.imageUrl) continue;

    const img = imageCache.get(tile.imageUrl);
    if (!img) continue;

    let x: number;
    let y: number;
    let tileW: number;
    let tileH: number;

    if (mode === 'trackerAligned') {
      // In trackerAligned mode:
      // - placement.x/y are in MAP_UNITS_PER_TILE-based units (multiples of 6)
      // - convert to macro cell index, then to pixel position
      // - tile size = MAP_UNITS_PER_TILE * cellSizePx (macro tile covers 6×6 microcells)
      x = placement.x * cellSizePx;
      y = placement.y * cellSizePx;
      tileW = MACRO_CELL_UNITS * cellSizePx;
      tileH = MACRO_CELL_UNITS * cellSizePx;
    } else {
      // fit/cellAligned modes: tiles positioned by macro cell index
      const col = placement.x / MACRO_CELL_UNITS;
      const row = placement.y / MACRO_CELL_UNITS;
      x = col * unitPx;
      y = row * unitPx;
      tileW = unitPx;
      tileH = unitPx;
    }

    drawRotatedTile(ctx, img, x, y, tileW, tileH, placement.rot);
  }

  // Convert to Blob URL (more efficient than base64 dataURL)
  const blobUrl = await new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Не удалось создать blob'));
        }
      },
      'image/png',
      1.0,
    );
  });

  return {
    blobUrl,
    width: logicalWidth,
    height: logicalHeight,
  };
};

/** Cache entry with blob URL for cleanup */
type MosaicCacheEntry = MosaicRenderResult;

/** Cache for rendered mosaics by map ID */
const mosaicCache = new Map<string, MosaicCacheEntry>();

/**
 * Gets a cached mosaic or renders a new one.
 * Automatically revokes old blob URLs when cache is updated.
 */
export const getOrRenderMosaic = async (
  mapId: string,
  options: Omit<MosaicRenderOptions, 'mapData' | 'tilesById'> & {
    mapData: MapData;
    tilesById: TilesById;
  },
): Promise<MosaicRenderResult> => {
  // Check cache
  const cached = mosaicCache.get(mapId);
  if (cached) return cached;

  // Render new mosaic
  const result = await renderMapMosaic(options);

  // Store in cache
  mosaicCache.set(mapId, result);

  return result;
};

/** Revoke a blob URL and remove from cache */
export const clearMosaicCache = (mapId?: string) => {
  if (mapId) {
    const entry = mosaicCache.get(mapId);
    if (entry) {
      URL.revokeObjectURL(entry.blobUrl);
      mosaicCache.delete(mapId);
    }
  } else {
    // Clear all
    for (const entry of mosaicCache.values()) {
      URL.revokeObjectURL(entry.blobUrl);
    }
    mosaicCache.clear();
  }
};

/**
 * Revoke a specific blob URL (use when replacing background).
 * Does NOT affect cache - use for URLs not in cache.
 */
export const revokeMosaicUrl = (blobUrl: string) => {
  if (blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);
  }
};
