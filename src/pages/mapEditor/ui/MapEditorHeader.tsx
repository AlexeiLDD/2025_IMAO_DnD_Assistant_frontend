import {
  Icon28ComputerMouseArrowsOutline,
  Icon28DeleteOutline,
  Icon28RefreshOutline,
} from '@vkontakte/icons';

import s from './MapEditor.module.scss';

export type MapEditorHeaderProps = {
  onReset: () => void;
  onSave: () => void;
  onLoad: () => void;
  currentMapName: string | null;
};

export const MapEditorHeader = ({
  onReset,
  onSave,
  onLoad,
  currentMapName,
}: MapEditorHeaderProps) => {
  return (
    <header className={s.headerSection}>
      <h1>Редактор карт</h1>
      {currentMapName && (
        <p style={{ fontWeight: 600, color: 'var(--color-accent-primary, #7048e8)' }}>
          Текущая карта: {currentMapName}
        </p>
      )}
      <p>
        Соберите собственную карту из квадратных плиток. Перетащите плитку из панели элементов на
        поле. Чтобы переместить плитку, потяните её из ячейки. Щёлкните правой кнопкой, чтобы
        очистить клетку.
      </p>
      <div className={s.actions}>
        <button type='button' onClick={onSave}>
          Сохранить карту
        </button>
        <button type='button' onClick={onLoad}>
          Загрузить карту
        </button>
        <button type='button' onClick={onReset}>
          Очистить карту
        </button>
      </div>
      <div className={s.helpBox}>
        <h2 className={s.helpTitle}>Справка по управлению</h2>
        <div className={s.helpSection}>
          <h3 className={s.helpSectionTitle}>Работа с плитками</h3>
          <div className={s.helpItems}>
            <div className={s.helpItem}>
              <span className={s.helpIcon}>
                <Icon28ComputerMouseArrowsOutline />
              </span>
              <p className={s.helpText}>
                Перетаскивание — зажмите ЛКМ по плитке в палитре или на поле и перенесите её в
                нужную клетку.
              </p>
            </div>
            <div className={s.helpItem}>
              <span className={s.helpIcon}>
                <Icon28RefreshOutline />
              </span>
              <p className={s.helpText}>
                Поворот — пока плитка в руках, нажимайте Q (Й) для поворота против часовой стрелки и
                E (У) для поворота по часовой стрелке. Клавиша R (К) сбрасывает угол. Esc — отменить
                перенос.
              </p>
            </div>
            <div className={s.helpItem}>
              <span className={s.helpIcon}>
                <Icon28DeleteOutline />
              </span>
              <p className={s.helpText}>Очистка клетки — нажмите ПКМ по плитке на поле.</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
