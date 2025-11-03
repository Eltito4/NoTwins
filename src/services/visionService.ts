import api from '../lib/api';
import toast from 'react-hot-toast';

export async function analyzeGarmentImage(imageUrl: string) {
  try {
    console.log('Vision service: Starting analysis for:', imageUrl.substring(0, 50) + '...');
    const { data } = await api.post('/vision/analyze', { imageUrl });
    console.log('Vision service: Received response:', data);
    
    if (!data || !data.data) {
      throw new Error('Invalid response format from vision API');
    }
    
    return data.data;
  } catch (error) {
    console.error('Vision analysis error:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    toast.error('Failed to analyze image: ' + errorMessage);
    throw error;
  }
}