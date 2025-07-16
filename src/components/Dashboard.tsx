import React, { useState, useEffect } from 'react';
import { useMemo } from 'react';
import { PlusCircle, UserPlus } from 'lucide-react';
import { Event, User } from '../types';
import { EventCard } from './EventCard';
import { CreateEventModal } from './CreateEventModal';
import { JoinEventModal } from './JoinEventModal';
import { EventDetailsModal } from './EventDetailsModal';
import { useAuth } from '../contexts/AuthContext';
import { createEvent, getEventsByUser, joinEvent, getEventParticipants, deleteEvent } from '../services/eventService';
import toast from 'react-hot-toast';
import { isAfter, isBefore, subMonths, parseISO } from 'date-fns';

export function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const { currentUser } = useAuth();

  const loadEvents = async () => {
    try {
      const userEvents = await getEventsByUser();
      setEvents(userEvents);

      const participantsMap: Record<string, User> = {};
      await Promise.all(
        userEvents.map(async (event) => {
          const eventParticipants = await getEventParticipants(event.id);
          eventParticipants.forEach((participant) => {
            participantsMap[participant.id] = participant;
          });
        })
      );
      setParticipants(participantsMap);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Organize events by date and age
  const organizedEvents = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);
    
    const upcomingEvents: Event[] = [];
    const recentPastEvents: Event[] = [];
    const oldEvents: Event[] = [];
    
    events.forEach(event => {
      const eventDate = parseISO(event.date);
      
      if (isAfter(eventDate, now)) {
        // Future events
        upcomingEvents.push(event);
      } else if (isAfter(eventDate, sixMonthsAgo)) {
        // Past events within 6 months
        recentPastEvents.push(event);
      } else {
        // Events older than 6 months
        oldEvents.push(event);
      }
    });
    
    // Sort each category by event date (not creation date)
    upcomingEvents.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    recentPastEvents.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    oldEvents.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    
    return {
      upcoming: upcomingEvents,
      recent: recentPastEvents,
      old: oldEvents
    };
  }, [events]);
  const handleCreateEvent = async (eventData: {
    name: string;
    date: string;
    location: string;
    description: string;
  }) => {
    try {
      if (!currentUser) return;

      const newEvent = await createEvent({
        ...eventData,
        creatorId: currentUser.id,
        participants: [currentUser.id]
      });

      setEvents(prev => [...prev, newEvent]);
      setShowCreateModal(false);
      toast.success('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
      throw error;
    }
  };

  const handleJoinEvent = async (shareId: string) => {
    try {
      const event = await joinEvent(shareId);
      setEvents(prev => [...prev, event]);
      setShowJoinModal(false);
      toast.success('Successfully joined the event!');
    } catch (error) {
      console.error('Error joining event:', error);
      throw error;
    }
  };

  return (
    <div>
      <div className="flex justify-end gap-4 mb-8">
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <UserPlus size={20} />
          <span>Unirse a Evento</span>
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <PlusCircle size={20} />
          <span>Crear Evento</span>
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Aún no hay eventos</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowJoinModal(true)}
              className="text-primary hover:text-primary-600"
            >
              Unirse a un evento
            </button>
            <span className="text-gray-400">o</span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-primary hover:text-primary-600"
            >
              Crear tu primer evento
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Events */}
          {organizedEvents.upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                🗓️ Próximos Eventos ({organizedEvents.upcoming.length})
              </h2>
              <div className="grid gap-4">
                {organizedEvents.upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                    onDelete={handleDeleteEvent}
                    participants={participants}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Recent Past Events (within 6 months) */}
          {organizedEvents.recent.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-600 mb-4 flex items-center gap-2">
                📅 Eventos Recientes ({organizedEvents.recent.length})
              </h2>
              <div className="grid gap-4">
                {organizedEvents.recent.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                    onDelete={handleDeleteEvent}
                    participants={participants}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Old Events (older than 6 months) */}
          {organizedEvents.old.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-400 mb-4 flex items-center gap-2">
                📁 Archivo ({organizedEvents.old.length})
              </h2>
              <div className="grid gap-4 opacity-75">
                {organizedEvents.old.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                    onDelete={handleDeleteEvent}
                    participants={participants}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
        />
      )}

      {showJoinModal && (
        <JoinEventModal
          onClose={() => setShowJoinModal(false)}
          onJoin={handleJoinEvent}
        />
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDressAdded={() => loadEvents()}
          participants={participants}
        />
      )}
    </div>
  );
}