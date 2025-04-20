import { Language } from 'shared/lib';
import { SensesFormState } from '../model';

export const SensesLocalization = {
  en: {
    title: 'Special Senses',
    blindsight: 'Blindsight',
    darkvision: 'Darkvision',
    tremorsense: 'Tremorsense',
    truesight: 'Truesight',
    blindBeyond: 'Blind beyond this radius',
    units: 'ft.'
  },
  ru: {
    title: 'Особые чувства',
    blindsight: 'Слепое зрение',
    darkvision: 'Тёмное зрение',
    tremorsense: 'Чувство вибрации',
    truesight: 'Истинное зрение',
    blindBeyond: 'Слепой за пределами',
    units: 'фт.'
  }
} as const satisfies Record<Language, {
  title: string;
  blindsight: string;
  darkvision: string;
  tremorsense: string;
  truesight: string;
  blindBeyond: string;
  units: string;
}>;

export const getSenseNameMap = (language: Language) => {
  const loc = SensesLocalization[language];

  return {
    blindsight: loc.blindsight.toLowerCase(),
    darkvision: loc.darkvision.toLowerCase(),
    tremorsense: loc.tremorsense.toLowerCase(),
    truesight: loc.truesight.toLowerCase()
  };
};

export const getReverseSenseNameMap = (language: Language) => {
  const direct = getSenseNameMap(language);
  return Object.fromEntries(
    Object.entries(direct).map(([k, v]) => [v, k])
  ) as Record<string, keyof SensesFormState>;
};
