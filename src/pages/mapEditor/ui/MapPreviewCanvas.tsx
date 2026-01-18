import { useEffect, useRef, useState } from 'react';

import type { MapData, Rotation } from 'entities/maps';
import type { MapTile } from 'entities/mapTiles';
import { MAP_UNITS_PER_TILE } from 'shared/lib';

import s from './MapEditor.module.scss';

/** Units per placed tile */
const MACRO_CELL_UNITS = MAP_UNITS_PER_TILE;

type TilesById = Record<string, MapTile>;

type MapPreviewCanvasProps = {
  mapData: MapData;
  tilesById: TilesById;
  width?: number;
  height?: number;
};

/** Cache for loaded images to avoid reloading */
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

/** Draw a tile with rotation on canvas context */
const drawRotatedTile = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  rot: Rotation,
) => {
  ctx.save();
  // Move to center of tile position
  ctx.translate(x + size / 2, y + size / 2);
  // Rotate (rot is 0-3 representing 0/90/180/270 degrees)
  ctx.rotate((rot * Math.PI) / 2);
  // Draw image centered
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
};

export const MapPreviewCanvas = ({
  mapData,
  tilesById,
  width = 200,
  height = 140,
}: MapPreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate grid dimensions
    const cols = mapData.widthUnits / MACRO_CELL_UNITS;
    const rows = mapData.heightUnits / MACRO_CELL_UNITS;

    if (cols <= 0 || rows <= 0) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Calculate cell size to fit in canvas
    const cellSize = Math.min(width / cols, height / rows);
    const offsetX = (width - cols * cellSize) / 2;
    const offsetY = (height - rows * cellSize) / 2;

    // Clear canvas with dark background
    ctx.fillStyle = 'rgba(33, 37, 41, 0.9)';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(134, 142, 150, 0.2)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + r * cellSize);
      ctx.lineTo(offsetX + cols * cellSize, offsetY + r * cellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + c * cellSize, offsetY);
      ctx.lineTo(offsetX + c * cellSize, offsetY + rows * cellSize);
      ctx.stroke();
    }

    // Collect unique tile URLs to load
    const urlsToLoad = new Set<string>();
    for (const placement of mapData.placements) {
      const tile = tilesById[placement.tileId];
      if (tile?.imageUrl) {
        urlsToLoad.add(tile.imageUrl);
      }
    }

    // Load all images then render
    const loadAndRender = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Load all images in parallel
        await Promise.all([...urlsToLoad].map(loadImage));

        // Render placements
        for (const placement of mapData.placements) {
          const tile = tilesById[placement.tileId];
          if (!tile?.imageUrl) continue;

          const img = imageCache.get(tile.imageUrl);
          if (!img) continue;

          const col = placement.x / MACRO_CELL_UNITS;
          const row = placement.y / MACRO_CELL_UNITS;
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;

          drawRotatedTile(ctx, img, x, y, cellSize, placement.rot);
        }

        setIsLoading(false);
      } catch {
        setHasError(true);
        setIsLoading(false);
      }
    };

    void loadAndRender();
  }, [mapData, tilesById, width, height]);

  return (
    <div className={s.mapPreviewContainer}>
      <canvas ref={canvasRef} width={width} height={height} className={s.mapPreviewCanvas} />
      {isLoading && <div className={s.mapPreviewLoading}>Загрузка...</div>}
      {hasError && <div className={s.mapPreviewError}>Ошибка загрузки</div>}
    </div>
  );
};
