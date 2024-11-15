import axios from 'axios';
import { Event, Dress } from '../types';
import toast from 'react-hot-toast';
import api from '../lib/api';

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

export async function createEvent(event: Omit<Event, 'id' | 'shareId' | 'dresses'>): Promise<Event> {
  try {
    const response = await api.post('/events', {
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description || '',
      creatorId: event.creatorId,
      participants: event.participants
    });
    
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to create event');
    return Promise.reject(error);
  }
}

export async function getEventsByUser(id: string): Promise<Event[]> {
  try {
    const response = await api.get('/events');
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to load events');
    return Promise.reject(error);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await api.delete(`/events/${eventId}`);
    toast.success('Event deleted successfully');
  } catch (error) {
    handleError(error, 'Failed to delete event');
    return Promise.reject(error);
  }
}

export async function addDressToEvent(eventId: string, dress: Omit<Dress, 'id' | 'eventId' | 'userId'>): Promise<Dress> {
  try {
    const response = await api.post('/dresses', {
      eventId,
      ...dress
    });

    toast.success('Item added successfully');
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to add item');
    return Promise.reject(error);
  }
}

export async function getEventDresses(eventId: string, includePrivate = false): Promise<Dress[]> {
  try {
    const response = await api.get(`/dresses/event/${eventId}`, {
      params: { includePrivate }
    });
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to load items');
    return Promise.reject(error);
  }
}

export async function deleteDress(dressId: string): Promise<boolean> {
  try {
    await api.delete(`/dresses/${dressId}`);
    return true;
  } catch (error) {
    console.error('Error deleting dress:', error);
    toast.error('Failed to delete item');
    return Promise.reject(error);
  }
}

export async function joinEvent(shareId: string): Promise<Event> {
  try {
    const response = await api.post(`/events/join/${shareId}`);
    toast.success('Successfully joined the event!');
    return response.data;
  } catch (error) {
    handleError(error, 'Failed to join event');
    return Promise.reject(error);
  }
}