import { Icon20ChevronUp } from '@vkontakte/icons';
import clsx from 'clsx';
import { authActions, AuthState, AuthStore, UserData } from 'entities/auth/model';
import { encounterActions, EncounterState, EncounterStore } from 'entities/encounter/model';
import { useLazyLogoutQuery } from 'pages/login/api';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router';
import logo from 'shared/assets/images/logo.png';
import { useSessionURL } from 'shared/lib';
import s from './Header.module.scss';

export const Header = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const sessionUrl = useSessionURL(location.pathname);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [triggerLogout] = useLazyLogoutQuery();

  const { encounterId } = useSelector<EncounterStore>((state) => state.encounter) as EncounterState;
  const { isAuth, ...storeUserData } = useSelector<AuthStore>((state) => state.auth) as AuthState;
  let user: UserData | undefined;

  if (storeUserData) {
    user = {
      id: storeUserData.id,
      vkid: storeUserData.vkid,
      avatar: storeUserData.avatar,
      name: storeUserData.name,
    };
  }

  const logout = async () => {
    await triggerLogout(null).unwrap();
    dispatch(authActions.logout());
    dispatch(encounterActions.setEncounterId(null));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.pathname.includes('encounter_tracker')) {
      setVisible(false);
      return;
    }

    if (location.pathname === '/') {
      setDisabled(true);
      return;
    }

    setDisabled(false);
    setVisible(true);
  }, [location]);

  return (
    <>
      <div className={s.headerTrigger}></div>
      <nav
        className={clsx(s.header, { [s.header__disabled]: disabled })}
        style={{ top: visible ? 0 : '-65px' }}
      >
        <div className={s.leftSection}>
          <Link to='/'>
            <img className={s.leftSection__logo} src={logo} alt='logo' />
          </Link>
          <div className={s.leftSection__links}>
            <Link to='/bestiary'>
              <button data-variant='secondary'>Бестиарий</button>
            </Link>
            <Link to='/statblock_generator'>
              <button data-variant='secondary'>Генератор существ</button>
            </Link>
          </div>
        </div>
        <div className={s.rightSection}>
          <Link
            to={
              sessionUrl ??
              (encounterId ? `/encounter_tracker/${encounterId}` : '/encounter_tracker')
            }
          >
            <button data-variant='accent'>Трекер</button>
          </Link>
          {isAuth ? (
            <div
              className={s.authSection}
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              ref={dropdownRef}
            >
              <img className={s.authSection__avatar} src={user?.avatar}></img>
              <div className={s.authSection__name}>{user?.name}</div>
              <Icon20ChevronUp
                className={clsx(s.dropdownIcon, {
                  [s.dropdownIcon__rotated]: !isDropdownOpen,
                })}
              />
              {isDropdownOpen && (
                <div className={s.dropdownContainer}>
                  <Link to='/encounter_list'>
                    <div className={s.dropdownContainer__btn}>Список сражений</div>
                  </Link>
                  <Link to='/bestiary/user'>
                    <div className={s.dropdownContainer__btn}>Мой бестиарий</div>
                  </Link>
                  <Link to='/characters'>
                    <div className={s.dropdownContainer__btn}>Персонажи</div>
                  </Link>
                  <Link to='/map_editor'>
                    <div className={s.dropdownContainer__btn}>Редактор карт</div>
                  </Link>
                  <Link to='#'>
                    <div className={s.dropdownContainer__btn} onClick={() => void logout?.()}>
                      Выйти
                    </div>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Link to='/login'>
              <button data-variant='primary'>Войти</button>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
};
