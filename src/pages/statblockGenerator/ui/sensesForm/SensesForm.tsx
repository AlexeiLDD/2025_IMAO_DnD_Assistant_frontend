import {
  generatedCreatureActions,
  generatedCreatureSelectors,
  GeneratedCreatureStore,
  SINGLE_CREATURE_ID,
} from 'entities/generatedCreature/model';
import { getSenseNameMap, SensesLocalization } from 'pages/statblockGenerator/lib';
import { SensesFormProps } from 'pages/statblockGenerator/model';
import { CollapsiblePanel } from 'pages/statblockGenerator/ui/collapsiblePanel';
import { SenseInput } from 'pages/statblockGenerator/ui/sensesForm/senseInput';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import s from './SensesForm.module.scss';

export const SensesForm: React.FC<SensesFormProps> = ({ language = 'en' }) => {
  const t = SensesLocalization[language];
  const senseNames = getSenseNameMap(language);

  const dispatch = useDispatch();

  const generatedCreature = useSelector((state: GeneratedCreatureStore) =>
    generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID),
  );

  const senseArray = generatedCreature?.senses?.senses ?? [];

  const applicableForBlindBeyond: Array<keyof typeof senseNames> = ['blindsight', 'tremorsense'];

  const getSenseValue = (senseKey: keyof typeof senseNames): number => {
    const senseName = senseNames[senseKey];
    return senseArray.find((s) => s.name === senseName)?.value ?? 0;
  };

  const updateSense = (senseKey: keyof typeof senseNames, value: number) => {
    const senseName = senseNames[senseKey];
    let updated = [...senseArray];

    const index = updated.findIndex((s) => s.name === senseName);

    if (value === 0 && index !== -1) {
      updated.splice(index, 1); // удалить
    } else if (index !== -1) {
      updated[index] = { ...updated[index], value };
    } else if (value > 0) {
      updated.push({ name: senseName, value });
    }

    dispatch(
      generatedCreatureActions.setSenses({
        id: SINGLE_CREATURE_ID,
        senses: updated,
      }),
    );
  };

  const hasBlindBeyond = (senseKey: keyof typeof senseNames): boolean => {
    const senseName = senseNames[senseKey];
    return senseArray.some(
      (s) => s.name === senseName && s.additional === 'слеп за пределами этого радиуса',
    );
  };

  const updateBlindBeyondFor = (senseKey: keyof typeof senseNames, enabled: boolean) => {
    const senseName = senseNames[senseKey];

    const updated = senseArray.map((sense) => {
      if (sense.name === senseName) {
        if (enabled) {
          return { ...sense, additional: 'слеп за пределами этого радиуса' };
        } else {
          const { additional, ...rest } = sense;
          return rest;
        }
      }
      return sense;
    });

    dispatch(
      generatedCreatureActions.setSenses({
        id: SINGLE_CREATURE_ID,
        senses: updated,
      }),
    );
  };

  return (
    <CollapsiblePanel title={t.title}>
      <div className={s.sensesPanel__senses}>
        {(['blindsight', 'darkvision', 'tremorsense', 'truesight'] as const).map((senseKey) => (
          <SenseInput
            key={senseKey}
            label={t[senseKey]}
            value={getSenseValue(senseKey)}
            onChange={(val) => updateSense(senseKey, val)}
            units={t.units}
            withCheckbox={
              applicableForBlindBeyond.includes(senseKey)
                ? {
                    checked: hasBlindBeyond(senseKey),
                    onChange: (val) => updateBlindBeyondFor(senseKey, Boolean(val)),
                    label: t.blindBeyond,
                  }
                : undefined
            }
          />
        ))}
      </div>
    </CollapsiblePanel>
  );
};
