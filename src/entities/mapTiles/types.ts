export type MapTile = {
  id: string;
  name: string;
  imageUrl: string;
};

export type MapTileCategory = {
  id: string;
  name: string;
  tiles: MapTile[];
};

export type MapTilesStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type MapTilesState = {
  categories: MapTileCategory[];
  status: MapTilesStatus;
  error: string | null;
};
