import clsx from 'clsx';
import type { ChangeEvent } from 'react';

import s from './MapEditor.module.scss';

export type BoardControlsProps = {
  rowsInput: string;
  columnsInput: string;
  cellSize: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  minGridSize: number;
  maxGridSize: number;
  onRowsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onColumnsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRowsBlur: () => void;
  onColumnsBlur: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
};

export const BoardControls = ({
  rowsInput,
  columnsInput,
  cellSize,
  canZoomIn,
  canZoomOut,
  minGridSize,
  maxGridSize,
  onRowsChange,
  onColumnsChange,
  onRowsBlur,
  onColumnsBlur,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: BoardControlsProps) => {
  return (
    <div className={s.boardControls}>
      <label className={s.boardControl}>
        <span>Высота (строки)</span>
        <input
          type='number'
          min={minGridSize}
          max={maxGridSize}
          step={1}
          value={rowsInput}
          onChange={onRowsChange}
          onBlur={onRowsBlur}
        />
      </label>
      <label className={s.boardControl}>
        <span>Ширина (столбцы)</span>
        <input
          type='number'
          min={minGridSize}
          max={maxGridSize}
          step={1}
          value={columnsInput}
          onChange={onColumnsChange}
          onBlur={onColumnsBlur}
        />
      </label>
      <div className={clsx(s.boardControl, s.boardZoomControl)}>
        <span>Масштаб</span>
        <div className={s.zoomControls}>
          <button
            type='button'
            onClick={onZoomOut}
            disabled={!canZoomOut}
            aria-label='Уменьшить размер клеток'
          >
            −
          </button>
          <span className={s.zoomValue}>{cellSize}px</span>
          <button
            type='button'
            onClick={onZoomIn}
            disabled={!canZoomIn}
            aria-label='Увеличить размер клеток'
          >
            +
          </button>
          <button type='button' onClick={onZoomReset} className={s.zoomReset}>
            Авто
          </button>
        </div>
      </div>
      <div className={s.boardControlHint}>
        Диапазон размера поля: от {minGridSize}×{minGridSize} до {maxGridSize}×{maxGridSize}
      </div>
    </div>
  );
};
