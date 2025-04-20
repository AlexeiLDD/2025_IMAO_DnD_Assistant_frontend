//import { ActualStatblock } from './actualStatblock';
import {
  GetCreaturesRequest,
  useGetCreaturesQuery,
  useLazyGetCreatureByNameQuery,
} from 'pages/statblockGenerator/api';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ArmorHitdiceForm } from './armorHitdiceForm';
import { AttackForm } from './attackForm';
import { CreatureSaveSection } from './creatureSaveSection';
import { DamageLanguagesForm } from './damageLanguagesForm';
import { MonsterSpeedForm } from './monsterSpeedForm';
import { MonsterStatsForm } from './monsterStatsForm';
import { PromptSection } from './promptSection';
import { PropertiesListsForm } from './propertiesListsForm';
import { SensesForm } from './sensesForm';
import s from './StatblockGenerator.module.scss';
import { TypeForm } from './typeForm';

import { SINGLE_CREATURE_ID, generatedCreatureActions } from 'entities/generatedCreature/model';

const requestBody: GetCreaturesRequest = {
  start: 0,
  size: 10,
  search: {
    value: '',
    exact: false,
  },
  order: [
    {
      field: 'name',
      direction: 'asc',
    },
  ],
  filter: {
    book: [],
    npc: [],
    challengeRating: [],
    type: [],
    size: [],
    tag: [],
    moving: [],
    senses: [],
    vulnerabilityDamage: [],
    resistanceDamage: [],
    immunityDamage: [],
    immunityCondition: [],
    features: [],
    environment: [],
  },
};

export const StatblockGenerator = () => {
  const { data: creatures } = useGetCreaturesQuery(requestBody);
  const [trigger, { data: fullCreatureData }] = useLazyGetCreatureByNameQuery();

  const presetOptions = creatures?.map((creature) => ({
    label: creature.name.rus, // То, что будет отображаться в списке
    value: creature.url, // То, что будет значением при выборе
  }));
  const [selectedPreset, setSelectedPreset] = useState('');

  const handleTextChange = (text: string) => {
    setSelectedPreset(text);
  };

  const dispatch = useDispatch();

  useEffect(() => {
    if (fullCreatureData) {
      dispatch(
        generatedCreatureActions.updateCreatureName({
          id: SINGLE_CREATURE_ID,
          name: {
            rus: fullCreatureData.name.rus,
            eng: fullCreatureData.name.eng,
          },
        }),
      );

      dispatch(
        generatedCreatureActions.updateCreatureSize({
          id: SINGLE_CREATURE_ID,
          size: {
            rus: fullCreatureData.size.rus,
            eng: fullCreatureData.size.eng,
            cell: fullCreatureData.size.cell,
          },
        }),
      );

      dispatch(
        generatedCreatureActions.updateCreatureType({
          id: SINGLE_CREATURE_ID,
          type: {
            name: fullCreatureData.type.name,
            tags: fullCreatureData.type.tags,
          },
        }),
      );

      dispatch(
        generatedCreatureActions.updateTags({
          id: SINGLE_CREATURE_ID,
          tags: fullCreatureData.tags,
        }),
      );

      dispatch(
        generatedCreatureActions.updateAlignment({
          id: SINGLE_CREATURE_ID,
          alignment: fullCreatureData.alignment,
        }),
      );

      dispatch(
        generatedCreatureActions.updateAbilityScores({
          id: SINGLE_CREATURE_ID,
          ability: {
            str: fullCreatureData.ability.str,
            dex: fullCreatureData.ability.dex,
            con: fullCreatureData.ability.con,
            int: fullCreatureData.ability.int,
            wis: fullCreatureData.ability.wis,
            cha: fullCreatureData.ability.cha,
          },
        }),
      );

      dispatch(
        generatedCreatureActions.updateSavingThrows({
          id: SINGLE_CREATURE_ID,
          savingThrows: fullCreatureData.savingThrows || [],
        }),
      );

      dispatch(
        generatedCreatureActions.updateSkills({
          id: SINGLE_CREATURE_ID,
          skills: fullCreatureData.skills,
        }),
      );

      dispatch(
        generatedCreatureActions.updateConditionImmunities({
          id: SINGLE_CREATURE_ID,
          conditionImmunities: fullCreatureData.conditionImmunities || [],
        }),
      );

      dispatch(
        generatedCreatureActions.updateProficiencyBonus({
          id: SINGLE_CREATURE_ID,
          proficiencyBonus: fullCreatureData.proficiencyBonus,
        }),
      );

      dispatch(
        generatedCreatureActions.updateDamageImmunities({
          id: SINGLE_CREATURE_ID,
          damageImmunities: fullCreatureData.damageImmunities || [],
        }),
      );

      dispatch(
        generatedCreatureActions.updateDamageResistances({
          id: SINGLE_CREATURE_ID,
          damageResistances: fullCreatureData.damageResistances || [],
        }),
      );

      dispatch(
        generatedCreatureActions.updateDamageVulnerabilities({
          id: SINGLE_CREATURE_ID,
          damageVulnerabilities: fullCreatureData.damageVulnerabilities || [],
        }),
      );

      dispatch(
        generatedCreatureActions.updateLanguages({
          id: SINGLE_CREATURE_ID,
          languages: fullCreatureData.languages || [],
        }),
      );

      dispatch(
        generatedCreatureActions.updateSpeed({
          id: SINGLE_CREATURE_ID,
          speed: fullCreatureData.speed || [],
        }),
      );

      dispatch(
        generatedCreatureActions.updateSenses({
          id: SINGLE_CREATURE_ID,
          senses: fullCreatureData.senses,
        }),
      );

      dispatch(
        generatedCreatureActions.updateArmorClass({
          id: SINGLE_CREATURE_ID,
          armorClass: fullCreatureData.armorClass,
        }),
      );

      dispatch(
        generatedCreatureActions.updateArmors({
          id: SINGLE_CREATURE_ID,
          armors: fullCreatureData.armors || [],
        }),
      );

      dispatch(
        generatedCreatureActions.updateArmorText({
          id: SINGLE_CREATURE_ID,
          armorText: fullCreatureData.armorText || '',
        }),
      );

      dispatch(
        generatedCreatureActions.updateHitPoints({
          id: SINGLE_CREATURE_ID,
          hits: fullCreatureData.hits,
        }),
      );
    }
  }, [fullCreatureData, dispatch]);

  const handleUsePreset = () => {
    if (selectedPreset) {
      // Загружаем полные данные о существе по имени
      trigger(selectedPreset);

      // Здесь можно добавить дополнительную логику
      console.log('Применен пресет:', selectedPreset);
    }
  };

  return (
    <div className={s.statblockGeneratorContainer}>
      <div className={s.statblockGeneratorPanel}>
        <PromptSection language='ru' />
        <CreatureSaveSection
          presetOptions={presetOptions}
          selectedPreset={selectedPreset}
          onTextChange={handleTextChange}
          onUsePreset={handleUsePreset}
          onTriggerPreset={trigger}
          // Другие пропсы...
        />
        {/* <ActualStatblock  />  */}
        <TypeForm language='ru' />
        <ArmorHitdiceForm language='ru' />
        <MonsterSpeedForm language='ru' />
        <MonsterStatsForm language='ru' />
        <PropertiesListsForm language='ru' />
        <DamageLanguagesForm language='ru' />
        <SensesForm language='ru' />
        <AttackForm />
      </div>
    </div>
  );
};
