import {
  getConditionOptions,
  getExpertSuffix,
  getSavingThrowOptions,
  getSkillOptions,
  PropertiesListsLocalization,
  savingThrowShortNames,
  skillToAbilityMap,
} from 'pages/statblockGenerator/lib';
import { ProficiencyType, PropertiesListsFormProps } from 'pages/statblockGenerator/model';
import React, { useEffect, useMemo, useState } from 'react';

import {
  generatedCreatureActions,
  generatedCreatureSelectors,
  GeneratedCreatureStore,
  SINGLE_CREATURE_ID,
} from 'entities/generatedCreature/model';

import { useDispatch, useSelector } from 'react-redux';

import { CollapsiblePanel } from 'pages/statblockGenerator/ui/collapsiblePanel';
import { PropertySection } from 'pages/statblockGenerator/ui/propertiesListsForm/propertySection';
import { capitalizeFirstLetter, lowercaseFirstLetter } from 'shared/lib';
import s from './PropertiesListsForm.module.scss';

export const PropertiesListsForm: React.FC<PropertiesListsFormProps> = ({
  initialSavingThrows = [],
  initialSkills = [],
  initialConditionImmunities = [],
  language = 'en',
}) => {
  const generatedCreature = useSelector((state: GeneratedCreatureStore) =>
    generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID),
  );

  const proficiencyBonus = Number(generatedCreature?.proficiencyBonus ?? 2);
  const abilityScores = generatedCreature.ability ?? {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  const dispatch = useDispatch();

  const [selectedSthrow, setSelectedSthrow] = useState<string>('str');
  const [selectedSkill, setSelectedSkill] = useState<string>('acrobatics');
  const [selectedCondition, setSelectedCondition] = useState<string>('blinded');
  const [savingThrows, setSavingThrows] = useState<string[]>(initialSavingThrows);
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [conditionImmunities, setConditionImmunities] = useState<string[]>(
    initialConditionImmunities,
  );

  const t = PropertiesListsLocalization[language];
  const savingThrowOptions = getSavingThrowOptions(language);
  const skillOptions = getSkillOptions(language);
  const conditionOptions = getConditionOptions(language);

  useEffect(() => {
    if (generatedCreature && generatedCreature.savingThrows) {
      const initialNames = generatedCreature.savingThrows.map((st) => st.name);
      setSavingThrows(initialNames);
    }

    if (generatedCreature?.conditionImmunities) {
      setConditionImmunities(generatedCreature.conditionImmunities.map(capitalizeFirstLetter));
    }

    if (generatedCreature?.skills) {
      const formattedSkills = generatedCreature.skills.map((skill) => {
        const isExpert = skill.value === 2 * proficiencyBonus;
        const suffix = isExpert ? ' (эксперт)' : '';
        return capitalizeFirstLetter(skill.name) + suffix;
      });

      setSkills(formattedSkills);
    }
  }, [generatedCreature]);

  const formattedSkills = useMemo(() => {
    if (!generatedCreature?.skills) return [];

    return generatedCreature.skills.map((skill) => {
      const skillKey = skillOptions.find((opt) => opt.label === skill.name)?.value;
      const abilityKey = skillKey ? skillToAbilityMap[skillKey] : null;

      const abilityScore = abilityKey ? (generatedCreature.ability?.[abilityKey] ?? 10) : 10;
      const abilityModifier = Math.floor((abilityScore - 10) / 2);

      const rawProficiencyPart = skill.value - abilityModifier;
      const isExpert = rawProficiencyPart === 2 * proficiencyBonus;

      const suffix = isExpert ? ' (эксперт)' : '';
      return capitalizeFirstLetter(skill.name) + suffix;
    });
  }, [generatedCreature?.skills, generatedCreature?.ability, proficiencyBonus, skillOptions]);

  const addSavingThrow = () => {
    const selected = savingThrowOptions.find((opt) => opt.value === selectedSthrow);
    if (!selected || savingThrows.includes(selected.label)) return;

    setSavingThrows([...savingThrows, selected.label]);

    const existingSavingThrow = generatedCreature.savingThrows?.find(
      (st) => st.name === selected.label,
    );

    if (existingSavingThrow) {
      dispatch(
        generatedCreatureActions.addSavingThrow({
          id: SINGLE_CREATURE_ID,
          savingThrow: existingSavingThrow,
        }),
      );
    } else {
      const shortName = savingThrowShortNames[selected.label] || selected.label.slice(0, 3);

      dispatch(
        generatedCreatureActions.addSavingThrow({
          id: SINGLE_CREATURE_ID,
          savingThrow: {
            name: selected.label,
            shortName: shortName,
            value: 0, //TBU
          },
        }),
      );
    }
  };

  const addSkill = (proficiency: ProficiencyType) => {
    const selected = skillOptions.find((opt) => opt.value === selectedSkill);
    if (!selected) return;

    const skillName = selected.label;
    const skillKey = selected.value;
    const expertSuffix = getExpertSuffix(language);
    const isExpert = proficiency === 'expert';

    const relatedAbility = skillToAbilityMap[skillKey];
    const abilityScore = abilityScores[relatedAbility] ?? 10;
    const abilityModifier = Math.floor((abilityScore - 10) / 2);
    const proficiencyValue = isExpert ? 2 * proficiencyBonus : proficiencyBonus;

    const totalValue = abilityModifier + proficiencyValue;

    const formatted = isExpert ? `${skillName}${expertSuffix}` : skillName;

    const existingIndex = skills.findIndex(
      (skill) => skill === skillName || skill === `${skillName}${expertSuffix}`,
    );

    const updatedSkills = [...skills];
    if (existingIndex >= 0) {
      updatedSkills[existingIndex] = formatted;
    } else {
      updatedSkills.push(formatted);
    }

    setSkills(updatedSkills);

    dispatch(
      generatedCreatureActions.addOrUpdateSkill({
        id: SINGLE_CREATURE_ID,
        skill: {
          name: skillName,
          value: totalValue,
        },
      }),
    );
  };

  const addConditionImmunity = () => {
    const selected = conditionOptions.find((opt) => opt.value === selectedCondition);
    if (!selected || conditionImmunities.includes(selected.label)) return;

    const labelCapitalized = capitalizeFirstLetter(selected.label);
    const labelLowercased = lowercaseFirstLetter(selected.label);

    setConditionImmunities([...conditionImmunities, labelCapitalized]);

    dispatch(
      generatedCreatureActions.addConditionImmunity({
        id: SINGLE_CREATURE_ID,
        value: labelLowercased,
      }),
    );
  };

  type ItemType = 'savingThrow' | 'conditionImmunity' | 'skill';

  const removeItem = (
    _list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    type: ItemType,
  ) => {
    const itemToRemove = _list[index];
    setList((prev) => prev.filter((_, i) => i !== index));

    switch (type) {
      case 'savingThrow':
        dispatch(
          generatedCreatureActions.removeSavingThrow({
            id: SINGLE_CREATURE_ID,
            name: itemToRemove,
          }),
        );
        break;

      case 'conditionImmunity':
        dispatch(
          generatedCreatureActions.removeConditionImmunity({
            id: SINGLE_CREATURE_ID,
            value: lowercaseFirstLetter(itemToRemove),
          }),
        );
        break;

      case 'skill':
        const baseName = itemToRemove.split(' ')[0];
        dispatch(
          generatedCreatureActions.removeSkill({
            id: SINGLE_CREATURE_ID,
            name: baseName,
          }),
        );
        break;

      default:
        console.warn(`Unknown item type: ${type}`);
    }
  };

  const getSelectedSkillLabel = () => {
    return skillOptions.find((opt) => opt.value === selectedSkill)?.label || '';
  };

  const isSkillExpert = (skillName: string) => {
    const expertSuffix = getExpertSuffix(language);
    return skillName.endsWith(expertSuffix);
  };

  const getCurrentProficiency = () => {
    const selected = skillOptions.find((opt) => opt.value === selectedSkill);
    if (!selected) return null;

    const skillText = selected.label;
    const existingSkill = skills.find(
      (skill) => skill === skillText || skill.startsWith(`${skillText} (`),
    );

    if (!existingSkill) return null;
    return isSkillExpert(existingSkill) ? 'expert' : 'proficient';
  };

  return (
    <CollapsiblePanel title={t.title}>
      <div className={s.propertiesPanel__sections}>
        <PropertySection
          title={t.savingThrows}
          selectedValue={selectedSthrow}
          options={savingThrowOptions}
          onSelectChange={setSelectedSthrow}
          onAddItem={addSavingThrow}
          items={savingThrows}
          onRemoveItem={(index) => removeItem(savingThrows, setSavingThrows, index, 'savingThrow')}
          buttonText={t.proficient}
          removeText={t.remove}
        />

        <PropertySection
          title={t.skills}
          selectedValue={selectedSkill}
          options={skillOptions}
          onSelectChange={setSelectedSkill}
          onAddItem={(prof) => addSkill(prof || 'proficient')}
          items={formattedSkills}
          onRemoveItem={(index) => removeItem(skills, setSkills, index, 'skill')}
          buttonText={t.proficient}
          removeText={t.remove}
          additionalButton={{
            text: t.expert,
            onClick: () => addSkill('expert'),
          }}
          language={language}
          isSkillsSection={true}
          selectedSkillLabel={getSelectedSkillLabel()}
          currentProficiency={getCurrentProficiency()}
        />

        <PropertySection
          title={t.conditionImmunities}
          selectedValue={selectedCondition}
          options={conditionOptions}
          onSelectChange={setSelectedCondition}
          onAddItem={addConditionImmunity}
          items={conditionImmunities}
          onRemoveItem={(index) =>
            removeItem(conditionImmunities, setConditionImmunities, index, 'conditionImmunity')
          }
          buttonText={t.immune}
          removeText={t.remove}
        />
      </div>
    </CollapsiblePanel>
  );
};
