import api from '../lib/api';
import toast from 'react-hot-toast';

export async function scrapeDressDetails(url: string) {
  try {
    const { data } = await api.post('/scraping/scrape', { url });
    
    if (!data.name || !data.imageUrl) {
      throw new Error('Invalid product data received');
    }
    
    return {
      name: data.name,
      imageUrl: data.imageUrl,
      color: data.color || '',
      style: data.brand || '',
      description: `${data.name} - ${data.color || 'Unknown color'}`
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.details ||
                        error.message ||
                        'Failed to fetch product details';
                        
    console.error('Error fetching dress details:', errorMessage);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}