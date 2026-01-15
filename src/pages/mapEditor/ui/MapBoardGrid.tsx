import clsx from 'clsx';
import type { MapTile } from 'entities/mapTiles';
import type {
  CSSProperties,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';

import s from './MapEditor.module.scss';
import type { CellPos, Grid, TilesById } from './types';

export type MapBoardGridProps = {
  grid: Grid;
  rows: number;
  columns: number;
  cellSize: number;
  tilesById: TilesById;
  boardRef: RefObject<HTMLDivElement | null>;
  onCellClear: (rowIndex: number, colIndex: number, event?: MouseEvent<HTMLDivElement>) => void;
  onCellPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    cellPos: CellPos,
    tile: MapTile,
    rotation: number,
  ) => void;
};

export const MapBoardGrid = ({
  grid,
  rows,
  columns,
  cellSize,
  tilesById,
  boardRef,
  onCellClear,
  onCellPointerDown,
}: MapBoardGridProps) => {
  return (
    <div className={s.boardScrollContainer}>
      <div
        ref={boardRef}
        className={s.board}
        style={{
          gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
          gridAutoRows: `${cellSize}px`,
        }}
        role='grid'
        aria-rowcount={rows}
        aria-colcount={columns}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const tileId = cell.tileId;
            const tile = tileId ? tilesById[tileId] : null;

            return (
              <div
                key={cell.id}
                className={clsx(s.cell, tile ? s.cellFilled : s.cellEmpty)}
                onContextMenu={(event) => onCellClear(rowIndex, columnIndex, event)}
                data-row={rowIndex}
                data-col={columnIndex}
                role='gridcell'
                aria-colindex={columnIndex + 1}
                aria-rowindex={rowIndex + 1}
                aria-label={tile ? tile.name : 'Пустая клетка'}
              >
                {tile ? (
                  <div
                    key={`${cell.tileId}-${cell.rotation}`}
                    className={s.cellTile}
                    style={
                      {
                        '--tile-rotation': `${cell.rotation}deg`,
                      } as CSSProperties
                    }
                    onPointerDown={(event) =>
                      onCellPointerDown(
                        event,
                        { row: rowIndex, col: columnIndex },
                        tile,
                        cell.rotation,
                      )
                    }
                  >
                    <img src={tile.imageUrl} alt={tile.name} draggable={false} />
                  </div>
                ) : (
                  <span className={s.cellPlaceholder}>+</span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};
