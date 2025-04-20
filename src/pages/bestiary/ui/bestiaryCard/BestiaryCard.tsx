import { FC, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import uniqid from 'uniqid';

import { Creature, creatureActions, CreatureClippedData } from 'entities/creature/model';
import { encounterActions } from 'entities/encounter/model';
import { useLazyGetCreatureByNameQuery } from 'pages/bestiary/api';
import { calculateInitiative } from 'shared/lib';
import { GridCard } from './gridCard';
import { ListCard } from './listCard';

import s from './BestiaryCard.module.scss';

import placeholderImage from 'shared/assets/images/placeholder.png';

type BestiaryCardProps = {
  creature: CreatureClippedData;
  viewMode: string;
  isSelected: boolean;
};

export const BestiaryCard: FC<BestiaryCardProps> = ({ creature, viewMode, isSelected }) => {
  const dispatch = useDispatch();

  const [trigger, { data: creatureData, isLoading, isError, isUninitialized, requestId }] =
    useLazyGetCreatureByNameQuery();

  const handleAddToTtackerClick = useCallback(() => {
    trigger(`${creature.url}`);
  }, [creature.url]);

  useEffect(() => {
    if (!isLoading && !isError && creatureData) {
      const currentCreature: Creature = {
        _id: creatureData._id,
        type: 'creature',
        id: uniqid(),
        name: creatureData.name.rus,
        hp: {
          current: creatureData.hits.average,
          max: creatureData.hits.average,
          temporary: 0,
        },
        ac: creatureData.armorClass,
        initiative: calculateInitiative(creatureData.ability.dex),
        conditions: [],
        stats: {
          strength: creatureData.ability.str,
          dexterity: creatureData.ability.dex,
          constitution: creatureData.ability.con,
          intelligence: creatureData.ability.int,
          wisdom: creatureData.ability.wis,
          charisma: creatureData.ability.cha,
        },
        savingThrows: creatureData.savingThrows || [],
        damageImmunities: creatureData.damageImmunities || [],
        damageResistances: creatureData.damageResistances || [],
        damageVulnerabilities: creatureData.damageVulnerabilities || [],
        conditionImmunities: creatureData.conditionImmunities || [],
        image: creatureData.images[2] || placeholderImage,
        imageToken: creatureData.images[0] || placeholderImage,
        notes: '',
        attacksLLM: creatureData.attacksLLM,
      };

      dispatch(
        encounterActions.addParticipant({
          _id: currentCreature._id,
          id: currentCreature.id,
          initiative: currentCreature.initiative,
        }),
      );
      dispatch(creatureActions.addCreature(currentCreature));

      toast.success(`${currentCreature.name} успешно добавлен!`);
    } else if (isError && !isUninitialized) {
      toast.error(`Упс, что-то пошло не так :(`);
    }
  }, [creatureData, isLoading, isError, isUninitialized, requestId]);

  const navigate = useNavigate();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        navigate(creature.url);
      }}
      className={s.cardLink}
    >
      {viewMode === 'grid' ? (
        <GridCard
          creature={creature}
          handleAddToTtackerClick={handleAddToTtackerClick}
          isSelected={isSelected}
        />
      ) : (
        <ListCard creature={creature} isSelected={isSelected} />
      )}
    </div>
  );
};
