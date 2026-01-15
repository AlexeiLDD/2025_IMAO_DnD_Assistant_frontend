import { configureStore, Reducer } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { saveEncounterVersionMiddleware } from 'app/middleware';

import { authReducer } from 'entities/auth';
import { creaturesReduser } from 'entities/creature';
import { encounterReduser } from 'entities/encounter';
import { encounterApi } from 'entities/encounter/api';
import { generatedCreatureReduser } from 'entities/generatedCreature';
import { loggerReduser } from 'entities/logger';
import { mapsApi } from 'entities/maps/api';
import { mapTilesApi } from 'entities/mapTiles/api';
import { userInterfaceReduser } from 'entities/userInterface';
import { bestiaryApi } from 'pages/bestiary/api';
import { characterApi } from 'pages/characters/api';
import { promtApi, tableApi } from 'pages/encounterTracker/api';
import { authApi } from 'pages/login/api';
import llmApi from 'pages/statblockGenerator/api/llm.api';
import statblockGeneratorApi from 'pages/statblockGenerator/api/statblockGenerator.api';

export const store = configureStore({
  reducer: {
    encounter: encounterReduser,
    creatures: creaturesReduser,
    logger: loggerReduser,
    auth: authReducer,
    generatedCreature: generatedCreatureReduser,
    userInterface: userInterfaceReduser,
    mapTilesApi: mapTilesApi.reducer,
    mapsApi: mapsApi.reducer,
    bestiaryApi: bestiaryApi.reducer,
    promtApi: promtApi.reducer,
    characterApi: characterApi.reducer,
    encounterApi: encounterApi.reducer,
    authApi: authApi.reducer,
    llmApi: llmApi.reducer,
    statblockGeneratorApi: statblockGeneratorApi.reducer,
    tableApi: tableApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(saveEncounterVersionMiddleware.middleware)
      .concat(bestiaryApi.middleware)
      .concat(promtApi.middleware)
      .concat(characterApi.middleware)
      .concat(encounterApi.middleware)
      .concat(mapTilesApi.middleware)
      .concat(mapsApi.middleware)
      .concat(authApi.middleware)
      .concat(llmApi.middleware)
      .concat(statblockGeneratorApi.middleware)
      .concat(tableApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type RootStore = ReturnType<
  Reducer<{
    encounter: typeof encounterReduser;
    creatures: typeof creaturesReduser;
    logger: typeof loggerReduser;
    auth: typeof authReducer;
    generatedCreature: typeof generatedCreatureReduser;
    userInterface: typeof userInterfaceReduser;
    mapTilesApi: typeof mapTilesApi.reducer;
    mapsApi: typeof mapsApi.reducer;
    bestiaryApi: typeof bestiaryApi.reducer;
    promtApi: typeof promtApi.reducer;
    characterApi: typeof characterApi.reducer;
    encounterApi: typeof encounterApi.reducer;
    authApi: typeof authApi.reducer;
    llmApi: typeof llmApi.reducer;
    statblockGeneratorApi: typeof statblockGeneratorApi.reducer;
  }>
>;

export type AppDispatch = typeof store.dispatch;
