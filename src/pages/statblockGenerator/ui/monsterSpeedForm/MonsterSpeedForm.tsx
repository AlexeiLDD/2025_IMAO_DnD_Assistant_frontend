import {
  generatedCreatureActions,
  generatedCreatureSelectors,
  GeneratedCreatureStore,
  SINGLE_CREATURE_ID,
} from 'entities/generatedCreature/model';
import { MonsterSpeedLocalization } from 'pages/statblockGenerator/lib';
import { MonsterSpeedFormProps, MonsterSpeedFormState } from 'pages/statblockGenerator/model';
import { CollapsiblePanel } from 'pages/statblockGenerator/ui/collapsiblePanel';
import { SpeedInput } from 'pages/statblockGenerator/ui/monsterSpeedForm/speedInput';
import { ToggleSwitch } from 'pages/statblockGenerator/ui/monsterSpeedForm/toggleSwitch';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import s from './MonsterSpeedForm.module.scss';

export const MonsterSpeedForm: React.FC<MonsterSpeedFormProps> = ({
  initialSpeed = 30,
  initialBurrowSpeed = 0,
  initialClimbSpeed = 0,
  initialFlySpeed = 0,
  initialSwimSpeed = 0,
  initialCustomSpeed = '',
  language = 'en',
}) => {
  const [state, setState] = useState<MonsterSpeedFormState>({
    speed: initialSpeed,
    burrowSpeed: initialBurrowSpeed,
    climbSpeed: initialClimbSpeed,
    flySpeed: initialFlySpeed,
    swimSpeed: initialSwimSpeed,
    customSpeed: initialCustomSpeed,
    useCustomSpeed: false,
    hover: false,
  });

  const dispatch = useDispatch();
  const generatedCreature = useSelector((state: GeneratedCreatureStore) =>
    generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID),
  );

  const speedArray = generatedCreature?.speed ?? [];
  const useCustomSpeed = generatedCreature?.useCustomSpeed ?? false;
  const customSpeed = generatedCreature?.customSpeed ?? '';

  const getSpeedByName = (name: string | undefined) => speedArray.find((s) => s.name === name);

  const getSpeedValue = (name?: string) => getSpeedByName(name)?.value ?? 0;

  const isHover = () => getSpeedByName('летая')?.additional === 'парит';

  const updateNamedSpeed = (name: string | undefined, value: number) => {
    let updated = speedArray.map((entry) => {
      if (entry.name === name) {
        return { ...entry, value };
      }
      return entry;
    });

    const exists = updated.some((entry) => entry.name === name);

    if (!exists && value > 0) {
      updated.push({ name, value });
    }

    // Удаляем записи с value === 0
    updated = updated.filter((entry) => entry.value > 0 || entry.name === undefined);

    dispatch(
      generatedCreatureActions.setSpeed({
        id: SINGLE_CREATURE_ID,
        value: updated,
      }),
    );
  };

  const updateHover = (enabled: boolean) => {
    const updated = speedArray.map((entry) => {
      if (entry.name === 'летая') {
        if (enabled) {
          return { ...entry, additional: 'парит' };
        } else {
          const { additional, ...rest } = entry;
          return rest;
        }
      }
      return entry;
    });

    dispatch(
      generatedCreatureActions.setSpeed({
        id: SINGLE_CREATURE_ID,
        value: updated,
      }),
    );
  };

  const updateUseCustom = (value: boolean) => {
    dispatch(
      generatedCreatureActions.setUseCustomSpeed({
        id: SINGLE_CREATURE_ID,
        value,
      }),
    );
  };

  const updateCustomSpeed = (value: string) => {
    dispatch(
      generatedCreatureActions.setCustomSpeed({
        id: SINGLE_CREATURE_ID,
        value,
      }),
    );
  };

  const t = MonsterSpeedLocalization[language];

  return (
    <CollapsiblePanel title={t.title}>
      <div className={s.movementPanel__controls}>
        <ToggleSwitch label={t.customSpeed} checked={useCustomSpeed} onChange={updateUseCustom} />

        {useCustomSpeed ? (
          <div className={s.movementPanel__customSpeed}>
            <label className={s.movementPanel__label}>
              {t.speed}
              <input
                type='text'
                value={customSpeed}
                onChange={(e) => updateCustomSpeed(e.target.value)}
                className={s.movementPanel__textInput}
                placeholder={t.customSpeedPlaceholder}
              />
            </label>
          </div>
        ) : (
          <div className={s.movementPanel__speedTypes}>
            <SpeedInput
              label={t.speed}
              value={getSpeedValue(undefined)}
              onChange={(val) => updateNamedSpeed(undefined, val)}
              units={t.units}
            />
            <SpeedInput
              label={t.burrowSpeed}
              value={getSpeedValue('копая')}
              onChange={(val) => updateNamedSpeed('копая', val)}
              units={t.units}
            />
            <SpeedInput
              label={t.climbSpeed}
              value={getSpeedValue('лазая')}
              onChange={(val) => updateNamedSpeed('лазая', val)}
              units={t.units}
            />
            <div className={s.movementPanel__speedInput}>
              <SpeedInput
                label={t.flySpeed}
                value={getSpeedValue('летая')}
                onChange={(val) => updateNamedSpeed('летая', val)}
                units={t.units}
              />
              {getSpeedValue('летая') > 0 && (
                <div className={s.movementPanel__hoverCheckbox}>
                  <label className={s.movementPanel__checkboxLabel}>
                    <input
                      type='checkbox'
                      checked={isHover()}
                      onChange={(e) => updateHover(e.target.checked)}
                      className={s.movementPanel__checkbox}
                    />
                    {t.hover}
                  </label>
                </div>
              )}
            </div>
            <SpeedInput
              label={t.swimSpeed}
              value={getSpeedValue('плавая')}
              onChange={(val) => updateNamedSpeed('плавая', val)}
              units={t.units}
            />
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
};
