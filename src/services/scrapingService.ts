import api from '../lib/api';
import toast from 'react-hot-toast';

export async function scrapeDressDetails(url: string) {
  try {
    const { data } = await api.post('/scraping/scrape', { url });
    return data;
  } catch (error: any) {
    console.error('Error fetching dress details:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.details ||
                        'Failed to fetch product details. Please check the URL and try again.';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}