import { Link } from 'react-router';
import s from './Hero.module.scss';

import dndLogo from 'shared/assets/images/DnD_logo.png';
import logo from 'shared/assets/images/logo.png';

export const Hero = () => {
  return (
    <section className={s.hero}>
      <div>
        <img className={s.logo} src={logo} alt='Encounterium'></img>
      </div>
      <ul className={s.styledList}>
        <li>Автоматизируйте свои игры</li>
        <li>Управляйте бестиарием</li>
        <li>Создавайте сражения</li>
        <li>Погружайтесь в мир</li>
      </ul>
      <div>
        <img className={s.dndLogo} src={dndLogo} alt='DnD_logo'></img>
      </div>
      <Link to='bestiary'>
      <button className={s.heroButton} data-variant='primary'>
        Вперёд к сражениям!
      </button>
      </Link>
    </section>
  );
};
