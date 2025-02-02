import api from '../lib/api';
import toast from 'react-hot-toast';

export async function analyzeGarmentImage(imageUrl: string) {
  try {
    const { data } = await api.post('/vision/analyze', { imageUrl });
    return data.data;
  } catch (error) {
    console.error('Vision analysis error:', error);
    toast.error('Failed to analyze image');
    throw error;
  }
}