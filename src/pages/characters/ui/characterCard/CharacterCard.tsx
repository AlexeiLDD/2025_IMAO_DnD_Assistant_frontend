import { FC, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import uniqid from 'uniqid';

import { Creature, creatureActions } from 'entities/creature/model';
import { encounterActions } from 'entities/encounter/model';
import { useLazyGetCharacterByIdQuery } from 'pages/characters/api';
import { convertSavingThrows } from 'pages/characters/lib';
import { convertWeaponsToAttacks } from 'pages/characters/lib/convert';
import { CharacterClipped } from 'pages/characters/model';
import { calculateInitiative } from 'shared/lib';
import { GridCard } from './gridCard';

import placeholderImage from 'shared/assets/images/placeholder.png';

type CharacterCardProps = {
  character: CharacterClipped;
};

export const CharacterCard: FC<CharacterCardProps> = ({ character }) => {
  const dispatch = useDispatch();

  const [trigger, { data: characterData, isLoading, isError, isUninitialized, requestId }] =
    useLazyGetCharacterByIdQuery();

  const handleAddToTtackerClick = useCallback(() => {
    trigger(`${character.id}`);
  }, [character.id]);

  useEffect(() => {
    if (!isLoading && !isError && characterData) {
      const currentCreature: Creature = {
        _id: characterData.id,
        id: uniqid(),
        type: 'character',
        name: characterData.data.name.value,
        hp: {
          current: characterData.data.vitality['hp-max'].value,
          max: characterData.data.vitality['hp-max'].value,
          temporary: 0,
        },
        ac: characterData.data.vitality.ac.value,
        initiative: calculateInitiative(characterData.data.stats.dex.score),
        conditions: [],
        stats: {
          strength: characterData.data.stats.str.score,
          dexterity: characterData.data.stats.dex.score,
          constitution: characterData.data.stats.con.score,
          intelligence: characterData.data.stats.int.score,
          wisdom: characterData.data.stats.wis.score,
          charisma: characterData.data.stats.cha.score,
        },
        savingThrows: convertSavingThrows(characterData.data.saves) || [],
        damageImmunities: [],
        damageResistances: [],
        damageVulnerabilities: [],
        conditionImmunities: [],
        image: characterData.data.avatar.jpeg || characterData.data.avatar.webp || placeholderImage,
        notes: '',
        attacksLLM: convertWeaponsToAttacks(characterData.data.weaponsList),
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
  }, [characterData, isLoading, isError, isUninitialized, requestId]);

  return <GridCard character={character} handleAddToTtackerClick={handleAddToTtackerClick} />;
};
