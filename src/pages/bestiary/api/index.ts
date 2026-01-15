export {
  default as bestiaryApi,
  useGetCreatureByNameQuery,
  useGetCreaturesQuery,
  useGetUserCreatureByNameQuery,
  useGetUserCreaturesQuery,
  useLazyGetCreatureByNameQuery,
  useLazyGetUserCreatureByNameQuery,
} from './bestiary.api';

export type { GetCreaturesRequest } from 'entities/creature/api';
