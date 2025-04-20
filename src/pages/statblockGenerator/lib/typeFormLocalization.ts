import { Language, capitalizeFirstLetter } from 'shared/lib';

export const TypeFormLocalization = {
  en: {
    title: 'Creature Type',
    name: 'Name',
    size: 'Size',
    type: 'Type',
    tag: 'Tag',
    alignment: 'Alignment',
    otherTypePlaceholder: 'Specify type',
    sizes: {
      tiny: 'Tiny',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      huge: 'Huge',
      gargantuan: 'Gargantuan'
    },
    types: {
      aberration: 'Aberration',
      beast: 'Beast',
      celestial: 'Celestial',
      construct: 'Construct',
      dragon: 'Dragon',
      elemental: 'Elemental',
      fey: 'Fey',
      fiend: 'Fiend',
      giant: 'Giant',
      humanoid: 'Humanoid',
      monstrosity: 'Monstrosity',
      ooze: 'Ooze',
      plant: 'Plant',
      undead: 'Undead',
      other: 'Other'
    }
  },
  ru: {
    title: 'Тип существа',
    name: 'Имя',
    size: 'Размер',
    type: 'Тип',
    tag: 'Тег',
    alignment: 'Мировоззрение',
    otherTypePlaceholder: 'Укажите тип',
    sizes: {
      tiny: 'Крошечный',
      small: 'Маленький',
      medium: 'Средний',
      large: 'Большой',
      huge: 'Огромный',
      gargantuan: 'Громадный'
    },
    types: {
      aberration: 'Аберрация',
      beast: 'Зверь',
      celestial: 'Небожитель',
      construct: 'Конструкт',
      dragon: 'Дракон',
      elemental: 'Элементаль',
      fey: 'Фейри',
      fiend: 'Исчадие',
      giant: 'Великан',
      humanoid: 'Гуманоид',
      monstrosity: 'Чудовище',
      ooze: 'Слизь',
      plant: 'Растение',
      undead: 'Нежить',
      other: 'Другое'
    }
  }
} as const satisfies Record<Language, {
  title: string;
  name: string;
  size: string;
  type: string;
  tag: string;
  alignment: string;
  otherTypePlaceholder: string;
  sizes: Record<string, string>;
  types: Record<string, string>;
}>;

export const mapCreatureType = (
  value: string,
  fromLang: Language,
  toLang: Language
): string | undefined => {
  const fromTypes = TypeFormLocalization[fromLang].types;
  const toTypes = TypeFormLocalization[toLang].types;

  const entry = Object.entries(fromTypes).find(
    ([, localizedValue]) => localizedValue === value
  );

  if (!entry) return undefined;

  const [typeKey] = entry;

  return toTypes[typeKey as keyof typeof toTypes];
};

export const getKeyByLocalizedValue = (
  localizedValue: string,
  section: 'types' | 'sizes'
): string | undefined => {
  const normalizedValue = capitalizeFirstLetter(localizedValue.trim());

  for (const lang of Object.keys(TypeFormLocalization) as Language[]) {
    const entries = TypeFormLocalization[lang][section];
    const entry = Object.entries(entries).find(([, val]) => val === normalizedValue);
    if (entry) {
      return entry[0];
    }
  }
  return undefined;
};

export const mapCreatureSize = (
  value: string,
  fromLang: Language,
  toLang: Language
): string | undefined => {
  const fromSizes = TypeFormLocalization[fromLang].sizes;
  const toSizes = TypeFormLocalization[toLang].sizes;

  const entry = Object.entries(fromSizes).find(
    ([, localizedValue]) => localizedValue === value
  );

  if (!entry) return undefined;

  const [sizeKey] = entry;

  return toSizes[sizeKey as keyof typeof toSizes];
};

export const getCellSizeDescription = (size: string): string | undefined => {
  const sizeKeyMap: Record<string, keyof typeof sizeDescriptions> = {
    tiny: 'tiny',
    small: 'small',
    medium: 'medium',
    large: 'large',
    huge: 'huge',
    gargantuan: 'gargantuan',

    'Крошечный': 'tiny',
    'Маленький': 'small',
    'Средний': 'medium',
    'Большой': 'large',
    'Огромный': 'huge',
    'Громадный': 'gargantuan'
  };

  const sizeDescriptions: Record<
    'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan',
    string
  > = {
    tiny: '1/4 клетки',
    small: '1 клетка',
    medium: '1 клетка',
    large: '2x2 клетки',
    huge: '3x3 клетки',
    gargantuan: '4x4 клетки или больше'
  };

  const key = sizeKeyMap[size.toLowerCase() as keyof typeof sizeKeyMap] ||
              sizeKeyMap[size as keyof typeof sizeKeyMap];

  return key ? sizeDescriptions[key] : undefined;
};




