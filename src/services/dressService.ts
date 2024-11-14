import { Dress } from '../types';

export function checkDressConflict(dress: Dress, otherDresses: Dress[]): boolean {
  return otherDresses.some(otherDress => 
    otherDress.id !== dress.id && 
    otherDress.name.toLowerCase() === dress.name.toLowerCase()
  );
}