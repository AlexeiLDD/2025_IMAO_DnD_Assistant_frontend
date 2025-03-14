import { CreatureClippedData } from 'entities/creature/model/types';
import { FC, useEffect } from 'react';

import { Creature, creatureActions } from 'entities/creature/model';
import { encounterActions } from 'entities/encounter/model';
import { useLazyGetCreatureByNameQuery } from 'pages/bestiary/api';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';
import placeholderImage from 'shared/assets/images/placeholder.png';
import s from './BestiaryCard.module.scss';

export const BestiaryCard: FC<{ creature: CreatureClippedData }> = ({
  creature,
}) => {
  const dispatch = useDispatch();

  const [trigger, { data: creatureData, isLoading, isError }] =
    useLazyGetCreatureByNameQuery();

  const handleSearchClick = () => {
    trigger(`${creature.url}`);
  };

  useEffect(() => {
    if (!isLoading && !isError && creatureData) {
      const currentCreature: Creature = {
        id: creatureData._id,
        name: creatureData.name.rus,
        hp: {
          current: creatureData.hits.average,
          max: creatureData.hits.average,
          temporary: 0,
        },
        ac: creatureData.armorClass,
        initiative: Math.floor(Math.random() * 19) + 2,
        conditions: [],
        stats: {
          strength: creatureData.ability.str,
          dexterity: creatureData.ability.dex,
          constitution: creatureData.ability.con,
          intelligence: creatureData.ability.int,
          wisdom: creatureData.ability.wiz,
          charisma: creatureData.ability.cha,
        },
        image: creatureData.images[2] || placeholderImage,
        notes: '',
      };

      dispatch(encounterActions.addParticipant(currentCreature.id));
      dispatch(creatureActions.addCreature(currentCreature));
      console.log(creature);
    }
  }, [creatureData, isLoading, isError]);

  return (
    <div className={s.card}>
      <div className={s.cardContainer}>
        <div className={s.imageWrapper}>
          <img
            src={creature.images[0]}
            alt={creature.name.eng}
            className={s.creatureImage}
          />
        </div>

        <div className={s.content}>
          <div className={s.header}>
            <h2 className={s.title}>
              {creature.name.rus}
              {/* <span className={s.titleExtra}>({creature.name.rus})</span> */}
            </h2>
            <div className={s.tags}>
              <span className={s.typeTag}>{creature.type.name}</span>
              {creature.type?.tags &&
                creature.type?.tags.map((tag, index) => (
                  <span key={index} className={s.subTag}>
                    {tag}
                  </span>
                ))}
            </div>
          </div>

          <div className={s.stats}>
            <div className={s.statItem}>
              <label className={s.statLabel}>Уровень сложности</label>
              <p className={s.statValue}>{creature.challengeRating}</p>
            </div>
            <div className={s.statItem}>
              <label className={s.statLabel}>Источник</label>
              <p className={s.statValue}>
                {creature.source.shortName} ({creature.source.group.shortName})
              </p>
            </div>
          </div>

          <div className={s.linkWrapper}>
            <button onClick={() => handleSearchClick()} className={s.link}>
              Дабавить в треккер
            </button>
            <Link to={'/encounter_tracker'} className={s.link}>
              Перейти в треккер
              <span className={s.linkIcon}></span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
