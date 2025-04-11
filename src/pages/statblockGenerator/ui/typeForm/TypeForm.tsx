import React, { useState } from 'react';
import { TypeFormLocalization } from 'pages/statblockGenerator/lib';
import { TypeFormProps, TypeFormState} from 'pages/statblockGenerator/model';
import { FormElement } from 'pages/statblockGenerator/ui/typeForm/formElement';
import { CollapsiblePanel } from 'pages/statblockGenerator/ui/collapsiblePanel';

import { useDispatch  } from 'react-redux';
import {
  SINGLE_CREATURE_ID,
  generatedCreatureActions,
  //generatedCreatureSelectors,
  //GeneratedCreatureStore,
  
} from 'entities/generatedCreature/model';

// import type {
//   CreatureFullData
// } from 'entities/creature/model';

import s from './TypeForm.module.scss';

export const TypeForm: React.FC<TypeFormProps> = ({
  initialName = 'Monster',
  initialAlignment = 'any alignment',
  initialOtherType = 'swarm of Tiny beasts',
  language = 'en'
}) => {
 
  // const generatedCreature = useSelector((state: GeneratedCreatureStore) => 
  //   generatedCreatureSelectors.selectById(state, SINGLE_CREATURE_ID)
  // );

  const [state, setState] = useState<TypeFormState>({
    name: initialName,
    size: 'medium',
    type: 'humanoid',
    tag: '',
    alignment: initialAlignment,
    otherType: initialOtherType,
    showOtherType: false
  });

  // const [state, setState] = useState<TypeFormState>({
  //   name: generatedCreature?.name?.rus || 'Monster',
  //   size: (['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'].includes(generatedCreature?.size?.eng) 
  //          ? generatedCreature.size.eng 
  //          : 'medium') as CreatureSize,
  //   type: generatedCreature?.type?.name || 'humanoid',
  //   tag: generatedCreature?.tags?.[0]?.name || '',
  //   alignment: generatedCreature?.alignment || 'any alignment',
  //   otherType: '*', // или другое значение по умолчанию
  //   showOtherType: generatedCreature?.type?.name === '*'
  // });

  const t = TypeFormLocalization[language];

  // const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const selectedType = e.target.value;
  //   setState(prev => ({
  //     ...prev,
  //     type: selectedType,
  //     showOtherType: selectedType === '*'
  //   }));
  // };

  const dispatch = useDispatch();

  // useEffect(() => {
  //   if (generatedCreature) {
  //     setState(prev => ({
  //       ...prev,
  //       name: generatedCreature.name?.eng || prev.name,
  //       size: (['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'].includes(generatedCreature?.size?.eng) 
  //          ? generatedCreature.size.eng 
  //          : 'medium') as CreatureSize,
  //       type: generatedCreature.type?.name || prev.type,
  //       tag: generatedCreature.tags?.[0]?.name || prev.tag,
  //       alignment: generatedCreature.alignment || prev.alignment,
  //       showOtherType: generatedCreature.type?.name === '*'
  //     }));
  //   }
  // }, [generatedCreature]);

  const handleChange = (field: keyof TypeFormState) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const newValue = e.target.value;
      setState(prev => ({ ...prev, [field]: newValue }));

      switch(field) {
        case 'name':
          dispatch(generatedCreatureActions.updateCreatureName({
            id: SINGLE_CREATURE_ID, 
            name: {
              rus: newValue,
              eng: newValue,
            }
          }));
          break;
        case 'size':
          dispatch(generatedCreatureActions.updateCreatureSize({
            id: SINGLE_CREATURE_ID, 
            size: {
              rus: newValue,
              eng: newValue,
              cell: '1'
            }
          }));
          break;
        case 'type':
          dispatch(generatedCreatureActions.updateCreatureType({
            id: SINGLE_CREATURE_ID, 
            type: {
              name: newValue,
              tags: []
            }
          }));
          if (newValue === '*') {
            setState(prev => ({ ...prev, showOtherType: true }));
          } else {
            setState(prev => ({ ...prev, showOtherType: false }));
          }
          break;
        case 'tag':
          dispatch(generatedCreatureActions.updateTags({
            id: SINGLE_CREATURE_ID, 
            tags: [{
              name: newValue,
              description: `Description for ${newValue}`
            }]
          }));
          break;
        case 'alignment':
          dispatch(generatedCreatureActions.updateAlignment({
            id: SINGLE_CREATURE_ID,
            alignment: newValue
          }));
          break;
        // case 'otherType':
        //   dispatch(generatedCreatureActions.setOtherType(newValue));
        //   break;
        }
    };

  return (
    <CollapsiblePanel title={t.title}>
      <div className={s.creaturePanel__statsContainer}>
        <FormElement label={t.name}>
          <input
            type="text"
            value={state.name}
            onChange={handleChange('name')}
            className={s.creaturePanel__statsElement__input}
          />
        </FormElement>

        <FormElement label={t.size}>
          <select
            value={state.size}
            onChange={handleChange('size')}
            className={s.creaturePanel__statsElement__select}
          >
            {Object.entries(t.sizes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </FormElement>

        <FormElement label={t.type}>
          <>
            <select
              value={state.type}
              onChange={handleChange('type')}
              className={s.creaturePanel__statsElement__select}
            >
              {Object.entries(t.types).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
              <option value="*">{t.types.other}</option>
            </select>
            {state.showOtherType && (
              <input
                type="text"
                value={state.otherType}
                onChange={handleChange('otherType')}
                className={s.creaturePanel__statsElement__input}
                placeholder={t.otherTypePlaceholder}
              />
            )}
          </>
        </FormElement>

        <FormElement label={t.tag}>
          <input
            type="text"
            value={state.tag}
            onChange={handleChange('tag')}
            className={s.creaturePanel__statsElement__input}
          />
        </FormElement>

        <FormElement label={t.alignment}>
          <input
            type="text"
            value={state.alignment}
            onChange={handleChange('alignment')}
            className={s.creaturePanel__statsElement__input}
          />
        </FormElement>
      </div>
    </CollapsiblePanel>
    
  );
};