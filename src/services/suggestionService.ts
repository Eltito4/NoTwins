import api from '../lib/api';
import toast from 'react-hot-toast';

export async function getSuggestionsForDuplicate(dressId: string, includeSponsors = false) {
  try {
    console.log('Getting suggestions for dress:', dressId);
    const response = await api.post(`/suggestions/duplicate/${dressId}`, {
      includeSponsors
    });
    console.log('Suggestions response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    toast.error('Error al obtener sugerencias de IA');
    throw error;
  }
}

export async function trackSuggestionInteraction(suggestionId: string, action: string, metadata?: any) {
  try {
    await api.post('/suggestions/track', {
      suggestionId,
      action,
      metadata
    });
  } catch (error) {
    console.error('Error tracking suggestion interaction:', error);
    // Don't show error to user for tracking failures
  }
}

export async function trackProductClick(productUrl: string, suggestionId: string, retailer: string) {
  try {
    await trackSuggestionInteraction(suggestionId, 'product_click', {
      productUrl,
      retailer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error tracking product click:', error);
  }
}
export async function getSuggestionAnalytics(eventId: string) {
  try {
    const response = await api.get(`/suggestions/analytics/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting suggestion analytics:', error);
    toast.error('Failed to get analytics');
    throw error;
  }
}