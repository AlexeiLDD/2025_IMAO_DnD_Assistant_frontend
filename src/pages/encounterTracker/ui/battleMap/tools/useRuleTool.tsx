import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { MapPointerEvent } from 'shared/lib/battleMapEventBus';
import { snapToGrid } from 'shared/lib/mapCoords';
import { Tool } from './Tool';

import s from '../rule/RuleProvider.module.scss';

type UseRuleToolOptions = {
  cellSize: number;
  /** Current d3 scale — used for stroke scaling */
  scale: number;
};

/**
 * Hook that creates a RuleTool — a measurement tool activated by right-click drag.
 * Returns the Tool object (register it in ToolRegistry) and the overlay ReactNode.
 */
export function useRuleTool({ cellSize, scale }: UseRuleToolOptions): {
  tool: Tool;
  overlay: ReactNode;
} {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const isDrawingRef = useRef(false);

  // Sync ref with state for use in event handlers (no stale closures)
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  // Window mouseup fallback (if pointer leaves SVG during drawing)
  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (isDrawingRef.current) {
        setIsDrawing(false);
      }
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, []);

  const onContextMenu = useCallback(
    (e: MapPointerEvent): boolean => {
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      return true;
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: MapPointerEvent): boolean | void => {
      if (e.button !== 2) return; // only right-click

      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();

      const snapped = snapToGrid(e.world.x, e.world.y, cellSize);

      setIsDrawing(true);
      setStartPoint(snapped);
      setEndPoint(snapped);

      return true;
    },
    [cellSize],
  );

  const onPointerMove = useCallback(
    (e: MapPointerEvent): boolean | void => {
      if (!isDrawingRef.current) return;

      e.originalEvent.stopPropagation();

      const snapped = snapToGrid(e.world.x, e.world.y, cellSize);
      setEndPoint(snapped);

      return true;
    },
    [cellSize],
  );

  const onPointerUp = useCallback(
    (e: MapPointerEvent): boolean | void => {
      if (!isDrawingRef.current) return;

      e.originalEvent.stopPropagation();
      setIsDrawing(false);

      return true;
    },
    [],
  );

  const tool: Tool = {
    id: 'rule',
    onContextMenu,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };

  const distance =
    (Math.max(Math.abs(endPoint.x - startPoint.x), Math.abs(endPoint.y - startPoint.y)) /
      cellSize) *
    5;

  const overlay: ReactNode = isDrawing ? (
    <>
      <defs>
        <marker
          id='arrowhead'
          markerWidth='5'
          markerHeight='3.5'
          refX='4.5'
          refY='1.75'
          orient='auto'
        >
          <polygon points='0 0, 5 1.75, 0 3.5' fill='#ec9ded' />
        </marker>
      </defs>
      <line
        x1={startPoint.x}
        y1={startPoint.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke='#ec9ded'
        strokeWidth={5 / scale}
        strokeDasharray='5,5'
        markerEnd='url(#arrowhead)'
      />
      <foreignObject x={endPoint.x + 10} y={endPoint.y - 50} width='70' height='100'>
        <div className={s.ruleTooltip}>
          {distance} Ft
        </div>
      </foreignObject>
    </>
  ) : null;

  return { tool, overlay };
}
