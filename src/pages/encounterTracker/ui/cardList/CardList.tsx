import { EncounterState, EncounterStore } from 'entities/encounter/model';
import { useSelector } from 'react-redux';
import { CreatureCard } from '../creatureCard';

import s from './CardList.module.scss';

export const CardList = () => {
  const { participants } = useSelector<EncounterStore>(
    (state) => state.encounter,
  ) as EncounterState;

  return (
    <div className={s.listContainer}>
      {participants.map((participant) => (
        <div key={participant.id}>
          <CreatureCard id={participant.id} />
        </div>
      ))}
    </div>
  );
};
