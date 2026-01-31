/** Rotation as 0|1|2|3 representing 0°/90°/180°/270° */
export type Rotation = 0 | 1 | 2 | 3;

/** A single placed tile instance on the map */
export type Placement = {
  id: string;
  tileId: string;
  x: number;
  y: number;
  rot: Rotation;
  layer?: number;
};

/** Persisted map data */
export type MapData = {
  schemaVersion: 1;
  widthUnits: number;
  heightUnits: number;
  placements: Placement[];
};

/** Map metadata (for list views) */
export type MapMetadata = {
  id: string;
  userId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

/** Full map with data */
export type MapFull = MapMetadata & {
  data: MapData;
};

/** Request to create a new map */
export type CreateMapRequest = {
  name: string;
  data: MapData;
};

/** Request to update an existing map */
export type UpdateMapRequest = {
  name?: string;
  data: MapData;
};

/** Query params for listing maps */
export type ListMapsParams = {
  start?: number;
  size?: number;
};
