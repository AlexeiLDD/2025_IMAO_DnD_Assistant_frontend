import { DamageLLM } from 'entities/creature/model';
import { DiceType } from 'shared/lib';
  
  export interface AttackFormAttack {
    name: string;
    type: 'melee' | 'ranged';
    attack_bonus: string;
    reach?: string;
    range?: string;
    target: string;
    damage: DamageLLM;
  }
  
  export const initialDamage: DamageLLM = {
    dice: DiceType.D6,
    count: 1,
    type: 'колющий',
    bonus: 0
  };
  
  export const initialAttack: AttackFormAttack = {
    name: '',
    type: 'melee', // или 'ranged', в зависимости от того, что вы хотите по умолчанию
    attack_bonus: '',
    reach: '5 фт.', // начальное значение для ближнего боя
    range: undefined, // или '30/120 фт.' если хотите дальний бой по умолчанию
    target: '',
    damage: initialDamage
  };