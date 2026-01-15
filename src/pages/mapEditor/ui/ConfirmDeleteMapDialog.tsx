import { ModalOverlay } from 'shared/ui';

import s from './MapEditor.module.scss';

type ConfirmDeleteMapDialogProps = {
  isOpen: boolean;
  mapName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDeleteMapDialog = ({
  isOpen,
  mapName,
  isDeleting,
  onConfirm,
  onCancel,
}: ConfirmDeleteMapDialogProps) => {
  return (
    <ModalOverlay
      title='Подтверждение удаления'
      isModalOpen={isOpen}
      setIsModalOpen={() => !isDeleting && onCancel()}
    >
      <div className={s.confirmDeleteContent}>
        <p className={s.confirmDeleteText}>
          Удалить карту «<strong>{mapName}</strong>»?
        </p>
        <p className={s.confirmDeleteHint}>Это действие нельзя отменить.</p>
        <div className={s.confirmDeleteActions}>
          <button type='button' onClick={onCancel} disabled={isDeleting}>
            Отмена
          </button>
          <button type='button' data-variant='danger' onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};
