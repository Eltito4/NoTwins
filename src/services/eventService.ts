import axios from 'axios';
import { Event, Dress, User } from '../types';
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

export async function createEvent(event: Omit<Event, 'id' | '_id' | 'shareId' | 'dresses'>): Promise<Event> {
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
    handleError(error, 'Error al crear evento');
    return Promise.reject(error);
  }
}

export async function getEventsByUser(): Promise<Event[]> {
  try {
    const response = await api.get('/events');
    return response.data;
  } catch (error) {
    handleError(error, 'Error al cargar eventos');
    return Promise.reject(error);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await api.delete(`/events/${eventId}`);
    toast.success('Evento eliminado exitosamente');
  } catch (error) {
    handleError(error, 'Error al eliminar evento');
    return Promise.reject(error);
  }
}

export async function addDressToEvent(eventId: string, dress: Omit<Dress, '_id' | 'id' | 'userId' | 'eventId'>): Promise<Dress> {
  try {
    const response = await api.post('/dresses', {
      eventId,
      ...dress
    });

    toast.success('Artículo agregado exitosamente');
    return response.data;
  } catch (error) {
    handleError(error, 'Error al agregar artículo');
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
    handleError(error, 'Error al cargar artículos');
    return Promise.reject(error);
  }
}

export async function deleteDress(dressId: string): Promise<void> {
  try {
    if (!dressId) {
      throw new Error('Dress ID is required');
    }
    await api.delete(`/dresses/${dressId}`);
    toast.success('Artículo eliminado exitosamente');
  } catch (error) {
    handleError(error, 'Error al eliminar artículo');
  }
}

export async function joinEvent(shareId: string): Promise<Event> {
  try {
    const response = await api.post(`/events/join/${shareId}`);
    toast.success('¡Te has unido al evento exitosamente!');
    return response.data;
  } catch (error) {
    handleError(error, 'Error al unirse al evento');
    return Promise.reject(error);
  }
}

export async function getEventParticipants(eventId: string): Promise<User[]> {
  try {
    const response = await api.get(`/events/${eventId}/participants`);
    return response.data;
  } catch (error) {
    handleError(error, 'Error al cargar participantes');
    return Promise.reject(error);
  }
}