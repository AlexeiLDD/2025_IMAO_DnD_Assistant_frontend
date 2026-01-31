import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import type { MapFull, MapMetadata } from 'entities/maps';
import { useDeleteMapMutation, useLazyGetMapByIdQuery, useListMyMapsQuery } from 'entities/maps';
import type { MapTile } from 'entities/mapTiles';
import { ModalOverlay, Spinner } from 'shared/ui';

import { ConfirmDeleteMapDialog } from './ConfirmDeleteMapDialog';
import s from './MapEditor.module.scss';
import { MapPreviewCanvas } from './MapPreviewCanvas';

type TilesById = Record<string, MapTile>;

type LoadMapDialogProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onLoadMap: (map: MapFull) => void;
  tilesById: TilesById;
};

export const LoadMapDialog = ({ isOpen, setIsOpen, onLoadMap, tilesById }: LoadMapDialogProps) => {
  // Only fetch when dialog is open to avoid request on initial mount
  const {
    data: maps,
    isLoading,
    isError,
    refetch,
  } = useListMyMapsQuery(undefined, {
    skip: !isOpen,
  });
  const [getMapById, { isFetching: isLoadingMap }] = useLazyGetMapByIdQuery();
  const [deleteMap, { isLoading: isDeleting }] = useDeleteMapMutation();

  // Selected map state (for preview)
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [previewCache, setPreviewCache] = useState<Record<string, MapFull>>({});

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<MapMetadata | null>(null);

  // Get selected map data for preview
  const selectedMapData = selectedMapId ? previewCache[selectedMapId] : null;
  const selectedMapMeta = useMemo(
    () => maps?.find((m) => m.id === selectedMapId) ?? null,
    [maps, selectedMapId],
  );

  const handleSelectMap = useCallback(
    async (mapMeta: MapMetadata) => {
      setSelectedMapId(mapMeta.id);

      // Fetch full map data for preview if not cached
      if (!previewCache[mapMeta.id]) {
        try {
          const mapFull = await getMapById(mapMeta.id).unwrap();
          setPreviewCache((prev) => ({ ...prev, [mapMeta.id]: mapFull }));
        } catch {
          // Silent fail for preview - user can still load
        }
      }
    },
    [getMapById, previewCache],
  );

  const handleLoad = useCallback(() => {
    if (!selectedMapId || !selectedMapMeta) return;

    const cachedMap = previewCache[selectedMapId];
    if (cachedMap) {
      onLoadMap(cachedMap);
      setIsOpen(false);
      toast.success(`Карта "${selectedMapMeta.name}" загружена`);
    } else {
      // Fallback: fetch and load
      void getMapById(selectedMapId)
        .unwrap()
        .then((mapFull) => {
          onLoadMap(mapFull);
          setIsOpen(false);
          toast.success(`Карта "${selectedMapMeta.name}" загружена`);
        })
        .catch(() => {
          toast.error('Не удалось загрузить карту');
        });
    }
  }, [selectedMapId, selectedMapMeta, previewCache, onLoadMap, setIsOpen, getMapById]);

  const handleDeleteClick = (mapMeta: MapMetadata, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(mapMeta);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMap(deleteTarget.id).unwrap();
      toast.success('Карта удалена');

      // Clear from preview cache and selection
      if (selectedMapId === deleteTarget.id) {
        setSelectedMapId(null);
      }
      setPreviewCache((prev) => {
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });

      setDeleteTarget(null);
      void refetch();
    } catch {
      toast.error('Не удалось удалить карту');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

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

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedMapId(null);
    setDeleteTarget(null);
  }, [setIsOpen]);

  const hasMaps = maps && maps.length > 0;

  return (
    <>
      <ModalOverlay title='Загрузить карту' isModalOpen={isOpen} setIsModalOpen={handleClose}>
        <div className={s.dialogContent}>
          {(isLoading || isLoadingMap) && (
            <div className={s.dialogLoadingState}>
              <Spinner size={48} />
              <p className={s.dialogLoadingText}>
                {isLoadingMap ? 'Загрузка карты...' : 'Загрузка списка карт...'}
              </p>
            </div>
          )}

          {isError && (
            <div className={s.dialogErrorState}>
              <span className={s.dialogErrorIcon}>⚠</span>
              <p className={s.dialogErrorText}>Не удалось загрузить список карт</p>
              <button type='button' className={s.dialogRetryBtn} onClick={() => void refetch()}>
                Повторить попытку
              </button>
            </div>
          )}

          {!isLoading && !isLoadingMap && !isError && (
            <>
              {/* Preview pane - always shown when maps exist or as placeholder */}
              {hasMaps && (
                <div className={s.mapPreviewPane}>
                  {selectedMapData ? (
                    <>
                      <MapPreviewCanvas
                        mapData={selectedMapData.data}
                        tilesById={tilesById}
                        width={280}
                        height={180}
                      />
                      <div className={s.mapPreviewActions}>
                        <button type='button' data-variant='accent' onClick={handleLoad}>
                          Загрузить
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={s.mapPreviewPlaceholder}>
                      <span className={s.mapPreviewPlaceholderIcon}>👁</span>
                      <p className={s.mapPreviewPlaceholderText}>
                        Выберите карту в списке, чтобы посмотреть превью
                      </p>
                      <p className={s.mapPreviewPlaceholderHint}>
                        Клик по карте — предпросмотр. Кнопка «Загрузить» — применить.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Map list or empty state */}
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
                        {/* Mini thumbnail */}
                        <div className={s.mapListItemThumbnail}>
                          {cachedData ? (
                            <MapPreviewCanvas
                              mapData={cachedData.data}
                              tilesById={tilesById}
                              width={64}
                              height={40}
                            />
                          ) : (
                            <div className={s.mapListItemThumbnailSkeleton}>
                              <span>🗺️</span>
                            </div>
                          )}
                        </div>

                        {/* Map info */}
                        <div className={s.mapListItemInfo}>
                          <span className={s.mapListItemName}>{map.name}</span>
                          <span className={s.mapListItemDate}>{formatDate(map.updatedAt)}</span>
                        </div>

                        {/* Affordance icon */}
                        <span className={s.mapListItemAffordance} aria-hidden='true'>
                          ›
                        </span>

                        {/* Delete button */}
                        <button
                          type='button'
                          className={s.mapListItemDelete}
                          onClick={(e) => handleDeleteClick(map, e)}
                          title='Удалить'
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={s.dialogEmptyState}>
                  <span className={s.dialogEmptyIcon}>🗺️</span>
                  <p className={s.dialogEmptyText}>Сейчас у вас ничего нет</p>
                  <p className={s.dialogEmptyHint}>
                    Создайте карту в редакторе и нажмите «Сохранить карту»
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </ModalOverlay>

      {/* Delete confirmation dialog */}
      <ConfirmDeleteMapDialog
        isOpen={deleteTarget !== null}
        mapName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};
