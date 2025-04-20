import {
  generatedCreatureActions,
  generatedCreatureSelectors,
  GeneratedCreatureStore,
  SINGLE_CREATURE_ID,
} from 'entities/generatedCreature/model';
import { MonsterStatsLocalization } from 'pages/statblockGenerator/lib';
import { MonsterStats, MonsterStatsFormProps } from 'pages/statblockGenerator/model';
import { CollapsiblePanel } from 'pages/statblockGenerator/ui/collapsiblePanel';
import { StatInput } from 'pages/statblockGenerator/ui/monsterStatsForm/statInput';
import React, { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import s from './MonsterStatsForm.module.scss';

export const MonsterStatsForm: React.FC<MonsterStatsFormProps> = ({ language = 'en' }) => {
  const generatedCreature = useSelector((state: GeneratedCreatureStore) =>
    generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID),
  );

  const [stats, setStats] = useState<MonsterStats>({
    str: generatedCreature.ability.str,
    dex: generatedCreature.ability.dex,
    con: generatedCreature.ability.con,
    int: generatedCreature.ability.int,
    wis: generatedCreature.ability.wis,
    cha: generatedCreature.ability.cha,
  });
  const t = MonsterStatsLocalization[language];

  const dispatch = useDispatch();

  useEffect(() => {
    if (generatedCreature) {
      setStats((prev) => ({
        ...prev,
        str: generatedCreature.ability.str,
        dex: generatedCreature.ability.dex,
        con: generatedCreature.ability.con,
        int: generatedCreature.ability.int,
        wis: generatedCreature.ability.wis,
        cha: generatedCreature.ability.cha,
      }));
    }
  }, [generatedCreature]);

  const handleStatChange = (stat: keyof MonsterStats, value: number) => {
    setStats((prev) => ({
      ...prev,
      [stat]: value,
    }));

    dispatch(
      generatedCreatureActions.updateAbilityScore({
        id: SINGLE_CREATURE_ID,
        abilityKey: stat,
        value: value,
      }),
    );
  };

  return (
    <CollapsiblePanel title={t.title}>
      <div className={s.statsPanel__abilities}>
        {Object.entries(stats).map(([stat, value]) => (
          <StatInput
            key={stat}
            label={t.abilities[stat as keyof typeof t.abilities]}
            value={value as number}
            onChange={(value) => handleStatChange(stat as keyof MonsterStats, value)}
            modifierPrefix={t.modifierPrefix}
          />
        ))}
      </div>
    </CollapsiblePanel>
  );
};
