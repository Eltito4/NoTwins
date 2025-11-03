import { Event, Dress, User } from '../types';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { handleApiError } from '../utils/errorHandler';

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
    handleApiError(error, { customMessage: 'Error al crear evento' });
  }
}

export async function getEventsByUser(includeParticipants = false): Promise<Event[]> {
  try {
    const response = await api.get('/events', {
      params: { includeParticipants }
    });
    return response.data;
  } catch (error) {
    handleApiError(error, { customMessage: 'Error al cargar eventos' });
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await api.delete(`/events/${eventId}`);
    toast.success('Evento eliminado exitosamente');
  } catch (error) {
    handleApiError(error, { customMessage: 'Error al eliminar evento' });
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
    handleApiError(error, { customMessage: 'Error al agregar artículo' });
  }
}

export async function getEventDresses(eventId: string, includePrivate = false): Promise<Dress[]> {
  try {
    const response = await api.get(`/dresses/event/${eventId}`, {
      params: { includePrivate }
    });
    return response.data;
  } catch (error) {
    handleApiError(error, { customMessage: 'Error al cargar artículos' });
  }
}

export async function updateDress(dressId: string, updatedData: Partial<Dress>): Promise<Dress> {
  try {
    const response = await api.put(`/dresses/${dressId}`, updatedData);
    toast.success('Artículo actualizado exitosamente');
    return response.data;
  } catch (error) {
    handleApiError(error, { customMessage: 'Error al actualizar artículo' });
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
    handleApiError(error, { customMessage: 'Error al eliminar artículo' });
  }
}

export async function joinEvent(shareId: string): Promise<Event> {
  try {
    const response = await api.post(`/events/join/${shareId}`);
    toast.success('¡Te has unido al evento exitosamente!');
    return response.data;
  } catch (error) {
    handleApiError(error, { customMessage: 'Error al unirse al evento' });
  }
}

export async function getEventParticipants(eventId: string): Promise<User[]> {
  try {
    const response = await api.get(`/events/${eventId}/participants`);
    return response.data;
  } catch (error) {
    handleApiError(error, { customMessage: 'Error al cargar participantes' });
  }
}