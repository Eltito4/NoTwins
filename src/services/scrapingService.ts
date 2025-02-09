import api from '../lib/api';
import toast from 'react-hot-toast';
import { ScrapedProduct } from '../types';

export async function scrapeDressDetails(url: string): Promise<ScrapedProduct> {
  try {
    // Validate URL
    if (!url) {
      throw new Error('URL is required');
    }

    try {
      new URL(url); // This will throw if URL is invalid
    } catch {
      throw new Error('Invalid URL format');
    }

    // Make the API request
    const { data } = await api.post('/scraping/scrape', { url });
    
    if (!data.name || !data.imageUrl) {
      throw new Error('Invalid product data received');
    }
    
    return {
      name: data.name,
      imageUrl: data.imageUrl,
      color: data.color,
      brand: data.brand,
      price: data.price,
      type: data.type,
      description: data.description
    };
  } catch (error: any) {
    // Handle specific error cases
    if (error.response?.status === 404) {
      toast.error('Product not found. Please check the URL and try again.');
    } else if (error.response?.status === 403) {
      toast.error('Access to this product is restricted.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details ||
                          error.message ||
                          'Failed to fetch product details';
      toast.error(errorMessage);
    }
    
    throw error;
  }
}