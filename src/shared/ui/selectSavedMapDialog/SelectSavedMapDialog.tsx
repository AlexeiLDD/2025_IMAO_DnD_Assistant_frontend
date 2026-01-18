import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MapData, MapFull, MapMetadata, Rotation } from 'entities/maps';
import { useLazyGetMapByIdQuery, useListMyMapsQuery } from 'entities/maps';
import type { MapTile } from 'entities/mapTiles';
import { MAP_UNITS_PER_TILE } from 'shared/lib';
import { ModalOverlay, Spinner } from 'shared/ui';

import s from './SelectSavedMapDialog.module.scss';

/** Units per placed tile */
const MACRO_CELL_UNITS = MAP_UNITS_PER_TILE;

type TilesById = Record<string, MapTile>;

type SelectSavedMapDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectMap: (map: MapFull) => void;
  tilesById: TilesById;
  title?: string;
  selectButtonText?: string;
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
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((rot * Math.PI) / 2);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
};

/** Small preview canvas for map list items */
const MapThumbnail = ({
  mapData,
  tilesById,
  width = 64,
  height = 40,
}: {
  mapData: MapData;
  tilesById: TilesById;
  width?: number;
  height?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = mapData.widthUnits / MACRO_CELL_UNITS;
    const rows = mapData.heightUnits / MACRO_CELL_UNITS;

    if (cols <= 0 || rows <= 0) return;

    const cellSize = Math.min(width / cols, height / rows);
    const offsetX = (width - cols * cellSize) / 2;
    const offsetY = (height - rows * cellSize) / 2;

    ctx.fillStyle = 'rgba(33, 37, 41, 0.9)';
    ctx.fillRect(0, 0, width, height);

    const urlsToLoad = new Set<string>();
    for (const placement of mapData.placements) {
      const tile = tilesById[placement.tileId];
      if (tile?.imageUrl) {
        urlsToLoad.add(tile.imageUrl);
      }
    }

    const loadAndRender = async () => {
      try {
        await Promise.all([...urlsToLoad].map(loadImage));

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
      } catch {
        // Silent fail for thumbnails
      }
    };

    void loadAndRender();
  }, [mapData, tilesById, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className={s.thumbnail} />;
};

/** Larger preview for selected map */
const MapPreview = ({
  mapData,
  tilesById,
  width = 280,
  height = 180,
}: {
  mapData: MapData;
  tilesById: TilesById;
  width?: number;
  height?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = mapData.widthUnits / MACRO_CELL_UNITS;
    const rows = mapData.heightUnits / MACRO_CELL_UNITS;

    if (cols <= 0 || rows <= 0) {
      setIsLoading(false);
      return;
    }

    const cellSize = Math.min(width / cols, height / rows);
    const offsetX = (width - cols * cellSize) / 2;
    const offsetY = (height - rows * cellSize) / 2;

    ctx.fillStyle = 'rgba(33, 37, 41, 0.9)';
    ctx.fillRect(0, 0, width, height);

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

    const urlsToLoad = new Set<string>();
    for (const placement of mapData.placements) {
      const tile = tilesById[placement.tileId];
      if (tile?.imageUrl) {
        urlsToLoad.add(tile.imageUrl);
      }
    }

    const loadAndRender = async () => {
      setIsLoading(true);
      try {
        await Promise.all([...urlsToLoad].map(loadImage));

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
        setIsLoading(false);
      }
    };

    void loadAndRender();
  }, [mapData, tilesById, width, height]);

  return (
    <div className={s.previewContainer}>
      <canvas ref={canvasRef} width={width} height={height} className={s.previewCanvas} />
      {isLoading && <div className={s.previewLoading}>Загрузка...</div>}
    </div>
  );
};

export const SelectSavedMapDialog = ({
  isOpen,
  onClose,
  onSelectMap,
  tilesById,
  title = 'Загрузить сохранённую карту',
  selectButtonText = 'Загрузить',
}: SelectSavedMapDialogProps) => {
  const {
    data: maps,
    isLoading,
    isError,
    refetch,
  } = useListMyMapsQuery(undefined, {
    skip: !isOpen,
  });
  const [getMapById, { isFetching: isLoadingMap }] = useLazyGetMapByIdQuery();

  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [previewCache, setPreviewCache] = useState<Record<string, MapFull>>({});

  const selectedMapData = selectedMapId ? previewCache[selectedMapId] : null;
  const selectedMapMeta = useMemo(
    () => maps?.find((m) => m.id === selectedMapId) ?? null,
    [maps, selectedMapId],
  );

  const handleSelectMap = useCallback(
    async (mapMeta: MapMetadata) => {
      setSelectedMapId(mapMeta.id);

      if (!previewCache[mapMeta.id]) {
        try {
          const mapFull = await getMapById(mapMeta.id).unwrap();
          setPreviewCache((prev) => ({ ...prev, [mapMeta.id]: mapFull }));
        } catch {
          // Silent fail for preview
        }
      }
    },
    [getMapById, previewCache],
  );

  const handleLoad = useCallback(() => {
    if (!selectedMapId || !selectedMapMeta) return;

    const cachedMap = previewCache[selectedMapId];
    if (cachedMap) {
      onSelectMap(cachedMap);
      onClose();
    } else {
      void getMapById(selectedMapId)
        .unwrap()
        .then((mapFull) => {
          onSelectMap(mapFull);
          onClose();
        })
        .catch(() => {
          // Error handled in UI
        });
    }
  }, [selectedMapId, selectedMapMeta, previewCache, onSelectMap, onClose, getMapById]);

  const handleClose = useCallback(() => {
    onClose();
    setSelectedMapId(null);
  }, [onClose]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMapId(null);
    }
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const hasMaps = maps && maps.length > 0;

  return (
    <ModalOverlay title={title} isModalOpen={isOpen} setIsModalOpen={handleClose}>
      <div className={s.dialogContent}>
        {(isLoading || isLoadingMap) && (
          <div className={s.loadingState}>
            <Spinner size={48} />
            <p className={s.loadingText}>
              {isLoadingMap ? 'Загрузка карты...' : 'Загрузка списка карт...'}
            </p>
          </div>
        )}

        {isError && (
          <div className={s.errorState}>
            <span className={s.errorIcon}>!</span>
            <p className={s.errorText}>Не удалось загрузить список карт</p>
            <button type='button' className={s.retryBtn} onClick={() => void refetch()}>
              Повторить попытку
            </button>
          </div>
        )}

        {!isLoading && !isLoadingMap && !isError && (
          <>
            {hasMaps && (
              <div className={s.previewPane}>
                {selectedMapData ? (
                  <>
                    <MapPreview mapData={selectedMapData.data} tilesById={tilesById} />
                    <div className={s.previewActions}>
                      <button type='button' data-variant='accent' onClick={handleLoad}>
                        {selectButtonText}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={s.previewPlaceholder}>
                    <span className={s.previewPlaceholderIcon}>&#128065;</span>
                    <p className={s.previewPlaceholderText}>
                      Выберите карту в списке, чтобы посмотреть превью
                    </p>
                  </div>
                )}
              </div>
            )}

            {hasMaps ? (
              <div className={s.mapList}>
                {maps.map((map) => {
                  const cachedData = previewCache[map.id];
                  const isSelected = selectedMapId === map.id;

                  return (
                    <div
                      key={map.id}
                      className={`${s.mapListItem} ${isSelected ? s.mapListItemSelected : ''}`}
                      onClick={() => void handleSelectMap(map)}
                      role='button'
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          void handleSelectMap(map);
                        }
                      }}
                    >
                      <div className={s.mapListItemThumbnail}>
                        {cachedData ? (
                          <MapThumbnail mapData={cachedData.data} tilesById={tilesById} />
                        ) : (
                          <div className={s.thumbnailSkeleton}>
                            <span>&#128506;</span>
                          </div>
                        )}
                      </div>

                      <div className={s.mapListItemInfo}>
                        <span className={s.mapListItemName}>{map.name}</span>
                        <span className={s.mapListItemDate}>{formatDate(map.updatedAt)}</span>
                      </div>

                      <span className={s.mapListItemAffordance} aria-hidden='true'>
                        &#8250;
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={s.emptyState}>
                <span className={s.emptyIcon}>&#128506;</span>
                <p className={s.emptyText}>Сейчас у вас ничего нет</p>
                <p className={s.emptyHint}>
                  Создайте карту в редакторе и нажмите «Сохранить карту»
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </ModalOverlay>
  );
};
