import { select as dselect, zoom as dzoom, zoomIdentity } from 'd3';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { EncounterState, EncounterStore } from 'entities/encounter/model';
import {
  userInterfaceActions,
  UserInterfaceState,
  UserInterfaceStore,
} from 'entities/userInterface/model';
import { useDebounce } from 'shared/lib/debounce';
import { CreatureToken } from './creatureToken';
import { GridLayout } from './gridLayout';

import s from './BattleMap.module.scss';
import { RuleProvider } from './rule';

type BattleMapProps = {
  image: string;
  cells: boolean[][];
  setCells: React.Dispatch<React.SetStateAction<boolean[][]>>;
  /** Grid columns (microcell units) */
  cols: number;
  /** Grid rows (microcell units) */
  rows: number;
  /** Cell size in pixels */
  cellSize: number;
};

const DEBOUNCE_TIME = 500;

export const BattleMap = ({ image, cells, setCells, cols, rows, cellSize }: BattleMapProps) => {
  const dispatch = useDispatch();

  const { participants } = useSelector<EncounterStore>(
    (state) => state.encounter,
  ) as EncounterState;
  const { attackHandleModeActive, attackHandleModeMulti, selectedCreatureId, mapTransform } =
    useSelector<UserInterfaceStore>((state) => state.userInterface) as UserInterfaceState;

  const [transform, setTransform] = useState(mapTransform);
  const debouncedTransforme = useDebounce(transform, DEBOUNCE_TIME);

  const svgRef = useRef<SVGSVGElement>(null);

  const zoom = dzoom()
    .scaleExtent([0.1, 20])
    .on('zoom', (event: { transform: typeof mapTransform }) => {
      setTransform(event.transform);
    });

  useEffect(() => {
    if (svgRef.current) {
      const svg = dselect(svgRef.current as Element);
      svg
        .call(zoom)
        .call(zoom.transform, zoomIdentity.translate(transform.x, transform.y).scale(transform.k));
    }
  }, []);

  useEffect(() => {
    dispatch(
      userInterfaceActions.setMapTransform({
        x: debouncedTransforme.x,
        y: debouncedTransforme.y,
        k: debouncedTransforme.k,
      }),
    );
  }, [debouncedTransforme, dispatch]);

  const handleClick = useCallback(() => {
    if (attackHandleModeActive && attackHandleModeMulti === 'select') {
      dispatch(userInterfaceActions.setAttackHandleModeMulti('handle'));
    }
  }, [attackHandleModeActive, attackHandleModeMulti, dispatch]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className={s.mapContainer}>
      <svg ref={svgRef} className={s.map} onClick={handleClick} onContextMenu={handleContextMenu}>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          <image href={image} height={rows * cellSize} width={cols * cellSize} />
          <GridLayout cells={cells} cols={cols} rows={rows} cellSize={cellSize} />
          <RuleProvider transform={transform} cellSize={cellSize}>
            {participants
              .filter((value) => selectedCreatureId === value.id)
              .map((value) => (
                <CreatureToken
                  transform={transform}
                  key={value.id}
                  id={value.id}
                  x={value.cellsCoords ? value.cellsCoords.cellsX : 0}
                  y={value.cellsCoords ? value.cellsCoords.cellsY : 0}
                  cellSize={cellSize}
                  setCells={setCells}
                />
              ))}

            {participants
              .filter((value) => selectedCreatureId !== value.id)
              .map((value, index) => (
                <CreatureToken
                  transform={transform}
                  key={value.id}
                  id={value.id}
                  x={value.cellsCoords ? value.cellsCoords.cellsX : 0}
                  y={value.cellsCoords ? value.cellsCoords.cellsY : index}
                  cellSize={cellSize}
                  setCells={setCells}
                />
              ))}
          </RuleProvider>
        </g>
      </svg>
    </div>
  );
};
