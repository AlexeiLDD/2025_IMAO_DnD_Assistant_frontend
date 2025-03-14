import { Creature } from '../model';

export const mockCreatures: Creature[] = [
  {
    id: 'creature-1',
    name: 'Гоблин-вожак',
    hp: {
      current: 28,
      max: 45,
      temporary: 0,
    },
    ac: 15,
    initiative: 12,
    conditions: ['испуган'],
    stats: {
      strength: 12,
      dexterity: 16,
      constitution: 10,
      intelligence: 8,
      wisdom: 10,
      charisma: 10,
    },
    image: 'https://example.com/goblin.png',
    notes: 'Использует тактику засад',
  },
  {
    id: 'creature-2',
    name: 'Огр-берсерк',
    hp: {
      current: 85,
      max: 85,
      temporary: 10,
    },
    ac: 11,
    initiative: 5,
    conditions: ['разъярен'],
    stats: {
      strength: 19,
      dexterity: 8,
      constitution: 16,
      intelligence: 5,
      wisdom: 7,
      charisma: 7,
    },
    notes: 'Атакует ближайшую цель',
  },
  {
    id: 'creature-3',
    name: 'Архимаг Телвин',
    hp: {
      current: 64,
      max: 72,
      temporary: 0,
    },
    ac: 16,
    initiative: 18,
    conditions: ['невидимый'],
    stats: {
      strength: 9,
      dexterity: 14,
      constitution: 12,
      intelligence: 20,
      wisdom: 16,
      charisma: 15,
    },
    notes: 'Концентрация на стену огня',
  },
  {
    id: 'creature-4',
    name: 'Молодой красный дракон',
    hp: {
      current: 178,
      max: 178,
      temporary: 0,
    },
    ac: 18,
    initiative: 14,
    conditions: [],
    stats: {
      strength: 23,
      dexterity: 10,
      constitution: 21,
      intelligence: 14,
      wisdom: 11,
      charisma: 19,
    },
    notes: 'Использует дыхание огнем',
  },
  {
    id: 'creature-5',
    name: 'Скелет-лучник',
    hp: {
      current: 12,
      max: 22,
      temporary: 0,
    },
    ac: 13,
    initiative: 8,
    conditions: ['нежить'],
    stats: {
      strength: 10,
      dexterity: 14,
      constitution: 15,
      intelligence: 6,
      wisdom: 8,
      charisma: 5,
    },
    notes: 'Уязвим к дробящему урону',
  },
  {
    id: 'creature-6',
    name: 'Элементаль земли',
    hp: {
      current: 126,
      max: 126,
      temporary: 0,
    },
    ac: 17,
    initiative: 10,
    conditions: ['иммунитет к яду'],
    stats: {
      strength: 20,
      dexterity: 8,
      constitution: 20,
      intelligence: 5,
      wisdom: 10,
      charisma: 5,
    },
    notes: 'Сопротивление к магии',
  },
  {
    id: 'creature-7',
    name: 'Харизматичный бард',
    hp: {
      current: 38,
      max: 38,
      temporary: 5,
    },
    ac: 14,
    initiative: 16,
    conditions: ['вдохновение'],
    stats: {
      strength: 10,
      dexterity: 16,
      constitution: 12,
      intelligence: 13,
      wisdom: 12,
      charisma: 18,
    },
    notes: 'Использует заклинания очарования',
  },
  {
    id: 'creature-8',
    name: 'Темный паладин',
    hp: {
      current: 92,
      max: 92,
      temporary: 0,
    },
    ac: 20,
    initiative: 9,
    conditions: ['аура страха'],
    stats: {
      strength: 18,
      dexterity: 11,
      constitution: 16,
      intelligence: 12,
      wisdom: 14,
      charisma: 17,
    },
    notes: 'Использует божественную магию',
  },
  {
    id: 'creature-9',
    name: 'Лесная нимфа',
    hp: {
      current: 55,
      max: 55,
      temporary: 0,
    },
    ac: 13,
    initiative: 20,
    conditions: ['связана с лесом'],
    stats: {
      strength: 12,
      dexterity: 18,
      constitution: 14,
      intelligence: 15,
      wisdom: 16,
      charisma: 19,
    },
    notes: 'Может телепортироваться между деревьями',
  },
  {
    id: 'creature-10',
    name: 'Инфернальный демон',
    hp: {
      current: 144,
      max: 144,
      temporary: 20,
    },
    ac: 19,
    initiative: 15,
    conditions: ['иммунитет к огню', 'страх'],
    stats: {
      strength: 22,
      dexterity: 16,
      constitution: 20,
      intelligence: 18,
      wisdom: 16,
      charisma: 24,
    },
    notes: 'Создает магическую защиту каждые 3 раунда',
  },
];
