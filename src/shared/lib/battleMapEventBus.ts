/**
 * Shared types for BattleMap tool/event system.
 *
 * Note: BattleMapEventBus class was removed — ToolRegistry handles
 * event dispatch directly. These types are used by Tool, ToolRegistry,
 * and tool hooks (useRuleTool, etc.).
 */

export type MapPointerEvent = {
  /** Screen coordinates (clientX/Y) */
  screen: { x: number; y: number };
  /** World coordinates (inside SVG <g> after inverse d3 transform) */
  world: { x: number; y: number };
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  originalEvent: MouseEvent;
};

export type MapKeyEvent = {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  originalEvent: KeyboardEvent;
};

export type BattleMapEvents = {
  pointerdown: MapPointerEvent;
  pointermove: MapPointerEvent;
  pointerup: MapPointerEvent;
  contextmenu: MapPointerEvent;
  keydown: MapKeyEvent;
  keyup: MapKeyEvent;
};
