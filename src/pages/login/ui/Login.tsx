import { VKLogin } from 'pages/login/ui/vkLogin';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import s from './Login.module.scss';

export const Login = () => {
  const [isAuthenticated, _setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Логика проверки авторизации
    };

    checkAuth();
  }, []);

  if (isAuthenticated) {
    // Логика для авторизованного пользователя
  }

  return (
    <div className={s.pageContent}>
      <div className={s.authForm}>
        <div className={s.authForm__logoContainer}>
          <Link to='/'>
            <img className={s.logo} src='/src/shared/assets/images/logo.png' alt='Logo Image' />
          </Link>
          <div className={s.authForm__title}>Войти в Encounterium</div>
        </div>
        <div className={s.error}></div>
        <VKLogin />
      </div>
    </div>
  );
};
