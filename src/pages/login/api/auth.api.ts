import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TokenData } from 'entities/auth/model';

export type CodeExchangeRequest = {
  code: string;
  state: string;
  codeVerifier: string;
  deviceID: string;
};

const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    exchangeCode: builder.query<TokenData, CodeExchangeRequest>({
      query: (body) => ({
        url: '/auth/exchange',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useLazyExchangeCodeQuery } = authApi;

export default authApi;
