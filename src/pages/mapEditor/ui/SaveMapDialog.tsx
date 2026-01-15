import { useState } from 'react';
import { toast } from 'react-toastify';

import type { MapData } from 'entities/maps';
import { useCreateMapMutation, useUpdateMapMutation } from 'entities/maps';
import { ModalOverlay, Spinner } from 'shared/ui';

import s from './MapEditor.module.scss';

type SaveMapDialogProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mapData: MapData;
  currentMapId: string | null;
  currentMapName: string;
  onSaveSuccess: (id: string, name: string) => void;
};

export const SaveMapDialog = ({
  isOpen,
  setIsOpen,
  mapData,
  currentMapId,
  currentMapName,
  onSaveSuccess,
}: SaveMapDialogProps) => {
  const [name, setName] = useState(currentMapName || 'Новая карта');
  const [createMap, { isLoading: isCreating }] = useCreateMapMutation();
  const [updateMap, { isLoading: isUpdating }] = useUpdateMapMutation();

  const isLoading = isCreating || isUpdating;

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Введите название карты');
      return;
    }

    try {
      if (currentMapId) {
        const result = await updateMap({
          id: currentMapId,
          body: { name: trimmedName, data: mapData },
        }).unwrap();
        toast.success('Карта успешно сохранена!');
        onSaveSuccess(result.id, result.name);
      } else {
        const result = await createMap({
          name: trimmedName,
          data: mapData,
        }).unwrap();
        toast.success('Карта успешно создана!');
        onSaveSuccess(result.id, result.name);
      }
      setIsOpen(false);
    } catch {
      toast.error('Не удалось сохранить карту');
    }
  };

  return (
    <ModalOverlay
      title={currentMapId ? 'Сохранить карту' : 'Создать карту'}
      isModalOpen={isOpen}
      setIsModalOpen={setIsOpen}
    >
      <div className={s.dialogContent}>
        {isLoading ? (
          <Spinner size={60} />
        ) : (
          <>
            <label className={s.dialogField}>
              <span>Название карты</span>
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Введите название'
                autoFocus
              />
            </label>
            <div className={s.dialogActions}>
              <button type='button' onClick={() => setIsOpen(false)}>
                Отмена
              </button>
              <button type='button' data-variant='accent' onClick={() => void handleSave()}>
                {currentMapId ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalOverlay>
  );
};
