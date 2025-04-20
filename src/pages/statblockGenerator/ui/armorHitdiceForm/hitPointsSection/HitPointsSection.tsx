import React from 'react';
import { Language } from 'shared/lib';
import { useDispatch, useSelector } from 'react-redux';
import { InputGroup } from 'pages/statblockGenerator/ui/armorHitdiceForm/inputGroup';
import { DefenseSection } from 'pages/statblockGenerator/ui/armorHitdiceForm/defenseSection';
import { GeneratedCreatureStore, SINGLE_CREATURE_ID, generatedCreatureActions, generatedCreatureSelectors } from 'entities/generatedCreature/model';
import { calculateStatModifier } from 'shared/lib';
import s from './HitPointsSection.module.scss';
import { ArmorHitDiceLocalization } from 'pages/statblockGenerator/lib';

const hitDiceBySize: Record<string, number> = {
  tiny: 4, small: 6, medium: 8, large: 10, huge: 12, gargantuan: 20
};

export const HitPointsSection: React.FC<{ language: Language }> = ({ language }) => {
  const t = ArmorHitDiceLocalization[language];
  const dispatch = useDispatch();

  const creature = useSelector((state: GeneratedCreatureStore) =>
    generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID)
  );

  const hits = creature?.hits ?? { formula: '', average: 0 };
  const sizeKey = creature?.size?.eng ?? 'medium';
  const conScore = creature?.ability?.con ?? 10;
  const conMod = Math.floor((conScore - 10) / 2);
  const die = hitDiceBySize[sizeKey] ?? 8;
  const customHp = creature?.customHp ?? false;

  const hitDice = (() => {
    const match = hits.formula.match(/(\d+)к\d+/);
    return match ? parseInt(match[1], 10) : 1;
  })();

  const updateHitDice = (value: number) => {
    const formula = `${value}к${die}`;
    const average = Math.floor((value * (die + 1)) / 2) + (value * conMod);
    dispatch(generatedCreatureActions.setHits({ id: SINGLE_CREATURE_ID, hits: { formula, average } }));
  };

  const updateHpText = (formula: string) => {
    dispatch(generatedCreatureActions.setHits({ id: SINGLE_CREATURE_ID, hits: { ...hits, formula } }));
  };

  const updateCustomHp = (enabled: boolean) => {
    dispatch(generatedCreatureActions.setCustomHp({ id: SINGLE_CREATURE_ID, value: enabled }));
    if (!enabled) updateHitDice(hitDice);
  };

  return (
    <DefenseSection>
      <InputGroup label={t.hitDice}>
        <input
          type="number"
          min="1"
          max="99"
          value={hitDice}
          onChange={(e) => updateHitDice(parseInt(e.target.value) || 1)}
          className={s.defensePanel__input}
        />
      </InputGroup>

      <InputGroup label={t.hitPoints}>
        <input
          value={hits.formula}
          onChange={(e) => updateHpText(e.target.value)}
          disabled={!customHp}
          className={`${s.defensePanel__input} ${!customHp ? s.defensePanel__inputDisabled : ''}`}
        />
      </InputGroup>

      <div className={s.defensePanel__checkboxGroup}>
        <label className={s.defensePanel__checkboxLabel}>
          <input
            type="checkbox"
            checked={Boolean(customHp)}
            onChange={(e) => updateCustomHp(e.target.checked)}
            className={s.defensePanel__checkbox}
          />
          {t.customHP}
        </label>
      </div>
    </DefenseSection>
  );
};
