import { Language } from 'shared/lib';
import { SelectOption } from 'pages/statblockGenerator/model';

export const getDamageTypeOptions = (language: Language): SelectOption[] => [
  { value: 'acid', label: language === 'ru' ? 'Кислота' : 'Acid' },
  { value: 'bludgeoning', label: language === 'ru' ? 'Дробящий' : 'Bludgeoning' },
  { value: 'cold', label: language === 'ru' ? 'Холод' : 'Cold' },
  { value: 'fire', label: language === 'ru' ? 'Огонь' : 'Fire' },
  { value: 'force', label: language === 'ru' ? 'Силовое' : 'Force' },
  { value: 'lightning', label: language === 'ru' ? 'Молния' : 'Lightning' },
  { value: 'necrotic', label: language === 'ru' ? 'Некротический' : 'Necrotic' },
  { value: 'piercing', label: language === 'ru' ? 'Колющий' : 'Piercing' },
  { value: 'poison', label: language === 'ru' ? 'Яд' : 'Poison' },
  { value: 'psychic', label: language === 'ru' ? 'Психический' : 'Psychic' },
  { value: 'radiant', label: language === 'ru' ? 'Излучение' : 'Radiant' },
  { value: 'slashing', label: language === 'ru' ? 'Режущий' : 'Slashing' },
  { value: 'thunder', label: language === 'ru' ? 'Гром' : 'Thunder' },
  { 
    value: 'bludgeoning, piercing, and slashing from nonmagical attacks', 
    label: language === 'ru' ? 'Немагические атаки' : 'Nonmagical Attacks' 
  },
  { 
    value: "bludgeoning, piercing, and slashing from nonmagical attacks that aren't silvered", 
    label: language === 'ru' ? 'Несеребряные атаки' : 'Non-Silvered Attacks' 
  },
  { 
    value: "bludgeoning, piercing, and slashing from nonmagical attacks that aren't adamantine", 
    label: language === 'ru' ? 'Неадамантиновые атаки' : 'Non-Adamantine Attacks' 
  },
  { value: '*', label: language === 'ru' ? 'Другое' : 'Other' }
];

export const getLanguageOptions = (language: Language): SelectOption[] => [
  { value: 'All', label: language === 'ru' ? 'Все' : 'All' },
  { value: 'Abyssal', label: 'Abyssal' },
  { value: 'Aquan', label: 'Aquan' },
  { value: 'Auran', label: 'Auran' },
  { value: 'Celestial', label: language === 'ru' ? 'Небесный' : 'Celestial' },
  { value: 'Common', label: language === 'ru' ? 'Общий' : 'Common' },
  { value: 'Deep Speech', label: language === 'ru' ? 'Глубокая речь' : 'Deep Speech' },
  { value: 'Draconic', label: language === 'ru' ? 'Драконий' : 'Draconic' },
  { value: 'Dwarvish', label: language === 'ru' ? 'Дварфийский' : 'Dwarvish' },
  { value: 'Elvish', label: language === 'ru' ? 'Эльфийский' : 'Elvish' },
  { value: 'Giant', label: language === 'ru' ? 'Великанский' : 'Giant' },
  { value: 'Gnomish', label: language === 'ru' ? 'Гномий' : 'Gnomish' },
  { value: 'Goblin', label: language === 'ru' ? 'Гоблинский' : 'Goblin' },
  { value: 'Halfling', label: language === 'ru' ? 'Полуросликов' : 'Halfling' },
  { value: 'Ignan', label: 'Ignan' },
  { value: 'Infernal', label: language === 'ru' ? 'Инфернальный' : 'Infernal' },
  { value: 'Orc', label: language === 'ru' ? 'Орочий' : 'Orc' },
  { value: 'Primordial', label: language === 'ru' ? 'Первобытный' : 'Primordial' },
  { value: 'Sylvan', label: language === 'ru' ? 'Лесной' : 'Sylvan' },
  { value: 'Terran', label: 'Terran' },
  { value: 'Undercommon', label: language === 'ru' ? 'Подземный' : 'Undercommon' },
  { value: '*', label: language === 'ru' ? 'Другой' : 'Other' }
];

export const getUnderstandsSuffix = (language: Language, understandsBut: string): string => {
  return language === 'ru' 
    ? ` (понимает, но ${understandsBut})` 
    : ` (understands but ${understandsBut})`;
};