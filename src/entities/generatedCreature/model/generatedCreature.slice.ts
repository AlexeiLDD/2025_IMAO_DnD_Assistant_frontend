import {
    createEntityAdapter,
    createSlice,
    EntityState,
    PayloadAction,
    Reducer,
  } from '@reduxjs/toolkit';
 
  import type {
    CreatureFullData,
    Reaction,
    SavingThrow,
    //DamageDicesRolls,
    //DamageDicesRoll,
    Feat,
    //LegendaryAction,
    Legendary,
    Armor,
    NameTranslations,
    SizeTranslations,
    CreatureType,
    Source,
    //SourceGroup,
    HitPoints,
    Speed,
    AbilityScores,
    Skill,
    Senses,
    Action,
    Tag,
    //DamageLLM,
    //AdditionalEffectLLM,
    //MultiAttackLLM,
    //AreaAttackLLM,
    AttackLLM,
    //Damage
  } from 'entities/creature/model';

  export const SINGLE_CREATURE_ID = 'current';

  const initialCreature: CreatureFullData = {
    _id: SINGLE_CREATURE_ID,
    id: 0,
    name: {
      rus: 'Существо',
      eng: 'Creature',
    },
    size: {
      rus: 'Средний',
      eng: 'Medium',
      cell: '1',
    },
    type: {
      name: 'beast',
      tags: [],
    },
    challengeRating: '1',
    proficiencyBonus: '2',
    url: '',
    source: {
      shortName: 'HB',
      name: 'Homebrew',
      group: {
        name: 'Homebrew',
        shortName: 'HB',
      },
    },
    experience: 200,
    alignment: 'any alignment',
    armorClass: 10,
    armors: [],
    hits: {
      average: 9,
      formula: '2d8',
    },
    speed: [
      {
        value: 30,
      },
    ],
    ability: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    savingThrows: [],
    skills: [],
    damageVulnerabilities: [],
    damageResistances: [],
    conditionImmunities: [],
    damageImmunities: [],
    senses: {
      passivePerception: '10',
      senses: []
    },
    languages: ['Общий'],
    feats: [],
    actions: [],
    legendary: undefined,
    reactions: [],
    description: '',
    tags: [],
    images: [],
    environment: [],
    attacksLLM: [],
    useCustomSpeed: false,

  };
  
  
  const generatedCreatureAdapter = createEntityAdapter<CreatureFullData, string>({
    selectId: (creature) => creature._id,
  });
  
  const initialState = generatedCreatureAdapter.getInitialState({
    ids: [initialCreature._id],   // Массив ID
    entities: { [initialCreature._id]: initialCreature }, // Объект с сущностями
  });
  
  const generatedCreatureSlice = createSlice({
    name: 'generatedCreature',
    initialState,
    reducers: {
      creatureAdded: generatedCreatureAdapter.addOne,
      creatureUpdated: generatedCreatureAdapter.updateOne,
      creatureRemoved: generatedCreatureAdapter.removeOne,
      creaturesReceived: generatedCreatureAdapter.setAll,

      replaceCreature: (state, action: PayloadAction<CreatureFullData>) => {
        generatedCreatureAdapter.setOne(state, action.payload);
      },
      
      replaceAllCreatures: (state, action: PayloadAction<CreatureFullData[]>) => {
        generatedCreatureAdapter.setAll(state, action.payload);
      },
      
      
      // Специфичные редьюсеры для обновления отдельных полей
      updateCreatureName: (state, action: PayloadAction<{id: string; name: NameTranslations}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { name: action.payload.name }
        });
      },
      
      updateCreatureSize: (state, action: PayloadAction<{id: string; size: SizeTranslations}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { size: action.payload.size }
        });
      },
      
      updateCreatureType: (state, action: PayloadAction<{id: string; type: CreatureType}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { type: action.payload.type }
        });
      },
      
      updateChallengeRating: (state, action: PayloadAction<{id: string; challengeRating: string}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { challengeRating: action.payload.challengeRating }
        });
      },

      updateProficiencyBonus: (state, action: PayloadAction<{id: string; proficiencyBonus: string}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { proficiencyBonus: action.payload.proficiencyBonus }
        });
      },
      
      updateSource: (state, action: PayloadAction<{id: string; source: Source}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { source: action.payload.source }
        });
      },

      updateAlignment: (state, action: PayloadAction<{id: string; alignment: string}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { alignment: action.payload.alignment }
        });
      },
      
      updateArmorClass: (state, action: PayloadAction<{id: string; armorClass: number}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { armorClass: action.payload.armorClass }
        });
      },
      
      updateArmors: (state, action: PayloadAction<{id: string; armors: Armor[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { armors: action.payload.armors }
        });
      },

      updateArmorText: (state, action: PayloadAction<{id: string; armorText: string}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { armorText: action.payload.armorText }
        });
      },

      setArmors: (state, action) => {
        const creature = state.entities[action.payload.id];
        if (creature) creature.armors = action.payload.value;
      },

      setArmorClass: (state, action) => {
        const creature = state.entities[action.payload.id];
        if (creature) creature.armorClass = action.payload.value;
      },
      
      setArmorText: (state, action) => {
        const creature = state.entities[action.payload.id];
        if (creature) creature.armorText = action.payload.value;
      },
      
      updateHitPoints: (state, action: PayloadAction<{id: string; hits: HitPoints}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { hits: action.payload.hits }
        });
      },

      setHits: (state, action) => {
        const creature = state.entities[action.payload.id];
        if (creature) creature.hits = action.payload.hits;
      },
      
      setCustomHp: (state, action) => {
        const creature = state.entities[action.payload.id];
        if (creature) creature.customHp = action.payload.value;
      },

      updateSpeed: (state, action: PayloadAction<{id: string; speed: Speed[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { speed: action.payload.speed }
        });
      },

      setSpeed: (
        state,
        action: PayloadAction<{ id: string; value: CreatureFullData['speed'] }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (creature) {
          creature.speed = action.payload.value;
        }
      },
      
      setUseCustomSpeed: (
        state,
        action: PayloadAction<{ id: string; value: boolean }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (creature) {
          creature.useCustomSpeed = action.payload.value;
        }
      },
      
      setCustomSpeed: (
        state,
        action: PayloadAction<{ id: string; value: string }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (creature) {
          creature.customSpeed = action.payload.value;
        }
      },
      
      updateAbilityScores: (state, action: PayloadAction<{id: string; ability: AbilityScores}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { ability: action.payload.ability }
        });
      },

      updateAbilityScore: (
        state,
        action: PayloadAction<{ id: string; abilityKey: keyof AbilityScores; value: number }>
      ) => {
        const existing = state.entities[action.payload.id];
        if (existing) {
          generatedCreatureAdapter.updateOne(state, {
            id: action.payload.id,
            changes: {
              ability: {
                ...existing.ability,
                [action.payload.abilityKey]: action.payload.value,
              },
            },
          });
        }
      },
      
      updateSavingThrows: (state, action: PayloadAction<{id: string; savingThrows: SavingThrow[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { savingThrows: action.payload.savingThrows }
        });
      },

      addSavingThrow: (
        state,
        action: PayloadAction<{ id: string; savingThrow: SavingThrow }>
      ) => {
        const { id, savingThrow } = action.payload;
        const creature = state.entities[id];
        if (!creature) return;

        if (!creature.savingThrows) {
          creature.savingThrows = [];
        }
  
        const existing = creature.savingThrows.find(st => st.name === savingThrow.name);
        if (existing) {
          Object.assign(existing, savingThrow); // обновляем
        } else {
          creature.savingThrows.push(savingThrow); // добавляем
        }
      },
  
      removeSavingThrow: (
        state,
        action: PayloadAction<{ id: string; name: string }>
      ) => {
        const { id, name } = action.payload;
        const creature = state.entities[id];
        if (!creature) return;

        if (!creature.savingThrows) {
          creature.savingThrows = [];
        }
  
        creature.savingThrows = creature.savingThrows.filter(st => st.name !== name);
      },
      
      updateSkills: (state, action: PayloadAction<{id: string; skills: Skill[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { skills: action.payload.skills }
        });
      },

      addOrUpdateSkill: (
        state,
        action: PayloadAction<{ id: string; skill: { name: string; value: number } }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (!creature) return;
      
        if (!creature.skills) {
          creature.skills = [];
        }
      
        const existing = creature.skills.find(s => s.name === action.payload.skill.name);
        if (existing) {
          existing.value = action.payload.skill.value;
        } else {
          creature.skills.push(action.payload.skill);
        }
      },
      
      removeSkill: (
        state,
        action: PayloadAction<{ id: string; name: string }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (!creature?.skills) return;
      
        creature.skills = creature.skills.filter(s => s.name !== action.payload.name);
      },
      
      updateDamageVulnerabilities: (state, action: PayloadAction<{id: string; damageVulnerabilities: string[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { damageVulnerabilities: action.payload.damageVulnerabilities }
        });
      },

      setDamageVulnerabilities: (
        state,
        action: PayloadAction<{ id: string; values: string[] }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (creature) {
          creature.damageVulnerabilities = action.payload.values;
        }
      },
      
      updateDamageResistances: (state, action: PayloadAction<{id: string; damageResistances: string[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { damageResistances: action.payload.damageResistances }
        });
      },

      setDamageResistances: (
        state,
        action: PayloadAction<{ id: string; values: string[] }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (creature) {
          creature.damageResistances = action.payload.values;
        }
      },
      
      updateConditionImmunities: (state, action: PayloadAction<{id: string; conditionImmunities: string[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { conditionImmunities: action.payload.conditionImmunities }
        });
      },

      addConditionImmunity: (
        state,
        action: PayloadAction<{ id: string; value: string }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (!creature) return;
      
        if (!creature.conditionImmunities) {
          creature.conditionImmunities = [];
        }
      
        if (!creature.conditionImmunities.includes(action.payload.value)) {
          creature.conditionImmunities.push(action.payload.value);
        }
      },
      
      removeConditionImmunity: (
        state,
        action: PayloadAction<{ id: string; value: string }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (!creature?.conditionImmunities) return;
      
        creature.conditionImmunities = creature.conditionImmunities.filter(
          condition => condition !== action.payload.value
        );
      },
      
      updateDamageImmunities: (state, action: PayloadAction<{id: string; damageImmunities: string[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { damageImmunities: action.payload.damageImmunities }
        });
      },

      setDamageImmunities: (
        state,
        action: PayloadAction<{ id: string; values: string[] }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (creature) {
          creature.damageImmunities = action.payload.values;
        }
      },
      
      updateSenses: (state, action: PayloadAction<{id: string; senses: Senses}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { senses: action.payload.senses }
        });
      },

      setSenses: (
        state,
        action: PayloadAction<{ id: string; senses: { name: string; value: number; additional?: string }[] }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (creature) {
          creature.senses = {
            ...creature.senses,
            senses: action.payload.senses
          };
        }
      },
      
      updateLanguages: (state, action: PayloadAction<{id: string; languages: string[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { languages: action.payload.languages }
        });
      },

      setLanguages: (
        state,
        action: PayloadAction<{ id: string; values: string[] }>
      ) => {
        const creature = state.entities[action.payload.id];
        if (creature) {
          creature.languages = action.payload.values;
        }
      },
      
      updateFeats: (state, action: PayloadAction<{id: string; feats: Feat[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { feats: action.payload.feats }
        });
      },
      
      updateActions: (state, action: PayloadAction<{id: string; actions: Action[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { actions: action.payload.actions }
        });
      },
      
      updateLegendaryActions: (state, action: PayloadAction<{id: string; legendary: Legendary}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { legendary: action.payload.legendary }
        });
      },
      
      updateReactions: (state, action: PayloadAction<{id: string; reactions: Reaction[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { reactions: action.payload.reactions }
        });
      },
      
      updateDescription: (state, action: PayloadAction<{id: string; description: string}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { description: action.payload.description }
        });
      },
      
      updateTags: (state, action: PayloadAction<{id: string; tags: Tag[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { tags: action.payload.tags }
        });
      },
      
      updateImages: (state, action: PayloadAction<{id: string; images: string[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { images: action.payload.images }
        });
      },
      
      updateEnvironment: (state, action: PayloadAction<{id: string; environment: string[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { environment: action.payload.environment }
        });
      },
      
      updateAttacksLLM: (state, action: PayloadAction<{id: string; attacksLLM: AttackLLM[]}>) => {
        generatedCreatureAdapter.updateOne(state, {
          id: action.payload.id,
          changes: { attacksLLM: action.payload.attacksLLM }
        });
      },
    },
  });
  
  export const generatedCreatureActions = generatedCreatureSlice.actions;

  export type GeneratedCreatureStore = ReturnType<Reducer<{ generatedCreature: EntityState<CreatureFullData, string> }>>;

    export const generatedCreatureSelectors = generatedCreatureAdapter.getSelectors<GeneratedCreatureStore>(
    (state) => state.generatedCreature,
    );
  
  
  export default generatedCreatureSlice.reducer //as Reducer<GeneratedCreaturesState>;

