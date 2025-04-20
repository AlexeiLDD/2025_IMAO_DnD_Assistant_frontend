import React, { useEffect, useRef, useState } from 'react';
import { Language } from 'shared/lib';
import { useDispatch, useSelector } from 'react-redux';
import { InputGroup } from 'pages/statblockGenerator/ui/armorHitdiceForm/inputGroup';
import { DefenseSection } from 'pages/statblockGenerator/ui/armorHitdiceForm/defenseSection';
import {
  GeneratedCreatureStore,
  SINGLE_CREATURE_ID,
  generatedCreatureActions,
  generatedCreatureSelectors
} from 'entities/generatedCreature/model';
import s from './ArmorSection.module.scss';
import { ArmorHitDiceLocalization } from 'pages/statblockGenerator/lib';
import { ArmorType, calculateArmorClass } from 'pages/statblockGenerator/lib/armorClassUtils';

const getArmorTypeFromName = (name: string, armorTypes: Record<string, string>): ArmorType => {
  const lowerName = name.toLowerCase();
  const match = Object.entries(armorTypes).find(([, label]) => label.toLowerCase() === lowerName);
  return match ? (match[0] as ArmorType) : 'none';
};

export const ArmorSection: React.FC<{ language: Language }> = ({ language }) => {
  const t = ArmorHitDiceLocalization[language];
  const dispatch = useDispatch();

  const creature = useSelector((state: GeneratedCreatureStore) =>
    generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID)
  );

  const armors = creature?.armors ?? [];
  const armorText = creature?.armorText ?? '';
  const dexScore = creature?.ability?.dex ?? 10;
  const dexMod = Math.floor((dexScore - 10) / 2);
  const currentAC = creature?.armorClass ?? 10;

  const hasShield = armors.some(a => a.name.toLowerCase() === t.shield.toLowerCase());

  const initialArmorType =
    armorText !== ''
      ? 'other'
      : getArmorTypeFromName(
          armors.find(a => a.name.toLowerCase() !== t.shield.toLowerCase())?.name ?? '',
          t.armorTypes
        );

  const [localArmorType, setLocalArmorType] = useState<string>(initialArmorType);
  const [natArmorBonus, setNatArmorBonus] = useState<number>(0);
  const skipNextSync = useRef(false);

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    const newType =
      armorText !== ''
        ? 'other'
        : getArmorTypeFromName(
            armors.find(a => a.name.toLowerCase() !== t.shield.toLowerCase())?.name ?? '',
            t.armorTypes
          );

    setLocalArmorType(newType);
  }, [armorText, armors, t.armorTypes, t.shield]);

  useEffect(() => {
    if (
      getArmorTypeFromName(
        (t.armorTypes as Record<string, string>)[localArmorType] ?? localArmorType,
        { 'natural armor': 'Природный доспех', ...t.armorTypes }
      ) !== 'natural armor'
    ) return;
  
    const expectedBaseAC = calculateArmorClass('natural armor', dexMod, hasShield, 0);
    const calculatedBonus = (currentAC ?? 10) - expectedBaseAC;
  
    if (calculatedBonus !== natArmorBonus) {
      setNatArmorBonus(calculatedBonus);
    }
  }, [currentAC, localArmorType, dexMod, hasShield, t.armorTypes]);

  const armorOptions = Object.entries(t.armorTypes).map(([value, label]) => ({ value, label }));

  const recalcAC = (type: ArmorType, shield: boolean, dex: number, natBonus: number = 0) => {
    return calculateArmorClass(type, dex, shield, natBonus);
  };

  const updateArmorType = (value: string) => {
    setLocalArmorType(value);

    if (value === 'other') {
      skipNextSync.current = true;
      dispatch(generatedCreatureActions.setArmorText({ id: SINGLE_CREATURE_ID, value: '' }));
      dispatch(generatedCreatureActions.setArmors({ id: SINGLE_CREATURE_ID, value: [] }));
    } else {
      const mainArmor = {
        name: (t.armorTypes as Record<string, string>)[value] ?? value,
        type: 'armor',
        url: null
      };

      const updated = hasShield
        ? [mainArmor, { name: t.shield, type: 'armor', url: '/armors/shield' }]
        : [mainArmor];

      dispatch(generatedCreatureActions.setArmors({ id: SINGLE_CREATURE_ID, value: updated }));
      dispatch(generatedCreatureActions.setArmorText({ id: SINGLE_CREATURE_ID, value: '' }));
    }

    const newAC = recalcAC(value as ArmorType, hasShield, dexMod, value === 'natural armor' ? natArmorBonus : 0);
    dispatch(generatedCreatureActions.setArmorClass({ id: SINGLE_CREATURE_ID, value: newAC }));
  };

  const updateShield = (enabled: boolean) => {
    if (localArmorType === 'other') return;

    const mainArmor = armors.find(a => a.name.toLowerCase() !== t.shield.toLowerCase()) ?? {
      name: t.armorTypes.none,
      type: 'armor',
      url: null
    };

    const updated = enabled
      ? [mainArmor, { name: t.shield, type: 'armor', url: '/armors/shield' }]
      : [mainArmor];

    dispatch(generatedCreatureActions.setArmors({ id: SINGLE_CREATURE_ID, value: updated }));

    const newAC = recalcAC(localArmorType as ArmorType, enabled, dexMod, localArmorType === 'natural armor' ? natArmorBonus : 0);
    dispatch(generatedCreatureActions.setArmorClass({ id: SINGLE_CREATURE_ID, value: newAC }));
  };

  const updateOtherArmor = (value: string) => {
    dispatch(generatedCreatureActions.setArmorText({ id: SINGLE_CREATURE_ID, value }));
  };

  const updateNatArmorBonus = (value: number) => {
    setNatArmorBonus(value);
    const newAC = recalcAC('natural armor', hasShield, dexMod, value);
    dispatch(generatedCreatureActions.setArmorClass({ id: SINGLE_CREATURE_ID, value: newAC }));
  };

  const showOtherArmor = localArmorType === 'other';
  const showNatArmor = getArmorTypeFromName(
    (t.armorTypes as Record<string, string>)[localArmorType] ?? localArmorType,
    {
      'natural armor': 'Природный доспех',
      ...t.armorTypes
    }
  ) === 'natural armor';

  return (
    <DefenseSection>
      <InputGroup label={t.armorType}>
        <select
          value={localArmorType}
          onChange={(e) => updateArmorType(e.target.value)}
          className={s.defensePanel__select}
        >
          {armorOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </InputGroup>

      <div className={s.defensePanel__checkboxGroup}>
        <label className={s.defensePanel__checkboxLabel}>
          <input
            type="checkbox"
            checked={hasShield}
            onChange={(e) => updateShield(e.target.checked)}
            className={s.defensePanel__checkbox}
          />
          {t.shield}
        </label>
      </div>

      {showOtherArmor && (
        <InputGroup label={t.armorDescription}>
          <input
            type="text"
            value={armorText}
            onChange={(e) => updateOtherArmor(e.target.value)}
            className={s.defensePanel__input}
          />
        </InputGroup>
      )}

      {showNatArmor && (
        <InputGroup label={t.natArmorBonus}>
          <input
            type="number"
            min={0}
            max={99}
            value={natArmorBonus}
            onChange={(e) => updateNatArmorBonus(parseInt(e.target.value) || 0)}
            className={s.defensePanel__input}
          />
        </InputGroup>
      )}
    </DefenseSection>
  );
};
