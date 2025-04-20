import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { UUID } from 'shared/lib';
import { Character, CharacterClipped } from '../model';
import type { FilterParams, OrderParams, SearchParams } from './types';

export type GetCharactersRequest = {
  start: number;
  size: number;
  search: SearchParams;
  order: OrderParams[];
  filter: FilterParams;
};

const characterApi = createApi({
  reducerPath: 'characterApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/character' }),
  endpoints: (builder) => ({
    getCharacters: builder.query<CharacterClipped[], GetCharactersRequest>({
      query: (body) => ({
        url: '/list',
        method: 'POST',
        body,
      }),
    }),

    addCharacter: builder.mutation<null, FormData>({
      query: (formData) => ({
        url: 'add_character',
        method: 'POST',
        body: formData,
        formData: true,
      }),
    }),

    getCharacterById: builder.query<Character, UUID>({
      query: (name) => ({ url: name }),
    }),
  }),
});

export const { useLazyGetCharactersQuery, useLazyGetCharacterByIdQuery, useAddCharacterMutation } =
  characterApi;

export default characterApi;
