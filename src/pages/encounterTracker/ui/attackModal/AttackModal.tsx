import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  AttackLLM,
  Creature,
  creatureActions,
  creatureSelectors,
  CreaturesStore,
  Size,
} from 'entities/creature/model';
import { loggerActions } from 'entities/logger/model';
import {
  userInterfaceActions,
  UserInterfaceState,
  UserInterfaceStore,
} from 'entities/userInterface/model';
import {
  AbilitySavingThrow,
  dndTraitToInitialForm,
  parseD20Roll,
  parseDamageRolls,
} from 'pages/encounterTracker/lib';
import {
  calculateDndDamage,
  rollDamageLLM,
  rollSavingThrow,
  rollToHitLLM,
} from 'pages/encounterTracker/model';
import { D20AttackRollToast } from 'pages/encounterTracker/ui/trackerToasts/d20AttackRollToast';
import { D20SavingThrowToast } from 'pages/encounterTracker/ui/trackerToasts/d20SavingThrow';
import { DamageRollToast } from 'pages/encounterTracker/ui/trackerToasts/damageRollToast';
import { CheckboxState, ThreeStateCheckbox } from 'shared/ui/threeStateCheckbox';

import { EncounterState, EncounterStore } from 'entities/encounter/model';
import s from './AttackModal.module.scss';

enum AttackStatus {
  Advantage = 'Преимущество',
  Disadvantage = 'Помеха',
  None = 'Атака без преимущества или помехи',
}

type AttackModalProps = {
  cells: boolean[][];
  setCells: React.Dispatch<React.SetStateAction<boolean[][]>>;
  attackIndex?: number;
  attackData?: AttackLLM;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const AttackModal: React.FC<AttackModalProps> = ({
  cells,
  setCells,
  attackIndex,
  attackData,
  setIsModalOpen,
}) => {
  const dispatch = useDispatch();

  const { participants } = useSelector<EncounterStore>(
    (state) => state.encounter,
  ) as EncounterState;
  const {
    attackHandleModeMulti,
    selectedCreatureId,
    attackedCreatureId: rowAttackedCreatureId,
  } = useSelector<UserInterfaceStore>((state) => state.userInterface) as UserInterfaceState;

  const allCreatures = useSelector<CreaturesStore>((state) =>
    creatureSelectors.selectEntities(state),
  ) as Record<string, Creature>;

  const selectedCreature = allCreatures[selectedCreatureId ?? ''];
  const attackedCreatures: Creature[] = [];

  if (attackHandleModeMulti !== 'handle') {
    attackedCreatures.push(allCreatures[rowAttackedCreatureId ?? '']);
  } else {
    participants.forEach((participant) => {
      const { id, cellsCoords } = participant;

      if (id === selectedCreatureId) return;

      const creature = allCreatures[id];
      let resolved = false;
      const size = creature.size < Size.small ? 1 : (creature.size as number);

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          // Safe access with optional chaining to prevent crash during resize
          const rowIdx = cellsCoords ? cellsCoords.cellsY + i : -1;
          const colIdx = cellsCoords ? cellsCoords.cellsX + j : -1;
          const isSelected = cells[rowIdx]?.[colIdx] ?? false;
          if (cellsCoords && isSelected) {
            attackedCreatures.push(creature);
            resolved = true;

            break;
          }
        }

        if (resolved) break;
      }
    });
  }

  const [attackStatus, setAttackStatus] = useState<AttackStatus>(AttackStatus.None);

  const handleCheckboxChange = useCallback(
    (state: CheckboxState) => {
      const status =
        state === 'unchecked'
          ? AttackStatus.Disadvantage
          : state === 'checked'
            ? AttackStatus.Advantage
            : AttackStatus.None;
      setAttackStatus(status);
    },
    [setAttackStatus],
  );

  const handleAttack = (attack: AttackLLM) => {
    attackedCreatures.forEach((attackedCreature) => {
      let advantage = false;
      let disadvantage = false;
      let attackLog = `
        АТАКА: (${selectedCreature?.name || 'Не выбрано'} ->
        ${attackedCreature?.name || 'Не выбрано'}
      `;

      if (attackStatus === AttackStatus.Advantage) {
        advantage = true;
      } else if (attackStatus === AttackStatus.Disadvantage) {
        disadvantage = true;
      }

      if (attack.attackBonus) {
        const { hit, critical, d20Roll } = rollToHitLLM(
          attackedCreature,
          attack,
          advantage,
          disadvantage,
        );
        const rolls = d20Roll.map((roll) => roll.roll);

        attackLog = attackLog.concat(`
          ${advantage ? '(с Преимуществом))' : disadvantage ? '(с Помехой))' : ')'}
          ${hit ? 'ПОПАДАНИЕ' : 'ПРОМАХ'}: ${parseD20Roll(rolls, d20Roll[0].bonus)}
        `);

        toast(
          <D20AttackRollToast
            total={d20Roll[0].total}
            rolls={rolls}
            bonus={d20Roll[0].bonus}
            hit={hit}
            advantage={advantage}
            disadvantage={disadvantage}
          />,
        );

        if (hit) {
          const damageDicesRolls = rollDamageLLM(attack, critical, attackedCreature);

          const damage = damageDicesRolls.total;

          attackLog = attackLog.concat(`
            ; БРОСОК УРОНА: ${parseDamageRolls(damageDicesRolls)}
          `);

          toast(<DamageRollToast damageRolls={damageDicesRolls} />);

          dispatch(
            creatureActions.updateCurrentByDelta({
              id: attackedCreature.id || '',
              delta: damage ? -damage : 0,
            }),
          );
        }
      } else if (attack.saveDc && attack.saveType) {
        const constitutionSavingThrow: AbilitySavingThrow = {
          challengeRating: attack.saveDc,
          ability: dndTraitToInitialForm(attack.saveType),
        };

        const advantageSavingThrow = false;
        const disadvantageSavingThrow = false;

        const { successSavingThrow, criticalSavingThrow, d20RollsSavingThrow } = rollSavingThrow(
          attackedCreature,
          constitutionSavingThrow,
          advantageSavingThrow,
        );

        const rolls = d20RollsSavingThrow.map((roll) => roll.roll);

        attackLog = attackLog.concat(`
          ; ${successSavingThrow ? 'ПРОЙДЕН' : 'ПРОВАЛЕН'}: ${parseD20Roll(rolls, d20RollsSavingThrow[0].bonus)}
        `);

        toast(
          <D20SavingThrowToast
            total={d20RollsSavingThrow[0].total}
            rolls={rolls}
            bonus={d20RollsSavingThrow[0].bonus}
            hit={successSavingThrow}
            advantage={advantageSavingThrow}
            disadvantage={disadvantageSavingThrow}
          />,
        );

        if (attack.damage) {
          const damageDicesRolls = rollDamageLLM(attack, criticalSavingThrow, attackedCreature);

          const damage = damageDicesRolls.total;

          const finalDamage = calculateDndDamage(damage, {
            saveEffect: successSavingThrow ? 'half' : 'full',
          });

          damageDicesRolls.total = finalDamage;

          attackLog = attackLog.concat(`
            ; БРОСОК УРОНА: ${parseDamageRolls(damageDicesRolls)}
          `);

          toast(<DamageRollToast damageRolls={damageDicesRolls} />);

          dispatch(
            creatureActions.updateCurrentByDelta({
              id: attackedCreature.id || '',
              delta: damage ? -damage : 0,
            }),
          );
        }
      }

      setTimeout(() => dispatch(loggerActions.addLog(attackLog)));
    });

    dispatch(userInterfaceActions.selectAttackedCreature(null));
    dispatch(userInterfaceActions.setAttackHandleModeMulti('idle'));
    setIsModalOpen((prev) => !prev);
    setCells((prev) => prev.map((rows) => rows.map((_cols) => false)));
  };

  return (
    <div className={s.attackForm}>
      <div className={s.debugInfo}>
        <p>Атакующее существо: {selectedCreature?.name || 'Не выбрано'}</p>
        <p>
          Атакуемое существо:{' '}
          {attackedCreatures.map((attackedCreature) => attackedCreature?.name).join(', ') ||
            'Не выбрано'}
        </p>
      </div>

      <div className={s.attackControl}>
        <ThreeStateCheckbox
          initialState='indeterminate'
          onChange={handleCheckboxChange}
          className={s.attackCheckbox}
        />
        <div className={s.attackStatus}>{attackStatus}</div>
      </div>

      <button
        type='button'
        data-variant='primary'
        onClick={() => {
          if (attackIndex !== undefined && attackData) {
            handleAttack(attackData);
          }
        }}
      >
        Совершить атаку
      </button>
    </div>
  );
};
