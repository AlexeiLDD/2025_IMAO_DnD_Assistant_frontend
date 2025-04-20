import Tippy from '@tippyjs/react';
import { CreatureFullData } from 'entities/creature/model';
import { ToastType } from 'pages/bestiary/model';
import { D20RollToast } from 'pages/bestiary/ui/creatureStatblock/statblockToasts/d20RollToast';
import { toast } from 'react-toastify';
import { DiceType, modifiers, rollDice } from 'shared/lib';
import s from './AbilitiesSection.module.scss';

type Ability = {
  name: string;
  fullName: string;
  value: number;
  modifier: number;
};

type Abilities = Ability[];

type AbilitiesProps = {
  creature: CreatureFullData;
};

export const AbilitiesSection: React.FC<AbilitiesProps> = ({ creature }) => {
  const creatureAbilities: Abilities = [
    {
      name: 'СИЛ',
      fullName: 'Сила',
      value: creature?.ability.str,
      modifier: modifiers[creature.ability.str],
    },
    {
      name: 'ЛОВ',
      fullName: 'Ловкость',
      value: creature?.ability.dex,
      modifier: modifiers[creature.ability.dex],
    },
    {
      name: 'ТЕЛ',
      fullName: 'Телосложение',
      value: creature?.ability.con,
      modifier: modifiers[creature.ability.con],
    },
    {
      name: 'ИНТ',
      fullName: 'Интеллект',
      value: creature?.ability.int,
      modifier: modifiers[creature.ability.int],
    },
    {
      name: 'МДР',
      fullName: 'Мудрость',
      value: creature?.ability.wis,
      modifier: modifiers[creature.ability.wis],
    },
    {
      name: 'ХАР',
      fullName: 'Харизма',
      value: creature?.ability.cha,
      modifier: modifiers[creature.ability.cha],
    },
  ];

  const handleAbilityRoll = (abilityName: string, modifier: number) => {
    const roll = rollDice(DiceType.D20);

    toast(
      <D20RollToast
        type={ToastType.AbilityCheck}
        title={abilityName}
        rollResult={roll}
        modifier={modifier}
      />,
    );
  };

  return (
    <div className={s.abilitiesContainer}>
      {Object.entries(creatureAbilities).map(([_, el]) => (
        <div key={el.name}>
          <Tippy content={el.fullName}>
            <div className={s.abilitiesContainer__title}>{el.name}</div>
          </Tippy>
          <Tippy content={'Нажмите для броска 1к20'}>
            <div
              className={s.abilitiesContainer__value}
              onClick={() => handleAbilityRoll(el.name, el.modifier)}
            >
              {el.value} ({el.modifier < 0 ? '' : '+'}
              {el.modifier})
            </div>
          </Tippy>
        </div>
      ))}
    </div>
  );
};
