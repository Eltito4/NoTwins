import { Dress } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';

const handleError = (error: unknown, customMessage: string) => {
  console.error(`${customMessage}:`, error);
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error || error.message;
    toast.error(message);
  } else {
    toast.error(customMessage);
  }
  throw error;
};

export async function deleteDress(dressId: string): Promise<void> {
  try {
    if (!dressId) {
      throw new Error('Dress ID is required');
    }
    await api.delete(`/dresses/${dressId}`);
    toast.success('Item deleted successfully');
  } catch (error) {
    handleError(error, 'Failed to delete item');
  }
}

export function checkDressConflict(dress: Dress, otherDresses: Dress[]): boolean {
  return otherDresses.some(otherDress => 
    otherDress._id !== dress._id && 
    otherDress.name.toLowerCase() === dress.name.toLowerCase()
  );
}