import * as VKID from '@vkid/sdk';
import { CodeExchangeRequest, useLazyExchangeCodeQuery } from 'pages/login/api';
import { generateCodeChallenge, generateCodeVerifier } from 'pages/login/lib';
import { useEffect, useRef } from 'react';

export const VKLogin = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const codeVerifierRef = useRef('');

  const [exchangeCode, { data }] = useLazyExchangeCodeQuery();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      const codeVerifier = generateCodeVerifier();
      codeVerifierRef.current = codeVerifier;

      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = crypto.randomUUID();

      VKID.Config.init({
        app: 53436063,
        redirectUrl: 'http://localhost',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: 'vkid.profile',
        state: state,
        codeChallenge: codeChallenge,
      });

      const oneTap = new VKID.OneTap();

      oneTap
        .render({
          container: containerRef.current!,
          showAlternativeLogin: true,
          scheme: VKID.Scheme.DARK,
        })
        .on(VKID.WidgetEvents.ERROR, vkidOnError)
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload: any) => {
          const { code, device_id } = payload;

          const requestBody: CodeExchangeRequest = {
            code: code,
            deviceID: device_id,
            state: state,
            codeVerifier: codeVerifierRef.current,
          };

          exchangeCode(requestBody);
        });
    };

    init();

    function vkidOnError(error: any) {
      console.error('VK Login Error:', error);
    }
  }, []);

  return <div ref={containerRef} />;
};
