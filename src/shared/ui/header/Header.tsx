import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import logo from 'shared/assets/images/logo.png';
import s from './Header.module.scss';

export const Header = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (location.pathname === '/encounter_tracker') {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [location]);

  return (
    <>
      <div className={s.headerTrigger}></div>
      <nav className={s.header} style={{ top: visible ? 0 : '-65px' }}>
        <div className={s.rightSection}>
          <Link to='/'>
            <img className={s.logo} src={logo} alt='logo' />
          </Link>
          <ul className={s.links}>
            <li>
              <Link to='/bestiary'>Бестиарий</Link>
            </li>
            <li>
              <Link to='/characters'>Персонажи</Link>
            </li>
            <li>
              <Link to='/statblock_generator'>Генератор существ</Link>
            </li>
            <li>
              <Link to='#'>Список партий</Link>
            </li>
            <li>
              <Link to='/encounter_tracker'>
                <button data-variant='accent'>Трекер</button>
              </Link>
            </li>
          </ul>
        </div>
        <div className={s.leftSection}>
          <button data-variant='secondary'>Зарегистрироваться</button>
          <Link to='/login'>
            <button data-variant='secondary'>Войти</button>
          </Link>
        </div>
      </nav>
    </>
  );
};
