import { Dice20, modifiers } from 'shared/lib';

export const calculateInitiative = (dex: number) => {
  return Dice20.roll() + modifiers[dex];
};
