// src/entities/mapTiles/api/mapTiles.api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { MapTileCategory } from './../types';

const mapTilesApi = createApi({
  reducerPath: 'mapTilesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/map-tiles' }),
  endpoints: (builder) => ({
    getTileCategories: builder.query<MapTileCategory[], void>({
      // Был мок -> теперь реальный запрос (GET)
      query: () => ({ url: '/categories' }),
    }),
  }),
});

export const { useGetTileCategoriesQuery, useLazyGetTileCategoriesQuery } = mapTilesApi;
export default mapTilesApi;
