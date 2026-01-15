import { createBrowserRouter, RouterProvider } from 'react-router';

import {
  EncounterTrackerSaveProvider,
  EncounterTrackerSessionProvider,
  HeaderProvider,
  LoginRequiredProvider,
} from 'app/providers';
import { Bestiary, CreatureStatblock } from 'pages/bestiary';
import { Characters } from 'pages/characters';
import { EncounterList } from 'pages/encounterList/';
import { EncounterTracker } from 'pages/encounterTracker';
import { Login } from 'pages/login';
import { Main } from 'pages/main';
import { MapEditor } from 'pages/mapEditor';
import { StatblockGenerator } from 'pages/statblockGenerator';
import { TestPage } from 'pages/test';
import { Footer, Placeholder } from 'shared/ui';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <HeaderProvider>
        <Main />
        <Footer />
      </HeaderProvider>
    ),
  },
  {
    path: 'test',
    element: <TestPage />,
  },
  {
    path: 'bestiary',
    element: (
      <HeaderProvider>
        <Bestiary type='moder' />
        <Footer />
      </HeaderProvider>
    ),
    children: [
      {
        path: ':creatureName',
        element: <CreatureStatblock />,
      },
    ],
  },
  {
    path: 'bestiary/user',
    element: (
      <HeaderProvider>
        <Bestiary type='user' />
        <Footer />
      </HeaderProvider>
    ),
    children: [
      {
        path: ':creatureName',
        element: <CreatureStatblock />,
      },
    ],
  },
  {
    path: 'encounter_tracker',
    element: (
      <HeaderProvider>
        <EncounterTracker />
      </HeaderProvider>
    ),
  },
  {
    path: 'encounter_tracker/:id',
    element: (
      <HeaderProvider>
        <LoginRequiredProvider>
          <EncounterTrackerSaveProvider>
            <EncounterTracker />
          </EncounterTrackerSaveProvider>
        </LoginRequiredProvider>
      </HeaderProvider>
    ),
  },
  {
    path: 'encounter_tracker/session/:id',
    element: (
      <HeaderProvider>
        <LoginRequiredProvider>
          <EncounterTrackerSessionProvider>
            <EncounterTracker />
          </EncounterTrackerSessionProvider>
        </LoginRequiredProvider>
      </HeaderProvider>
    ),
  },

  {
    path: 'characters',
    element: (
      <HeaderProvider>
        <LoginRequiredProvider>
          <Characters />
          <Footer />
        </LoginRequiredProvider>
      </HeaderProvider>
    ),
  },
  {
    path: 'login',
    element: (
      <HeaderProvider>
        <Login />
        <Footer />
      </HeaderProvider>
    ),
  },
  {
    path: 'statblock_generator',
    element: (
      <HeaderProvider>
        <StatblockGenerator />
        <Footer />
      </HeaderProvider>
    ),
  },
  {
    path: 'map_editor',
    element: (
      <HeaderProvider>
        <LoginRequiredProvider>
          <MapEditor />
          <Footer />
        </LoginRequiredProvider>
      </HeaderProvider>
    ),
  },
  {
    path: 'encounter_list',
    element: (
      <HeaderProvider>
        <LoginRequiredProvider>
          <EncounterList />
          <Footer />
        </LoginRequiredProvider>
      </HeaderProvider>
    ),
  },
  {
    path: '*',
    element: (
      <Placeholder
        title='404 Страница не найдена'
        subtitle='К сожалению, cтраница, на которую вы пытаетесь попасть, не существует или была удалена :('
        buttonText='Вернутся в бестиарий'
      />
    ),
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
