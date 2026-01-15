import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { GetCreaturesRequest } from 'entities/creature/api';
import { CreatureClippedData, CreatureFullData } from 'entities/creature/model';

const statblockGeneratorApi = createApi({
  reducerPath: 'statblockGeneratorApi',
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

    addCreature: builder.mutation<void, CreatureFullData>({
      query: (creature) => ({
        url: '/bestiary/generated_creature',
        method: 'POST',
        body: creature,
      }),
      invalidatesTags: ['Creature'],
    }),

    uploadStatblockImage: builder.mutation<{ status: string }, FormData>({
      query: (formData) => ({
        url: '/bestiary/statblock-image',
        method: 'POST',
        body: formData,
      }),
    }),

    submitGenerationPrompt: builder.mutation<{ status: string }, { description: string }>({
      query: (body) => ({
        url: '/bestiary/creature-generation-prompt',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetCreaturesQuery,
  useLazyGetCreatureByNameQuery,
  useGetCreatureByNameQuery,
  useAddCreatureMutation,
  useUploadStatblockImageMutation,
  useSubmitGenerationPromptMutation,
} = statblockGeneratorApi;

export default statblockGeneratorApi;
