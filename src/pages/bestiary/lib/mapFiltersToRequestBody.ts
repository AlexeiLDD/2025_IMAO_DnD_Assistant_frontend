import { GetCreaturesRequest } from 'pages/bestiary/api';
import { Filters, OrderParams } from 'pages/bestiary/model';

const filterMapping: { [key: string]: keyof GetCreaturesRequest['filter'] } = {
  'Иммунитет к урону': 'immunityDamage',
  'Иммунитет к состояниям': 'immunityCondition',
  'Сопротивление к урону': 'resistanceDamage',
  'Уязвимость к урону': 'vulnerabilityDamage',
  Чувства: 'senses',
  Перемещение: 'moving',
  'Размер существа': 'size',
  'Тип существа': 'type',
  'Класс опасности': 'challengeRating',
  'Места обитания': 'environment',
  Умения: 'features',
};

export const mapFiltersToRequestBody = (
  filters: Filters,
  start: number,
  size: number,
  searchValue: string,
  orderParams?: OrderParams[],
): GetCreaturesRequest => {
  const requestBody: GetCreaturesRequest = {
    start: start,
    size: size,
    search: {
      value: searchValue,
      exact: false,
    },
    order: orderParams || [],
    filter: {
      book: [], // фильтр по книгам
      npc: [], // фильтр по NPC
      challengeRating: [], // фильтр по уровню сложности
      type: [], // фильтр по типу существа
      size: [], // фильтр по размеру
      tag: [], // фильтр по тегам
      moving: [], // фильтр по способу перемещения
      senses: [], // фильтр по чувствам
      vulnerabilityDamage: [], // фильтр по уязвимостям к урону
      resistanceDamage: [], // фильтр по сопротивлению к урону
      immunityDamage: [], // фильтр по иммунитету к урону
      immunityCondition: [], // фильтр по иммунитету к состояниям
      features: [], // фильтр по особенностям
      environment: [], // фильтр по окружению
    },
  };

  Object.entries(filters).forEach(([key, values]) => {
    const mappedKey = filterMapping[key];
    if (mappedKey && requestBody.filter[mappedKey]) {
      requestBody.filter[mappedKey] = values;
    }
  });

  return requestBody;
};
