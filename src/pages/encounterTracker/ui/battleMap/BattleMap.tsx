import { select as dselect, zoom as dzoom, zoomIdentity } from 'd3';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AuthState } from 'entities/auth/model';
import { AuthStore } from 'entities/auth/model/types';
import { EncounterState, EncounterStore } from 'entities/encounter/model';
import { findParticipant } from 'entities/session/lib';
import { ParticipantsSessionContext } from 'entities/session/model/sessionContext';
import {
  userInterfaceActions,
  UserInterfaceState,
  UserInterfaceStore,
} from 'entities/userInterface/model';
import { screenToWorld } from 'shared/lib/mapCoords';
import { CreatureToken } from './creatureToken';
import { FogOverlay } from './fogOverlay';
import { GridLayout } from './gridLayout';
import { ToolRegistry, useFogBrushTool, useRuleTool } from './tools';

import s from './BattleMap.module.scss';

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

const SCALE_EPSILON = 1e-6;

export const BattleMap = ({ image, cells, setCells, cols, rows, cellSize }: BattleMapProps) => {
  const dispatch = useDispatch();

  const { participants, fog } = useSelector<EncounterStore>(
    (state) => state.encounter,
  ) as EncounterState;
  const { attackHandleModeActive, attackHandleModeMulti, selectedCreatureId, mapTransform } =
    useSelector<UserInterfaceStore>((state) => state.userInterface) as UserInterfaceState;

  // Admin detection for fog overlay opacity
  const { id: userId } = useSelector<AuthStore>((state) => state.auth) as AuthState;
  const sessionParticipants = use(ParticipantsSessionContext);
  const isAdmin = findParticipant(userId, sessionParticipants)?.role === 'admin';

  // Ref-based translate (no re-render on pan)
  const translateRef = useRef({ x: mapTransform.x, y: mapTransform.y });
  // State-based scale (re-render only on zoom)
  const [scale, setScale] = useState(mapTransform.k);
  // Ref to SVG group for imperative transform updates
  const groupRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ========================
  // Tool system
  // ========================
  const registryRef = useRef(new ToolRegistry());

  // RuleTool (measurement)
  const { tool: ruleTool, overlay: ruleOverlay } = useRuleTool({ cellSize, scale });

  // FogBrushTool (DM only, when fog enabled)
  const { tool: fogBrushTool, overlay: fogBrushOverlay } = useFogBrushTool({
    cellSize,
    rows,
    cols,
    scale,
  });

  // Register tools (effect — re-runs only when tool set changes)
  useEffect(() => {
    const registry = registryRef.current;
    registry.clear();
    registry.register(ruleTool);
    if (isAdmin && fog.enabled) {
      registry.register(fogBrushTool);
    }
    return () => {
      registry.clear();
    };
  }, [ruleTool, fogBrushTool, isAdmin, fog.enabled]);

  // Helper: build MapPointerEvent from native MouseEvent
  const buildPointerEvent = useCallback((e: MouseEvent) => {
    const svg = svgRef.current;
    const world = svg
      ? screenToWorld(e.clientX, e.clientY, svg, {
          x: translateRef.current.x,
          y: translateRef.current.y,
          k: scale,
        })
      : { x: 0, y: 0 };

    return {
      screen: { x: e.clientX, y: e.clientY },
      world,
      button: e.button,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      originalEvent: e,
    };
  }, [scale]);

  // Wire DOM events → ToolRegistry
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onPointerDown = (e: MouseEvent) => {
      registryRef.current.dispatchPointer('onPointerDown', buildPointerEvent(e));
    };
    const onPointerMove = (e: MouseEvent) => {
      registryRef.current.dispatchPointer('onPointerMove', buildPointerEvent(e));
    };
    const onPointerUp = (e: MouseEvent) => {
      registryRef.current.dispatchPointer('onPointerUp', buildPointerEvent(e));
    };
    const onContextMenu = (e: MouseEvent) => {
      const handled = registryRef.current.dispatchPointer('onContextMenu', buildPointerEvent(e));
      if (handled) {
        e.preventDefault();
      }
    };

    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', onPointerUp);
    svg.addEventListener('contextmenu', onContextMenu);

    return () => {
      svg.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerup', onPointerUp);
      svg.removeEventListener('contextmenu', onContextMenu);
    };
  }, [buildPointerEvent]);

  // Apply tool cursor
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const cursor = registryRef.current.getCursor();
    svg.style.cursor = cursor ?? '';
  });

  // ========================
  // D3 zoom/pan
  // ========================

  // Imperative transform update (called on every d3 zoom event)
  const applyViewportTransform = useCallback(() => {
    if (groupRef.current) {
      const { x, y } = translateRef.current;
      groupRef.current.setAttribute('transform', `translate(${x}, ${y}) scale(${scale})`);
    }
  }, [scale]);

  // D3 zoom handler
  const zoomRef = useRef(
    dzoom()
      .scaleExtent([0.1, 20])
      .on('zoom', (event: { transform: { x: number; y: number; k: number } }) => {
        const newTranslate = { x: event.transform.x, y: event.transform.y };
        const newScale = event.transform.k;

        // Always update translate ref (no re-render)
        translateRef.current = newTranslate;

        // Update scale state only if changed significantly
        setScale((prevScale) => {
          if (Math.abs(prevScale - newScale) > SCALE_EPSILON) {
            return newScale;
          }
          return prevScale;
        });

        // Imperative DOM update for smooth pan
        if (groupRef.current) {
          groupRef.current.setAttribute(
            'transform',
            `translate(${newTranslate.x}, ${newTranslate.y}) scale(${newScale})`,
          );
        }
      }),
  );

  // Initialize d3 zoom
  useEffect(() => {
    if (svgRef.current) {
      const svg = dselect(svgRef.current as Element);
      svg
        .call(zoomRef.current)
        .call(
          zoomRef.current.transform,
          zoomIdentity.translate(translateRef.current.x, translateRef.current.y).scale(scale),
        );
    }
  }, []);

  // Sync to Redux on scale change (debounced by nature of rare scale updates)
  useEffect(() => {
    dispatch(
      userInterfaceActions.setMapTransform({
        x: translateRef.current.x,
        y: translateRef.current.y,
        k: scale,
      }),
    );
  }, [scale, dispatch]);

  // Build transform object for children (uses current refs + state)
  const transform = { x: translateRef.current.x, y: translateRef.current.y, k: scale };

  const handleClick = useCallback(() => {
    if (attackHandleModeActive && attackHandleModeMulti === 'select') {
      dispatch(userInterfaceActions.setAttackHandleModeMulti('handle'));
    }
  }, [attackHandleModeActive, attackHandleModeMulti, dispatch]);

  return (
    <div className={s.mapContainer}>
      <svg ref={svgRef} className={s.map} onClick={handleClick}>
        <g
          ref={groupRef}
          transform={`translate(${translateRef.current.x}, ${translateRef.current.y}) scale(${scale})`}
        >
          <image href={image} height={rows * cellSize} width={cols * cellSize} />
          <GridLayout cells={cells} cols={cols} rows={rows} cellSize={cellSize} />

          {/* Event capture rect (replaces RuleProvider's transparent rect) */}
          <rect
            x='0'
            y='0'
            width={cols * cellSize}
            height={rows * cellSize}
            fill='transparent'
            stroke='none'
            pointerEvents='all'
          />

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

          {/* Tool overlay layer — renders on top of tokens */}
          <g id='tool-overlay'>
            {ruleOverlay}
            {fogBrushOverlay}
          </g>

          {/* L7: Fog of War overlay — topmost visible layer */}
          {fog.enabled && (
            <FogOverlay
              fogHistory={fog.historyParty}
              rows={rows}
              cols={cols}
              cellSize={cellSize}
              isAdmin={isAdmin}
            />
          )}
        </g>
      </svg>
    </div>
  );
};
