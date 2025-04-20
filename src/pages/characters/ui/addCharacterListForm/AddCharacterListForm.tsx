import { Icon28AddSquareOutline } from '@vkontakte/icons';
import { useState } from 'react';

import { GetCharactersRequest, useAddCharacterMutation } from 'pages/characters/api';

import clsx from 'clsx';
import LssLogo from 'shared/assets/images/long_story_short_logo.tsx';
import s from './AddCharacterListForm.module.scss';

type AddCharacterListFormProps = {
  reloadTrigger: (arg: GetCharactersRequest, preferCacheValue?: boolean) => unknown;
  requestBody: GetCharactersRequest;
};

export const AddCharacterListForm = ({ reloadTrigger, requestBody }: AddCharacterListFormProps) => {
  const [file, setFile] = useState<File>();
  const [jsonData, setJsonData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [uploadFile, { isLoading }] = useAddCharacterMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    setFile(file);
    setFileName(file.name);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedJson = JSON.parse(event.target?.result as string);
        setJsonData(parsedJson);
      } catch (err) {
        setError('Неверный формат JSON файла');
        setJsonData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setError('Пожалуйста, загрузите JSON файл');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('characterFile', file);

      await uploadFile(formData).unwrap();

      setSuccess('Файл успешно отправлен!');

      reloadTrigger(requestBody, false);
    } catch (err) {
      setError(`Ошибка при отправке: ${(err as Error).message}`);
    }
  };

  return (
    <div className={s.formContainer}>
      <form
        className={clsx(s.addCharacterForm, { [s.marginTop5Rem]: jsonData })}
        onSubmit={handleSubmit}
      >
        <div className={s.lssContainer}>
          <a href='https://longstoryshort.app/characters/list/' target='_blank'>
            <LssLogo />
          </a>
          <div>
            Мы поддерживаем интеграцию с листами персонажей{' '}
            <a href='https://longstoryshort.app/characters/list/' target='_blank'>
              Long Story Short
            </a>
          </div>
        </div>
        <div className={s.inputContainer}>
          <label className={s.inputLabel} htmlFor='json-upload'>
            <input
              className={s.inputList}
              id='json-upload'
              type='file'
              accept='.json'
              onChange={handleFileChange}
            />
            <span className={s.buttonAdd} data-role='btn' data-variant='accent'>
              <Icon28AddSquareOutline />
              <div>
                Выберите лист персонажа
                <br />в формате JSON
              </div>
            </span>
          </label>

          {fileName && <p className={s.fileNamePreview}>Выбран файл: {fileName}</p>}
        </div>

        {error && <div className={s.errorLabel}>{error}</div>}
        {success && <div className={s.successLabel}>{success}</div>}

        <button type='submit' disabled={!jsonData || isLoading} data-variant='primary'>
          {isLoading ? 'Отправка...' : 'Добавить персонажа'}
        </button>
      </form>

      {jsonData && (
        <div className={s.previewContainer}>
          <h3>Предпросмотр данных:</h3>
          <pre className={s.preview}>{JSON.stringify(jsonData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
