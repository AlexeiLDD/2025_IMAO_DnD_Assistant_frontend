import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useParams } from 'react-router';

import { CreatureClippedData } from 'entities/creature/model/types';
import {
  GetCreaturesRequest,
  useGetCreaturesQuery,
  useGetUserCreaturesQuery,
} from 'pages/bestiary/api';
import {
  mapFiltersToRequestBody,
  TypeProvider,
  useTypeContext,
  useViewSettings,
  ViewSettingsProvider,
} from 'pages/bestiary/lib';
import { Filters, OrderParams } from 'pages/bestiary/model';
import { throttle, useDebounce } from 'shared/lib';
import { ModalOverlay, Spinner } from 'shared/ui';
import { BestiaryCard } from './bestiaryCard';
import { FilterModalWindow } from './filterModalWindow';
import { TopPanel } from './topPanel';

import s from './Bestiary.module.scss';

const RESPONSE_SIZE = 24;
const DEBOUNCE_TIME = 500;
const THROTTLE_TIME = 1000;

type BestiaryProps = {
  type: 'user' | 'moder';
};

export const Bestiary = ({ type }: BestiaryProps) => {
  return (
    <div className={s.pageContent}>
      <TypeProvider type={type}>
        <ViewSettingsProvider>
          <BestiaryContent />
        </ViewSettingsProvider>
        <Outlet />
      </TypeProvider>
    </div>
  );
};

const BestiaryContent = () => {
  const { creatureName } = useParams();
  const type = useTypeContext();
  const title = type === 'moder' ? 'Бестиарий' : 'Мой Бестиарий';
  const useGetCreatures = type === 'moder' ? useGetCreaturesQuery : useGetUserCreaturesQuery;

  const [start, setStart] = useState(0);
  const [allCreatures, setAllCreatures] = useState<CreatureClippedData[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const hasOutlet = creatureName !== undefined;

  const [selectedCreatureName, setSelectedCreatureName] = useState<string | undefined>('');
  const [prevCreatureName, setPrevCreatureName] = useState<string | undefined>('');

  useEffect(() => {
    setPrevCreatureName(selectedCreatureName);
    setSelectedCreatureName(creatureName);
  }, [creatureName]);

  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTimeout(
      () => cardRef?.current?.scrollIntoView({ behavior: 'instant', block: 'start' }),
      150,
    );
  }, [hasOutlet]);

  const debouncedSearchValue = useDebounce(searchValue, DEBOUNCE_TIME);
  const setStartThrottled = throttle(setStart, THROTTLE_TIME);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleToggleCollapse = useCallback((category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const { viewMode, alphabetSort, ratingSort } = useViewSettings();

  const isAnyFilterSet = Object.values(filters).some((arr) => Array.isArray(arr) && arr.length > 0);

  const orderParams: OrderParams[] = [
    {
      field: 'experience',
      direction: ratingSort,
    },
    {
      field: 'name',
      direction: alphabetSort,
    },
  ];

  const [requestBody, setRequestBody] = useState<GetCreaturesRequest>(
    mapFiltersToRequestBody(filters, 0, RESPONSE_SIZE, debouncedSearchValue, orderParams),
  );

  const { data: creatures, isLoading, isError, status } = useGetCreatures(requestBody);

  const isPending = status === 'pending';

  useEffect(() => {
    if (creatures) {
      if (start === 0) {
        setAllCreatures(creatures);
      } else {
        setAllCreatures((prev) => [...prev, ...creatures]);
      }
    } else {
      if (start === 0) {
        setAllCreatures([]);
      } else {
        setHasMore(false);
      }
    }
  }, [creatures]);

  useEffect(() => {
    setStart(0);
    setHasMore(true);
    setRequestBody(
      mapFiltersToRequestBody(filters, 0, RESPONSE_SIZE, debouncedSearchValue, orderParams),
    );
  }, [debouncedSearchValue, filters]);

  useEffect(() => {
    setRequestBody(
      mapFiltersToRequestBody(filters, start, RESPONSE_SIZE, debouncedSearchValue, orderParams),
    );
  }, [start]);

  useEffect(() => {
    setStart(0);
    setHasMore(true);
    setRequestBody(
      mapFiltersToRequestBody(filters, start, RESPONSE_SIZE, debouncedSearchValue, orderParams),
    );
  }, [alphabetSort, ratingSort]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        !isLoading &&
        hasMore
      ) {
        setStartThrottled((prev: any) => prev + RESPONSE_SIZE);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore]);

  return (
    <div
      className={clsx(s.bestiaryContainer, {
        [s.bestiaryContainer__outlet]: hasOutlet,
      })}
    >
      <TopPanel
        title={title}
        isAnyFilterSet={isAnyFilterSet}
        setFilters={setFilters}
        setSearchValue={setSearchValue}
        setIsModalOpen={setIsModalOpen}
      />

      <ModalOverlay title='Фильтры' isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}>
        <FilterModalWindow
          onFilterChange={handleFilterChange}
          selectedFilters={filters}
          collapsedCategories={collapsedCategories}
          onToggleCollapse={handleToggleCollapse}
        />
      </ModalOverlay>

      {!isLoading && (
        <div className={s.bestiaryContent}>
          {allCreatures.map((creature, ind) => {
            const lastPart = creature.url.split('/').pop();
            const isSelected =
              lastPart === selectedCreatureName ||
              (selectedCreatureName === undefined && lastPart === prevCreatureName);

            if (isSelected)
              return (
                <div key={ind} ref={cardRef} className={s.selectedCard}>
                  <BestiaryCard creature={creature} viewMode={viewMode} isSelected={true} />
                </div>
              );
            else
              return (
                <div key={ind}>
                  <BestiaryCard creature={creature} viewMode={viewMode} isSelected={false} />
                </div>
              );
          })}
        </div>
      )}

      {(isPending || isLoading) && (
        <div className={s.spinnerContainer}>
          <Spinner size={100} />
        </div>
      )}

      {allCreatures.length === 0 && !isLoading && (
        <div className={s.spinnerContainer}>Ничего не найдено</div>
      )}

      {isError && <div className={s.spinnerContainer}>Упс, что-то пошло не так :(</div>}
    </div>
  );
};
