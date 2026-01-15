import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type {
  CreateMapRequest,
  ListMapsParams,
  MapFull,
  MapMetadata,
  UpdateMapRequest,
} from '../model';

/** Backend response shape for list endpoint */
type ListMapsResponse = {
  maps: MapMetadata[];
  total: number;
};

export const mapsApi = createApi({
  reducerPath: 'mapsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/maps' }),
  tagTypes: ['Map', 'MapList'],
  endpoints: (builder) => ({
    listMyMaps: builder.query<MapMetadata[], ListMapsParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.start !== undefined) {
          searchParams.set('start', String(params.start));
        }
        if (params?.size !== undefined) {
          searchParams.set('size', String(params.size));
        }
        const queryString = searchParams.toString();
        return { url: queryString ? `?${queryString}` : '' };
      },
      // Backend returns { maps: [...], total }, extract just the maps array
      transformResponse: (response: ListMapsResponse) => response.maps,
      providesTags: ['MapList'],
    }),

    getMapById: builder.query<MapFull, string>({
      query: (id) => ({ url: `/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Map', id }],
    }),

    createMap: builder.mutation<MapFull, CreateMapRequest>({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MapList'],
    }),

    updateMap: builder.mutation<MapFull, { id: string; body: UpdateMapRequest }>({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ['MapList', { type: 'Map', id }],
    }),

    deleteMap: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MapList'],
    }),
  }),
});

export const {
  useListMyMapsQuery,
  useLazyListMyMapsQuery,
  useGetMapByIdQuery,
  useLazyGetMapByIdQuery,
  useCreateMapMutation,
  useUpdateMapMutation,
  useDeleteMapMutation,
} = mapsApi;
