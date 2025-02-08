import React, { useState, useEffect } from 'react';
import { PlusCircle, UserPlus } from 'lucide-react';
import { Event, User } from '../types';
import { EventCard } from './EventCard';
import { CreateEventModal } from './CreateEventModal';
import { JoinEventModal } from './JoinEventModal';
import { EventDetailsModal } from './EventDetailsModal';
import { useAuth } from '../contexts/AuthContext';
import { createEvent, getEventsByUser, joinEvent, getEventParticipants } from '../services/eventService';
import toast from 'react-hot-toast';

export function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const { currentUser } = useAuth();

  useEffect(() => {
    loadEvents();
  }, []);

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
          <span>Join Event</span>
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <PlusCircle size={20} />
          <span>Create Event</span>
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No events yet</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowJoinModal(true)}
              className="text-primary hover:text-primary-600"
            >
              Join an event
            </button>
            <span className="text-gray-400">or</span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-primary hover:text-primary-600"
            >
              Create your first event
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setSelectedEvent(event)}
              participants={participants}
            />
          ))}
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