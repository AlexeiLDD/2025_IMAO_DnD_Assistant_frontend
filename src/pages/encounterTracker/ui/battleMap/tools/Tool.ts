import { ReactNode } from 'react';
import { MapKeyEvent, MapPointerEvent } from 'shared/lib/battleMapEventBus';

export type ToolId = string;

/**
 * A BattleMap tool that can handle pointer/keyboard events
 * and optionally render an SVG overlay.
 *
 * Returning `true` from any handler marks the event as "handled",
 * preventing further propagation to other tools or default behavior.
 */
export interface Tool {
  id: ToolId;
  cursor?: string;
  onPointerDown?: (e: MapPointerEvent) => boolean | void;
  onPointerMove?: (e: MapPointerEvent) => boolean | void;
  onPointerUp?: (e: MapPointerEvent) => boolean | void;
  onContextMenu?: (e: MapPointerEvent) => boolean | void;
  onKeyDown?: (e: MapKeyEvent) => boolean | void;
  onKeyUp?: (e: MapKeyEvent) => boolean | void;
  renderOverlay?: () => ReactNode;
}
