import React from 'react';
import s from './CreatureSaveSection.module.scss';

interface CreatureSaveSectionProps {
  onSave?: () => void;
  onUsePreset?: () => void;
  onImageUpload?: (file: File) => void;
  onTextChange?: (text: string) => void;
  presetOptions?: string[];
  selectedPreset?: string;
  language?: 'en' | 'ru';
}

export const CreatureSaveSection: React.FC<CreatureSaveSectionProps> = ({
  onSave,
  onUsePreset,
  onImageUpload,
  onTextChange,
  presetOptions = [],
  selectedPreset = '',
  language = 'ru'
}) => {
  const translations = {
    ru: {
      save: 'Сохранить существо',
      uploadImage: 'Загрузить изображение',
      presets: 'Пресеты запросов:',
      select: 'Выбрать из списка',
      usePreset: 'Использовать пресет'
    },
    en: {
      save: 'Save creature',
      uploadImage: 'Upload image',
      presets: 'Request presets:',
      select: 'Select from list',
      usePreset: 'Use preset'
    }
  };

  const t = translations[language];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload?.(e.target.files[0]);
    }
  };

  return (
    <div className={s.creatureSaveSection}>
      {/* Сохраненная часть с пресетами */}
      <div className={s.creatureSaveSection__presetsContainer}>
        <div className={s.creatureSaveSection__presetsLabel}>
          {t.presets}
        </div>
        
        <div className={s.creatureSaveSection__presetsDropdown}>
          <select 
            className={s.creatureSaveSection__presetSelect}
            value={selectedPreset}
            onChange={(e) => onTextChange?.(e.target.value)}
          >
            <option value="">{t.select}</option>
            {presetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button className={s.creatureSaveSection__button} onClick={onUsePreset}>
          {t.usePreset}
        </button>
      </div>

      {/* Поле для загрузки изображения */}
      <div className={s.creatureSaveSection__uploadContainer}>
        <label className={s.creatureSaveSection__uploadLabel}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload}
            className={s.creatureSaveSection__uploadInput}
          />
          {t.uploadImage}
        </label>
      </div>

      {/* Круглая кнопка сохранения */}
      <div className={s.creatureSaveSection__saveButtonContainer}>
        <button 
          className={s.creatureSaveSection__saveButton}
          onClick={onSave}
        >
          {t.save}
        </button>
      </div>
    </div>
  );
};