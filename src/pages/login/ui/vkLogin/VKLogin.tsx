import { useEffect, useRef } from 'react';
import * as VKID from '@vkid/sdk'; // ✅ Импорт всего как namespace

export const VKLogin = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    VKID.Config.init({
      app: 53436063,
      redirectUrl: 'https://encounterium.ru',
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: '', // Добавь нужные scope, если надо
    });

    const oneTap = new VKID.OneTap();

    oneTap
      .render({
        container: containerRef.current!,
        showAlternativeLogin: true,
      })
      .on(VKID.WidgetEvents.ERROR, vkidOnError)
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload: any) => {
        const { code, device_id } = payload;

        VKID.Auth.exchangeCode(code, device_id)
          .then(vkidOnSuccess)
          .catch(vkidOnError);
      });

    function vkidOnSuccess(data: any) {
      console.log('VK Login Success:', data);
      // Здесь можно токен сохранить, пользователя авторизовать и т.п.
    }

    function vkidOnError(error: any) {
      console.error('VK Login Error:', error);
    }
  }, []);

  return <div ref={containerRef} />;
};
