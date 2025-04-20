import {
  generatedCreatureActions,
  generatedCreatureSelectors,
  GeneratedCreatureStore,
  SINGLE_CREATURE_ID,
} from 'entities/generatedCreature/model';
import {
  DAMAGE_DISPLAY_MAP,
  DAMAGE_INTERNAL_MAP,
  DamageLanguagesLocalization,
  getDamageTypeOptions,
  getLanguageOptions,
} from 'pages/statblockGenerator/lib';
import { DamageLanguagesFormProps, DamageListType } from 'pages/statblockGenerator/model';
import { CollapsiblePanel } from 'pages/statblockGenerator/ui/collapsiblePanel';
import { DamageLanguageSection } from 'pages/statblockGenerator/ui/damageLanguagesForm/damageLanguageSection';
import { ListGroup } from 'pages/statblockGenerator/ui/damageLanguagesForm/listGroup';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { capitalizeFirstLetter } from 'shared/lib';
import s from './DamageLanguagesForm.module.scss';

export const DamageLanguagesForm: React.FC<DamageLanguagesFormProps> = ({
  initialDamageVulnerabilities = [],
  initialDamageResistances = [],
  initialDamageImmunities = [],
  initialLanguages = [],
  initialTelepathy = 0,
  language = 'en',
}) => {
  const t = DamageLanguagesLocalization[language];

  const dispatch = useDispatch();

  const generatedCreature = useSelector((state: GeneratedCreatureStore) =>
    generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID),
  );

  // Damage types state
  const [selectedDamageType, setSelectedDamageType] = useState<string>('acid');
  const [otherDamageType, setOtherDamageType] = useState<string>('');
  const [showOtherDamage, setShowOtherDamage] = useState<boolean>(false);
  const [damageVulnerabilities, setDamageVulnerabilities] = useState<string[]>(
    initialDamageVulnerabilities,
  );
  const [damageResistances, setDamageResistances] = useState<string[]>(initialDamageResistances);
  const [damageImmunities, setDamageImmunities] = useState<string[]>(initialDamageImmunities);

  useEffect(() => {
    if (!generatedCreature) return;

    const formatDamageList = (list: string[] = []) =>
      list.map((dmg) => capitalizeFirstLetter(DAMAGE_DISPLAY_MAP[dmg] || dmg));

    setDamageVulnerabilities(formatDamageList(generatedCreature.damageVulnerabilities));
    setDamageResistances(formatDamageList(generatedCreature.damageResistances));
    setDamageImmunities(formatDamageList(generatedCreature.damageImmunities));

    const parsedLanguages: string[] = [];
    let parsedTelepathy = 0;

    for (const entry of generatedCreature.languages ?? []) {
      const normalized = entry.toLowerCase();

      if (normalized.startsWith('телепатия')) {
        const match = normalized.match(/\d+/);
        parsedTelepathy = match ? parseInt(match[0], 10) : 0;
      } else {
        parsedLanguages.push(entry);
      }
    }

    setLanguages(parsedLanguages);
    setTelepathy(parsedTelepathy);
  }, [generatedCreature]);

  // Languages state
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Common');
  const [otherLanguage, setOtherLanguage] = useState<string>('');
  const [showOtherLanguage, setShowOtherLanguage] = useState<boolean>(false);
  const [telepathy, setTelepathy] = useState<number>(initialTelepathy);
  const [understandsBut, setUnderstandsBut] = useState<string>(t.understandsBut);
  const [languages, setLanguages] = useState<string[]>(initialLanguages);

  const damageTypeOptions = getDamageTypeOptions(language);
  const languageOptions = getLanguageOptions(language);

  const handleDamageTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDamageType(value);
    setShowOtherDamage(value === '*');
  };

  const updateLanguagesInRedux = (langs: string[], telepathy: number) => {
    const result = [...langs];

    if (telepathy > 0) {
      result.push(`телепатия ${telepathy} фт.`);
    }

    dispatch(
      generatedCreatureActions.setLanguages({
        id: SINGLE_CREATURE_ID,
        values: result,
      }),
    );
  };

  const addDamageType = (type: DamageListType) => {
    const rawLabel =
      selectedDamageType === '*'
        ? otherDamageType
        : damageTypeOptions.find((opt) => opt.value === selectedDamageType)?.label ||
          selectedDamageType;

    const displayLabel = capitalizeFirstLetter(rawLabel);
    const internalLabel = DAMAGE_INTERNAL_MAP[displayLabel] || rawLabel.toLowerCase();

    const all = {
      vulnerabilities: [...damageVulnerabilities],
      resistances: [...damageResistances],
      immunities: [...damageImmunities],
    };

    // Удалим из всех
    Object.keys(all).forEach((key) => {
      all[key as DamageListType] = all[key as DamageListType].filter(
        (item) => item !== displayLabel,
      );
    });

    all[type].push(displayLabel);

    // Обновим стейт компонента
    setDamageVulnerabilities(all.vulnerabilities);
    setDamageResistances(all.resistances);
    setDamageImmunities(all.immunities);

    // Обновим Redux
    dispatch(
      generatedCreatureActions.setDamageVulnerabilities({
        id: SINGLE_CREATURE_ID,
        values: all.vulnerabilities.map((d) => DAMAGE_INTERNAL_MAP[d] || d.toLowerCase()),
      }),
    );
    dispatch(
      generatedCreatureActions.setDamageResistances({
        id: SINGLE_CREATURE_ID,
        values: all.resistances.map((d) => DAMAGE_INTERNAL_MAP[d] || d.toLowerCase()),
      }),
    );
    dispatch(
      generatedCreatureActions.setDamageImmunities({
        id: SINGLE_CREATURE_ID,
        values: all.immunities.map((d) => DAMAGE_INTERNAL_MAP[d] || d.toLowerCase()),
      }),
    );
  };

  const removeDamageType = (type: DamageListType, index: number) => {
    const currentList = {
      vulnerabilities: damageVulnerabilities,
      resistances: damageResistances,
      immunities: damageImmunities,
    }[type];

    const updated = currentList.filter((_, i) => i !== index);

    const setMap = {
      vulnerabilities: setDamageVulnerabilities,
      resistances: setDamageResistances,
      immunities: setDamageImmunities,
    };

    setMap[type](updated);

    const reduxActionMap = {
      vulnerabilities: generatedCreatureActions.setDamageVulnerabilities,
      resistances: generatedCreatureActions.setDamageResistances,
      immunities: generatedCreatureActions.setDamageImmunities,
    };

    dispatch(
      reduxActionMap[type]({
        id: SINGLE_CREATURE_ID,
        values: updated.map((d) => DAMAGE_INTERNAL_MAP[d] || d.toLowerCase()),
      }),
    );
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLanguage(value);
    setShowOtherLanguage(value === '*');
  };

  const addLanguage = (speaks: boolean) => {
    let lang =
      selectedLanguage === '*'
        ? otherLanguage
        : languageOptions.find((opt) => opt.value === selectedLanguage)?.label || selectedLanguage;

    if (!lang) return;

    if (!speaks) {
      lang += ` (${understandsBut})`;
    }

    if (!languages.includes(lang)) {
      const newLangs = [...languages, lang];
      setLanguages(newLangs);
      updateLanguagesInRedux(newLangs, telepathy);
    }
  };

  const removeLanguage = (index: number) => {
    const updated = languages.filter((_, i) => i !== index);
    setLanguages(updated);
    updateLanguagesInRedux(updated, telepathy);
  };

  return (
    <CollapsiblePanel title={t.title}>
      <div className={s.damageLanguagesPanel__sections}>
        {/* Damage Types Section */}
        <DamageLanguageSection title={t.damageTypes}>
          <div className={s.damageLanguagesPanel__controls}>
            <select
              value={selectedDamageType}
              onChange={handleDamageTypeChange}
              className={s.damageLanguagesPanel__select}
            >
              {damageTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {showOtherDamage && (
              <input
                type='text'
                value={otherDamageType}
                onChange={(e) => setOtherDamageType(e.target.value)}
                placeholder={t.customDamagePlaceholder}
                className={s.damageLanguagesPanel__textInput}
              />
            )}
          </div>

          <div className={s.damageLanguagesPanel__buttons}>
            <button
              type='button'
              onClick={() => addDamageType('vulnerabilities')}
              className={`${s.damageLanguagesPanel__button} ${
                damageVulnerabilities.includes(
                  selectedDamageType === '*'
                    ? otherDamageType
                    : damageTypeOptions.find((opt) => opt.value === selectedDamageType)?.label ||
                        selectedDamageType,
                )
                  ? s.damageLanguagesPanel__buttonActive
                  : ''
              }`}
            >
              {t.vulnerabilities}
            </button>
            <button
              type='button'
              onClick={() => addDamageType('resistances')}
              className={`${s.damageLanguagesPanel__button} ${
                damageResistances.includes(
                  selectedDamageType === '*'
                    ? otherDamageType
                    : damageTypeOptions.find((opt) => opt.value === selectedDamageType)?.label ||
                        selectedDamageType,
                )
                  ? s.damageLanguagesPanel__buttonActive
                  : ''
              }`}
            >
              {t.resistances}
            </button>
            <button
              type='button'
              onClick={() => addDamageType('immunities')}
              className={`${s.damageLanguagesPanel__button} ${
                damageImmunities.includes(
                  selectedDamageType === '*'
                    ? otherDamageType
                    : damageTypeOptions.find((opt) => opt.value === selectedDamageType)?.label ||
                        selectedDamageType,
                )
                  ? s.damageLanguagesPanel__buttonActive
                  : ''
              }`}
            >
              {t.immunities}
            </button>
          </div>

          <div className={s.damageLanguagesPanel__lists}>
            {damageVulnerabilities.length > 0 && (
              <ListGroup
                title={t.vulnerabilitiesTitle}
                items={damageVulnerabilities}
                onRemove={(index) => removeDamageType('vulnerabilities', index)}
                removeText={t.remove}
              />
            )}

            {damageResistances.length > 0 && (
              <ListGroup
                title={t.resistancesTitle}
                items={damageResistances}
                onRemove={(index) => removeDamageType('resistances', index)}
                removeText={t.remove}
              />
            )}

            {damageImmunities.length > 0 && (
              <ListGroup
                title={t.immunitiesTitle}
                items={damageImmunities}
                onRemove={(index) => removeDamageType('immunities', index)}
                removeText={t.remove}
              />
            )}
          </div>
        </DamageLanguageSection>

        {/* Languages Section */}
        <DamageLanguageSection title={t.languages}>
          <div className={s.damageLanguagesPanel__controls}>
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className={s.damageLanguagesPanel__select}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {showOtherLanguage && (
              <input
                type='text'
                value={otherLanguage}
                onChange={(e) => setOtherLanguage(e.target.value)}
                placeholder={t.customDamagePlaceholder}
                className={s.damageLanguagesPanel__textInput}
              />
            )}
          </div>

          <div className={s.damageLanguagesPanel__telepathy}>
            <label className={s.damageLanguagesPanel__label}>
              {t.telepathy}
              <input
                type='number'
                min='0'
                max='995'
                step='5'
                value={telepathy}
                onChange={(e) => setTelepathy(parseInt(e.target.value) || 0)}
                className={s.damageLanguagesPanel__numberInput}
              />
              {t.units}
            </label>
          </div>

          <div className={s.damageLanguagesPanel__languageControls}>
            <div className={s.damageLanguagesPanel__languageButtons}>
              <button
                type='button'
                onClick={() => addLanguage(true)}
                className={s.damageLanguagesPanel__button}
              >
                {t.speaks}
              </button>
              <button
                type='button'
                onClick={() => addLanguage(false)}
                className={s.damageLanguagesPanel__button}
              >
                {t.understands}
              </button>
            </div>

            <div className={s.damageLanguagesPanel__understandsBut}>
              <span>{language === 'ru' ? 'но' : 'but'}</span>
              <input
                type='text'
                value={understandsBut}
                onChange={(e) => setUnderstandsBut(e.target.value)}
                className={s.damageLanguagesPanel__understandsInput}
              />
            </div>
          </div>

          <div className={s.damageLanguagesPanel__lists}>
            {telepathy > 0 && (
              <ListGroup
                items={[`${t.telepathy} ${telepathy} ${t.units}`]}
                onRemove={() => setTelepathy(0)}
                removeText={t.remove}
              />
            )}

            {languages.length > 0 && (
              <ListGroup
                title={t.knownLanguages}
                items={languages}
                onRemove={removeLanguage}
                removeText={t.remove}
              />
            )}
          </div>
        </DamageLanguageSection>
      </div>
    </CollapsiblePanel>
  );
};
