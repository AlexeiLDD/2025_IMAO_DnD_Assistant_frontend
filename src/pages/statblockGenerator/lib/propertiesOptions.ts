import { Language } from 'shared/lib';
import { MonsterStats, SelectOption } from 'pages/statblockGenerator/model';

export const getSavingThrowOptions = (language: Language): SelectOption[] => [
  { value: 'str', label: language === 'ru' ? 'Сила' : 'Strength' },
  { value: 'dex', label: language === 'ru' ? 'Ловкость' : 'Dexterity' },
  { value: 'con', label: language === 'ru' ? 'Телосложение' : 'Constitution' },
  { value: 'int', label: language === 'ru' ? 'Интеллект' : 'Intelligence' },
  { value: 'wis', label: language === 'ru' ? 'Мудрость' : 'Wisdom' },
  { value: 'cha', label: language === 'ru' ? 'Харизма' : 'Charisma' }
];

export const getSkillOptions = (language: Language): SelectOption[] => [
  { value: 'acrobatics', label: language === 'ru' ? 'Акробатика' : 'Acrobatics' },
  { value: 'animal handling', label: language === 'ru' ? 'Уход за животными' : 'Animal Handling' },
  { value: 'arcana', label: language === 'ru' ? 'Магия' : 'Arcana' },
  { value: 'athletics', label: language === 'ru' ? 'Атлетика' : 'Athletics' },
  { value: 'deception', label: language === 'ru' ? 'Обман' : 'Deception' },
  { value: 'history', label: language === 'ru' ? 'История' : 'History' },
  { value: 'insight', label: language === 'ru' ? 'Проницательность' : 'Insight' },
  { value: 'intimidation', label: language === 'ru' ? 'Запугивание' : 'Intimidation' },
  { value: 'investigation', label: language === 'ru' ? 'Анализ' : 'Investigation' },
  { value: 'medicine', label: language === 'ru' ? 'Медицина' : 'Medicine' },
  { value: 'nature', label: language === 'ru' ? 'Природа' : 'Nature' },
  { value: 'perception', label: language === 'ru' ? 'Внимательность' : 'Perception' },
  { value: 'performance', label: language === 'ru' ? 'Выступление' : 'Performance' },
  { value: 'persuasion', label: language === 'ru' ? 'Убеждение' : 'Persuasion' },
  { value: 'religion', label: language === 'ru' ? 'Религия' : 'Religion' },
  { value: 'sleight of hand', label: language === 'ru' ? 'Ловкость рук' : 'Sleight of Hand' },
  { value: 'stealth', label: language === 'ru' ? 'Скрытность' : 'Stealth' },
  { value: 'survival', label: language === 'ru' ? 'Выживание' : 'Survival' }
];

export const getConditionOptions = (language: Language): SelectOption[] => [
  { value: 'blinded', label: language === 'ru' ? 'Ослепление' : 'Blinded' },
  { value: 'charmed', label: language === 'ru' ? 'Очарование' : 'Charmed' },
  { value: 'deafened', label: language === 'ru' ? 'Глухота' : 'Deafened' },
  { value: 'exhaustion', label: language === 'ru' ? 'Истощение' : 'Exhaustion' },
  { value: 'frightened', label: language === 'ru' ? 'Испуг' : 'Frightened' },
  { value: 'grappled', label: language === 'ru' ? 'Захват' : 'Grappled' },
  { value: 'incapacitated', label: language === 'ru' ? 'Недееспособность' : 'Incapacitated' },
  { value: 'invisible', label: language === 'ru' ? 'Невидимость' : 'Invisible' },
  { value: 'paralyzed', label: language === 'ru' ? 'Паралич' : 'Paralyzed' },
  { value: 'petrified', label: language === 'ru' ? 'Окаменение' : 'Petrified' },
  { value: 'poisoned', label: language === 'ru' ? 'Отравление' : 'Poisoned' },
  { value: 'prone', label: language === 'ru' ? 'Распластание' : 'Prone' },
  { value: 'restrained', label: language === 'ru' ? 'Сковывание' : 'Restrained' },
  { value: 'stunned', label: language === 'ru' ? 'Оглушение' : 'Stunned' },
  { value: 'unconscious', label: language === 'ru' ? 'Бессознательное состояние' : 'Unconscious' }
];

export const getProficiencyLabel = (type: 'proficient' | 'expert', language: Language): string => {
  const labels = {
    proficient: language === 'ru' ? 'Владение' : 'Proficient',
    expert: language === 'ru' ? 'Эксперт' : 'Expert'
  };
  return labels[type];
};

export const getExpertSuffix = (language: Language): string => {
  return language === 'ru' ? ' (эксперт)' : ' (ex)';
};

export const savingThrowShortNames: Record<string, string> = {
  'Сила': 'Сил',
  'Ловкость': 'Лов',
  'Телосложение': 'Тел',
  'Интеллект': 'Инт',
  'Мудрость': 'Мдр',
  'Харизма': 'Хар',
};

export const skillToAbilityMap: Record<string, keyof MonsterStats> = {
  'acrobatics': 'dex',
  'animal handling': 'wis',
  'arcana': 'int',
  'athletics': 'str',
  'deception': 'cha',
  'history': 'int',
  'insight': 'wis',
  'intimidation': 'cha',
  'investigation': 'int',
  'medicine': 'wis',
  'nature': 'int',
  'perception': 'wis',
  'performance': 'cha',
  'persuasion': 'cha',
  'religion': 'int',
  'sleight of hand': 'dex',
  'stealth': 'dex',
  'survival': 'wis'
};
