import { MapKeyEvent, MapPointerEvent } from 'shared/lib/battleMapEventBus';
import { Tool, ToolId } from './Tool';

type PointerEventType = 'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onContextMenu';
type KeyEventType = 'onKeyDown' | 'onKeyUp';

/**
 * Manages registered tools and dispatches events.
 *
 * Strategy: ALL registered tools receive events in registration order.
 * If any tool returns `true`, the event is considered handled and
 * propagation stops. This allows multiple passive tools (e.g. ruler
 * always listens to contextmenu) without needing a UI switcher.
 */
export class ToolRegistry {
  private tools: Tool[] = [];
  private activeToolId: ToolId | null = null;

  register(tool: Tool): void {
    // Prevent duplicates
    if (this.tools.some((t) => t.id === tool.id)) return;
    this.tools.push(tool);
  }

  unregister(id: ToolId): void {
    this.tools = this.tools.filter((t) => t.id !== id);
    if (this.activeToolId === id) this.activeToolId = null;
  }

  setActiveTool(id: ToolId | null): void {
    this.activeToolId = id;
  }

  getActiveTool(): Tool | undefined {
    return this.tools.find((t) => t.id === this.activeToolId);
  }

  getAllTools(): Tool[] {
    return this.tools;
  }

  /**
   * Dispatch a pointer event to all tools.
   * Active tool gets called first if set, then others.
   * Returns true if any tool handled the event.
   */
  dispatchPointer(type: PointerEventType, event: MapPointerEvent): boolean {
    // Active tool first
    const active = this.getActiveTool();
    if (active) {
      const handler = active[type];
      if (handler && handler(event) === true) return true;
    }

    // Then all other tools
    for (const tool of this.tools) {
      if (tool.id === this.activeToolId) continue;
      const handler = tool[type];
      if (handler && handler(event) === true) return true;
    }

    return false;
  }

  /**
   * Dispatch a key event to all tools.
   */
  dispatchKey(type: KeyEventType, event: MapKeyEvent): boolean {
    const active = this.getActiveTool();
    if (active) {
      const handler = active[type];
      if (handler && handler(event) === true) return true;
    }

    for (const tool of this.tools) {
      if (tool.id === this.activeToolId) continue;
      const handler = tool[type];
      if (handler && handler(event) === true) return true;
    }

    return false;
  }

  /** Get cursor from active tool or first tool with cursor */
  getCursor(): string | undefined {
    const active = this.getActiveTool();
    if (active?.cursor) return active.cursor;

    for (const tool of this.tools) {
      if (tool.cursor) return tool.cursor;
    }

    return undefined;
  }

  clear(): void {
    this.tools = [];
    this.activeToolId = null;
  }
}
