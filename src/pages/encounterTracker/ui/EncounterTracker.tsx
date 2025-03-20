import { CardList } from './cardList';
import { Statblock } from './statblock';
import { TrackPanel } from './trackPanel';

import s from './EncounterTracker.module.scss';

export const EncounterTracker = () => {
  return (
    <div className={s.encounterTrackerContainer}>
      <Statblock />
      <TrackPanel />
      <CardList />
    </div>
  );
};
