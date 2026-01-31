import type { MapTile } from 'entities/mapTiles';

export type TileId = string;

export type Cell = {
  id: string;
  tileId: TileId | null;
  rotation: number;
};

export type Grid = Cell[][];

export type CellPos = {
  row: number;
  col: number;
};

export type TilesById = Record<TileId, MapTile>;
