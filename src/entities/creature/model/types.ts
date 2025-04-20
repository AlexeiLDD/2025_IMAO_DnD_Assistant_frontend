import { EntityState, Reducer } from '@reduxjs/toolkit';

import { DiceType } from 'shared/lib';
import { Creature } from './creature.slice';

export type EntityType = 'creature' | 'character';

export type CreatureClippedData = {
  _id: string;
  name: NameTranslations;
  type: CreatureType;
  challengeRating: string;
  url: string;
  source: Source;
  images: string[];
};

export type CreatureFullData = {
  _id: string;
  name: NameTranslations;
  size: SizeTranslations;
  type: CreatureType;
  challengeRating: string;
  url: string;
  source: Source;
  id: number;
  experience?: number;
  proficiencyBonus: string;
  alignment: string;
  armorClass: number;
  armorText?: string;
  armors?: Armor[];
  hits: HitPoints;
  customHp?: string;
  speed: Speed[];
  ability: AbilityScores;
  savingThrows?: SavingThrow[];
  skills: Skill[];
  damageVulnerabilities?: string[];
  damageResistances?: string[];
  conditionImmunities?: string[];
  damageImmunities?: string[];
  senses: Senses;
  languages?: string[];
  feats?: Feat[];
  actions: Action[];
  bonusActions?: Action[];
  legendary?: Legendary;
  reactions: Reaction[];
  description: string;
  tags: Tag[];
  images: string[];
  environment?: string[];
  attacksLLM?: AttackLLM[];
  useCustomSpeed?: boolean;
  customSpeed?: string;
};

export type Reaction = {
  name: string;
  value: string;
};

export type SavingThrow = {
  name: string;
  shortName: string;
  value: number | string;
};

export type DamageDicesRolls = {
  total: number;
  dices: DamageDicesRoll[];
  bonus: number;
};

export type DamageDicesRoll = {
  final_damage: number;
  on_dice_damage: number;
  damage: Damage;
};

export type Feat = {
  name: string;
  value: number | string;
};

export type LegendaryAction = {
  name: string;
  value: number | string;
};

export type Legendary = {
  list: LegendaryAction[];
  count: number | string;
};

export type Armor = {
  name: string;
  type: string;
  url: string | null;
};

export type NameTranslations = {
  rus: string;
  eng: string;
};

export type SizeTranslations = {
  rus: string;
  eng: string;
  cell: string;
};

export type CreatureType = {
  name: string;
  tags: string[];
};

export type Source = {
  shortName: string;
  name: string;
  group: SourceGroup;
};

export type SourceGroup = {
  name: string;
  shortName: string;
};

export type HitPoints = {
  average: number;
  formula: string;
};

export type Speed = {
  value: number;
  name?: string;
  additional?: string;
};

export type AbilityScores = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

export type Skill = {
  name: string;
  value: number;
};

export type Senses = {
  passivePerception: string;
  senses?: Sense[];
};


type Sense = {
  name: string;
  value: number;
  additional?: string;
}

export type Action = {
  name: string;
  value: string;
};

export type Tag = {
  name: string;
  description: string;
};

export type DamageLLM = {
  dice: DiceType;
  count: number;
  type: string;
  bonus: number;
};

export type AdditionalEffectLLM = {
  damage?: DamageLLM;
  condition?: string;
  escapeDc?: number;
};

export type MultiAttackLLM = {
  type: string;
  count: number;
};

export type AreaAttackLLM = {
  shape?: string;
  recharge?: string;
  saveDc?: number;
  saveType?: string;
  onFail?: string;
  onSuccess?: string;
};

export type AttackLLM = {
  name: string;
  type?: string; // melee, ranged, area и т.д.
  attackBonus?: string;
  reach?: string; // для ближних атак
  range?: string; // для дальних атак
  target?: string;
  damage?: DamageLLM;
  attacks?: MultiAttackLLM[]; // для мультиатак
  additionalEffects?: AdditionalEffectLLM[];
  area?: AreaAttackLLM; // для зональных атак
  shape?: string; // альтернативный вариант для area (можно использовать Area.Shape)
  recharge?: string;
  saveDc?: number;
  saveType?: string;
  onFail?: string;
  onSuccess?: string;
};

export type Damage = {
  dice: DiceType;
  count: number;
  type: string;
};

export type CreaturesStore = ReturnType<Reducer<{ creatures: EntityState<Creature, string> }>>;
