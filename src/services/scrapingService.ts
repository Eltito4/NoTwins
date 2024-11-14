import axios from 'axios';

export async function scrapeDressDetails(url: string) {
  try {
    const response = await axios.post('/api/scraping/scrape', { url });
    return response.data;
  } catch (error) {
    console.error('Error fetching dress details:', error);
    throw new Error('Failed to fetch dress details');
  }
}