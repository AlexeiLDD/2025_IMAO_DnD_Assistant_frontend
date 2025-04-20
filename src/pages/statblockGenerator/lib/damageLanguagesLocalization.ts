import { Language } from 'shared/lib';

export const DamageLanguagesLocalization = {
  en: {
    title: 'Damage & Languages',
    damageTypes: 'Damage Types',
    vulnerabilities: 'Vulnerable',
    resistances: 'Resistant',
    immunities: 'Immune',
    customDamagePlaceholder: 'Enter damage type',
    languages: 'Languages',
    telepathy: 'Telepathy',
    speaks: 'Speaks',
    understands: 'Understands',
    understandsBut: 'but cannot speak',
    addLanguage: 'Add Language',
    remove: 'Remove',
    units: 'ft.',
    vulnerabilitiesTitle: 'Vulnerabilities',
    resistancesTitle: 'Resistances',
    immunitiesTitle: 'Immunities',
    knownLanguages: 'Known Languages'
  },
  ru: {
    title: 'Уязвимости и языки',
    damageTypes: 'Типы урона',
    vulnerabilities: 'Уязвим',
    resistances: 'Устойчив',
    immunities: 'Иммунен',
    customDamagePlaceholder: 'Введите тип урона',
    languages: 'Языки',
    telepathy: 'Телепатия',
    speaks: 'Говорит',
    understands: 'Понимает',
    understandsBut: 'не говорит',
    addLanguage: 'Добавить язык',
    remove: 'Удалить',
    units: 'фт.',
    vulnerabilitiesTitle: 'Уязвимости',
    resistancesTitle: 'Устойчивости',
    immunitiesTitle: 'Иммунитеты',
    knownLanguages: 'Известные языки'
  }
} as const satisfies Record<Language, {
  title: string;
  damageTypes: string;
  vulnerabilities: string;
  resistances: string;
  immunities: string;
  customDamagePlaceholder: string;
  languages: string;
  telepathy: string;
  speaks: string;
  understands: string;
  understandsBut: string;
  addLanguage: string;
  remove: string;
  units: string;
  vulnerabilitiesTitle: string;
  resistancesTitle: string;
  immunitiesTitle: string;
  knownLanguages: string;
}>;
