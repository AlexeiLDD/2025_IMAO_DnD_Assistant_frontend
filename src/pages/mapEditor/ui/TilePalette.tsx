import type { MapTile, MapTileCategory } from 'entities/mapTiles';
import type { PointerEvent as ReactPointerEvent } from 'react';

import s from './MapEditor.module.scss';

export type TilePaletteProps = {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  categories: MapTileCategory[];
  errorMessage: string | null;
  onTilePointerDown: (event: ReactPointerEvent<HTMLDivElement>, tile: MapTile) => void;
};

export const TilePalette = ({
  status,
  categories,
  errorMessage,
  onTilePointerDown,
}: TilePaletteProps) => {
  return (
    <aside className={s.palette}>
      <h2>Панель плиток</h2>
      <div className={s.paletteItems}>
        {status === 'loading' && <div className={s.paletteState}>Загрузка плиток...</div>}
        {status === 'failed' && (
          <div className={s.paletteState} role='alert'>
            {errorMessage ?? 'Не удалось загрузить плитки'}
          </div>
        )}
        {status === 'succeeded' &&
          categories.map((category, index) => (
            <details key={category.id} className={s.paletteGroup} open={index === 0}>
              <summary className={s.paletteGroupSummary}>{category.name}</summary>
              <div className={s.paletteGroupItems}>
                {category.tiles.map((tile) => (
                  <div
                    key={tile.id}
                    className={s.paletteItem}
                    onPointerDown={(event) => onTilePointerDown(event, tile)}
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <div className={s.tilePreview}>
                      <img src={tile.imageUrl} alt={tile.name} draggable={false} />
                    </div>
                    <span>{tile.name}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        {status === 'succeeded' && categories.length === 0 && (
          <div className={s.paletteState}>Нет доступных плиток</div>
        )}
      </div>
    </aside>
  );
};
