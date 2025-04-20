import { Icon20DocumentPlusOutline } from '@vkontakte/icons';
import { useCallback, useEffect, useRef, useState } from 'react';

import s from './TopPanel.module.scss';

type TopPanelProps = {
  searchValue: string;
  setSearchValue: (value: string) => void;
  setIsModalOpen: (isOpen: boolean) => void;
};

export const TopPanel: React.FC<TopPanelProps> = ({
  searchValue,
  setSearchValue,
  setIsModalOpen,
}) => {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
    },
    [setSearchValue],
  );

  const [_isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={s.topPanel}>
      <div className={s.searchContainer}>
        <input
          type='text'
          placeholder='Поиск по названию...'
          value={searchValue}
          onChange={handleSearchChange}
          className={s.searchContainer__input}
        />
        <button
          onClick={() => setIsModalOpen(true)}
          data-variant='secondary'
          className={s.searchContainer__btn}
        >
          <Icon20DocumentPlusOutline width={19} height={19} />
          Добавить персонажа
        </button>
      </div>
    </div>
  );
};
