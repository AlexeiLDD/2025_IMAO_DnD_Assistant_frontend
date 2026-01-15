import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { AppDispatch } from 'app/store';
import { AuthState, AuthStore } from 'entities/auth/model';
import { CreatureFullData } from 'entities/creature/model';
import {
  GeneratedCreatureStore,
  SINGLE_CREATURE_ID,
  generatedCreatureSelectors,
} from 'entities/generatedCreature/model';
import { CreatureStatblock } from 'pages/bestiary';
import { bestiaryApi } from 'pages/bestiary/api';
import { JumpTarget } from 'pages/bestiary/model';
import {
  GetCreaturesRequest,
  useGetCreaturesQuery,
  useLazyGetCreatureByNameQuery,
} from 'pages/statblockGenerator/api';
import { useAddCreatureMutation } from '../api/statblockGenerator.api';
import { promptPresetOptions, useGlow } from '../lib';
import { applyCreatureData } from '../model';
import { ArmorHitdiceForm } from './armorHitdiceForm';
import { AttackForm } from './attackForm';
import { CollapsiblePanelRef } from './collapsiblePanel/CollapsiblePanel';
import { CreatureSaveSection } from './creatureSaveSection';
import { DamageLanguagesForm } from './damageLanguagesForm';
import { MonsterSpeedForm } from './monsterSpeedForm';
import { MonsterStatsForm } from './monsterStatsForm';
import { PromptSection } from './promptSection';
import { PropertiesListsForm } from './propertiesListsForm';
import { SensesForm } from './sensesForm';
import { TypeForm } from './typeForm';

import s from './StatblockGenerator.module.scss';

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
  const [fullCreatureData, setFullCreatureData] = useState<CreatureFullData | null>(null);
  const [addCreature, { isSuccess, isError, error }] = useAddCreatureMutation();
  const { data: creatures } = useGetCreaturesQuery(requestBody);
  const [trigger, { data: fetchedCreatureData }] = useLazyGetCreatureByNameQuery();
  const { glowActiveMap, glowFadeMap, triggerGlow, clearGlow } = useGlow();

  const { isAuth } = useSelector<AuthStore>((state) => state.auth) as AuthState;

  const getGlowClass = (id: string) =>
    clsx(glowActiveMap[id] && s.glowHighlight, glowFadeMap[id] && s.glowFading);

  useEffect(() => {
    if (fetchedCreatureData) {
      setFullCreatureData(fetchedCreatureData);
    }
  }, [fetchedCreatureData]);

  const formRefs: Record<JumpTarget, React.RefObject<CollapsiblePanelRef | null>> = {
    type: useRef<CollapsiblePanelRef | null>(null),
    armor: useRef<CollapsiblePanelRef | null>(null),
    speed: useRef<CollapsiblePanelRef | null>(null),
    stats: useRef<CollapsiblePanelRef | null>(null),
    properties: useRef<CollapsiblePanelRef | null>(null),
    damage: useRef<CollapsiblePanelRef | null>(null),
    senses: useRef<CollapsiblePanelRef | null>(null),
    attack: useRef<CollapsiblePanelRef | null>(null),
  };

  const onJump = (target: JumpTarget) => {
    const panel = formRefs[target].current;
    panel?.expand();
    setTimeout(() => {
      panel?.rootElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const generatedCreature = useSelector((state: GeneratedCreatureStore) =>
    generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID),
  );

  const presetOptions = creatures?.map((creature) => ({
    label: creature.name.rus, // То, что будет отображаться в списке
    value: creature.url, // То, что будет значением при выборе
  }));
  const [selectedPreset, setSelectedPreset] = useState('');

  const handleTextChange = (text: string) => {
    setSelectedPreset(text);
  };

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (isSuccess) {
      toast.success('Существо успешно сохранено!');
      // Invalidate bestiaryApi cache so user creature lists refresh
      dispatch(bestiaryApi.util.invalidateTags(['Creature']));
    }
    if (isError) {
      toast.error('Не удалось сохранить существо 😢');
      console.error('Ошибка:', error);
    }
  }, [isSuccess, isError, error, dispatch]);

  const onSave = () => {
    if (!generatedCreature) {
      toast.warning('Нет существа для сохранения');
      return;
    }

    const { imageBase64, imageBase64Circle } = generatedCreature;
  
    if (!imageBase64?.trim() && !imageBase64Circle?.trim()) {
      toast.warning('Безобразное существо... в буквальном смысле. Добавь изображение!');
      return;
    }
  
    void addCreature(generatedCreature); // без unwrap
  };

  useEffect(() => {
    if (fullCreatureData) {
      if (fullCreatureData) {
        applyCreatureData(dispatch, fullCreatureData, SINGLE_CREATURE_ID);
      }
    }
  }, [fullCreatureData, dispatch]);

  const handleUsePreset = () => {
    if (selectedPreset) {
      void trigger(selectedPreset);

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('Применен пресет:', selectedPreset);
      }
    }
  };

  const [panelWidth, setPanelWidth] = useState<number>(900);
  const MIN_PANEL_WIDTH = 520;
  const MIN_RIGHT_PANEL_WIDTH = 240;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = startWidth + delta;

      if (newWidth >= MIN_PANEL_WIDTH) {
        setPanelWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className={s.statblockGeneratorContainer}>
      <div className={s.statblockGeneratorPanel} style={{ width: `${panelWidth}px` }}>
        <div className={s.promptSectionWrapper} style={{ position: 'relative' }}>
          {!isAuth && (
            <div className={s.authOverlay}>
              🔒 Авторизуйтесь, чтобы использовать генератор существа по описанию
            </div>
          )}

          <div
            style={{
              opacity: isAuth ? 1 : 0.3,
              pointerEvents: isAuth ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
            }}
          >
            <PromptSection
              language='ru'
              presetOptions={promptPresetOptions}
              onGenerate={(creature) => {
                setFullCreatureData(creature);
              }}
            />
          </div>
        </div>

        <CreatureSaveSection
          presetOptions={presetOptions}
          selectedPreset={selectedPreset}
          onTextChange={handleTextChange}
          onUsePreset={handleUsePreset}
          onTriggerPreset={trigger}
          onSave={onSave}
        />
        {/* <ActualStatblock  />  */}
        <TypeForm
          ref={formRefs.type}
          language='ru'
          clearGlow={clearGlow}
          getGlowClass={getGlowClass}
        />
        <ArmorHitdiceForm ref={formRefs.armor} language='ru' />
        <MonsterSpeedForm ref={formRefs.speed} language='ru' />
        <MonsterStatsForm
          ref={formRefs.stats}
          language='ru'
          clearGlow={clearGlow}
          getGlowClass={getGlowClass}
        />
        <PropertiesListsForm ref={formRefs.properties} language='ru' />
        <DamageLanguagesForm ref={formRefs.damage} language='ru' />
        <SensesForm ref={formRefs.senses} language='ru' />
        <AttackForm ref={formRefs.attack} />
      </div>

      <div className={s.resizer} onMouseDown={handleMouseDown} />

      <div
        className={s.creatureStatblockPanel}
        style={{
          flex: 1,
          minWidth: `${MIN_RIGHT_PANEL_WIDTH}px`, // Устанавливаем минимальную ширину
        }}
      >
        <CreatureStatblock creature={generatedCreature} onJump={onJump} triggerGlow={triggerGlow} />
      </div>
    </div>
  );
};
