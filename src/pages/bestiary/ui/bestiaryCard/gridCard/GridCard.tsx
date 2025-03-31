import { CreatureClippedData } from 'entities/creature/model';
import { FC } from 'react';
import placeholderImage from 'shared/assets/images/placeholder.png';
import s from './GridCard.module.scss';

type GridCardProps = {
  creature: CreatureClippedData;
  handleAddToTtackerClick: () => void;
};

export const GridCard: FC<GridCardProps> = ({ creature, handleAddToTtackerClick }) => {
  return (
    <div className={s.card}>
      <div className={s.imageContainer}>
        <img
          src={creature.images[2] || creature.images[1] || placeholderImage}
          alt={creature.name.eng}
        />
      </div>

      <div className={s.infoContainer}>
        <div className={s.header}>
          <div className={s.header__titleContainer}>
            <div className={s.header__title}>{creature.name.rus}</div>
            <span className={s.tooltip}>{creature.name.rus}</span>
          </div>
          <div className={s.header__tags}>
            <span className={s.header__typeTag}>{creature.type.name}</span>
            {creature.type?.tags &&
              creature.type?.tags.map((tag, index) => (
                <span key={index} className={s.header__subTag}>
                  {tag}
                </span>
              ))}
          </div>
        </div>

        <div className={s.statsContainer}>
          <div className={s.statsContainer__item}>Класс опасности: {creature.challengeRating}</div>
          <div className={s.statsContainer__item}>Источник: {creature.source.group.shortName}</div>
        </div>

        <div className={s.btnsContainer}>
          <button onClick={() => handleAddToTtackerClick()} data-variant='primary'>
            Добавить в трекер
          </button>
        </div>
      </div>
    </div>
  );
};
