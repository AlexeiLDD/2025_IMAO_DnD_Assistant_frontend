import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { GetCreaturesRequest } from 'entities/creature/api';
import { CreatureClippedData, CreatureFullData } from 'entities/creature/model';

import { insertAfterSecondSlash } from '../lib';

const bestiaryApi = createApi({
  reducerPath: 'bestiaryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Creature'],
  endpoints: (builder) => ({
    getCreatures: builder.query<CreatureClippedData[], GetCreaturesRequest>({
      query: (body) => ({
        url: '/bestiary/list',
        method: 'POST',
        body,
      }),
      providesTags: ['Creature'],
    }),

    getCreatureByName: builder.query<CreatureFullData, string>({
      query: (name) => ({ url: name }),
      providesTags: ['Creature'],
    }),

    getUserCreatures: builder.query<CreatureClippedData[], GetCreaturesRequest>({
      query: (body) => ({
        url: '/bestiary/usr_content/list',
        method: 'POST',
        body,
      }),
      providesTags: ['Creature'],
    }),

    getUserCreatureByName: builder.query<CreatureFullData, string>({
      query: (name) => ({ url: insertAfterSecondSlash(name, 'usr_content') }),
      providesTags: ['Creature'],
    }),
  }),
});

export const {
  useGetCreaturesQuery,
  useGetUserCreaturesQuery,
  useLazyGetCreatureByNameQuery,
  useLazyGetUserCreatureByNameQuery,
  useGetCreatureByNameQuery,
  useGetUserCreatureByNameQuery,
} = bestiaryApi;

export default bestiaryApi;
