import api from '../lib/api';
import toast from 'react-hot-toast';

export interface ScrapedProduct {
  name: string;
  imageUrl: string;
  color?: string;
  brand?: string;
  price?: number;
  description?: string;
}

export async function scrapeDressDetails(url: string): Promise<ScrapedProduct> {
  try {
    const { data } = await api.post<ScrapedProduct>('/scraping/scrape', { url });
    
    if (!data.name || !data.imageUrl) {
      throw new Error('Invalid product data received');
    }
    
    return {
      name: data.name,
      imageUrl: data.imageUrl,
      color: data.color,
      brand: data.brand,
      price: data.price,
      description: `${data.name}${data.color ? ` - ${data.color}` : ''}${data.price ? ` - $${data.price.toFixed(2)}` : ''}`
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