/**
 * Viewport transform: d3 zoom state (translate + scale).
 */
export type Viewport = {
  x: number; // translateX
  y: number; // translateY
  k: number; // scale
};

/**
 * Convert screen (client) coordinates to SVG viewport coordinates,
 * then apply inverse d3 transform to get world coordinates.
 */
export function screenToWorld(
  clientX: number,
  clientY: number,
  svgElement: SVGSVGElement,
  viewport: Viewport,
): { x: number; y: number } {
  const point = svgElement.createSVGPoint();
  point.x = clientX;
  point.y = clientY;

  const ctm = svgElement.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };

  const svgPoint = point.matrixTransform(ctm.inverse());

  return {
    x: (svgPoint.x - viewport.x) / viewport.k,
    y: (svgPoint.y - viewport.y) / viewport.k,
  };
}

/**
 * Snap world coordinate to grid cell center.
 */
export function snapToGrid(
  worldX: number,
  worldY: number,
  cellSize: number,
): { x: number; y: number } {
  return {
    x: Math.floor(worldX / cellSize) * cellSize + cellSize / 2,
    y: Math.floor(worldY / cellSize) * cellSize + cellSize / 2,
  };
}
