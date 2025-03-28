import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { HeaderProviders } from 'app/providers';
import { Bestiary } from 'pages/bestiary';
import { EncounterTracker } from 'pages/encounterTracker';
import { Login } from 'pages/login';
import { Main } from 'pages/main';
import { TestPage } from 'pages/test';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Main />,
  },
  {
    path: 'test',
    element: <TestPage />,
  },
  {
    path: 'encounter_tracker',
    element: (
      <HeaderProviders>
        <EncounterTracker />
      </HeaderProviders>
    ),
  },
  {
    path: 'bestiary',
    element: (
      <HeaderProviders>
        <Bestiary />
      </HeaderProviders>
    ),
  },
  {
    path: 'login',
    element: (
      <HeaderProviders>
        <Login />
      </HeaderProviders>
    ),
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
