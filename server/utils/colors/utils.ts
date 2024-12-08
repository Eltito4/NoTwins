import { ColorName, ColorValue } from './types';
import { AVAILABLE_COLORS } from './constants';

export function findClosestNamedColor(color: string): ColorName | null {
  if (!color) return null;
  
  const normalizedColor = color.toLowerCase().trim();
  
  const directMatch = AVAILABLE_COLORS.find(c => 
    c.name.toLowerCase() === normalizedColor
  );
  if (directMatch) return directMatch.name;

  const partialMatch = AVAILABLE_COLORS.find(c => 
    normalizedColor.includes(c.name.toLowerCase())
  );
  if (partialMatch) return partialMatch.name;

  return null;
}

export function normalizeColorName(color: string): string {
  return color.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getColorValue(colorName: ColorName): ColorValue | undefined {
  const color = AVAILABLE_COLORS.find(c => c.name === colorName);
  return color?.value;
}