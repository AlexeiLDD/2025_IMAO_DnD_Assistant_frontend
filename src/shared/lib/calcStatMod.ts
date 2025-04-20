export const calculateStatModifier = (score: number): string => {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};
  
export const clampStatValue = (value: number): number => {
  return Math.max(1, Math.min(99, value));
};