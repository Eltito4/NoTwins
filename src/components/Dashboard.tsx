import { FC, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, UserPlus } from 'lucide-react';
import { CreateEventModal } from './CreateEventModal';
import { EventCard } from './EventCard';
import { EventDetailsModal } from './EventDetailsModal';
import { JoinEventModal } from './JoinEventModal';
import { UserMenu } from './UserMenu';
import type { Event, Dress, DuplicateInfo } from '../types';
import type { User as UserType } from '../types';
import { createEvent, getEventsByUser, joinEvent, deleteEvent, getEventDresses, getEventParticipants } from '../services/eventService';
import toast from 'react-hot-toast';

export const Dashboard: FC = () => {
  const { currentUser } = useAuth();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showJoinEvent, setShowJoinEvent] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicateItems, setDuplicateItems] = useState<Record<string, DuplicateInfo[]>>({});
  const [participants, setParticipants] = useState<Record<string, Record<string, UserType>>>({});

  const loadEvents = async () => {
    try {
      const userEvents = await getEventsByUser();
      setEvents(userEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser]);

  const loadParticipants = async (eventId: string) => {
    try {
      const eventParticipants = await getEventParticipants(eventId);
      setParticipants(prev => ({
        ...prev,
        [eventId]: Object.fromEntries(
          eventParticipants.map(p => [p.id, p])
        )
      }));
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const checkDuplicateItems = async (eventId: string) => {
    try {
      const dresses = await getEventDresses(eventId, true);
      const duplicates: DuplicateInfo[] = [];
      
      dresses.forEach(dress => {
        const matches = dresses.filter(d => 
          d._id !== dress._id && 
          d.name.toLowerCase() === dress.name.toLowerCase()
        );

        if (matches.length > 0) {
          duplicates.push({
            name: dress.name,
            items: [
              {
                id: dress._id,
                userId: dress.userId,
                userName: participants[eventId]?.[dress.userId]?.name || 'Unknown User',
                color: dress.color
              },
              ...matches.map(match => ({
                id: match._id,
                userId: match.userId,
                userName: participants[eventId]?.[match.userId]?.name || 'Unknown User',
                color: match.color
              }))
            ],
            type: matches.some(m => m.color?.toLowerCase() === dress.color?.toLowerCase())
              ? 'exact'
              : 'partial'
          });
        }
      });

      setDuplicateItems(prev => ({
        ...prev,
        [eventId]: duplicates
      }));
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  };

  useEffect(() => {
    events.forEach(event => {
      loadParticipants(event.id);
      checkDuplicateItems(event.id);
    });
  }, [events]);

  const handleCreateEvent = async (eventData: {
    name: string;
    date: string;
    location: string;
    description: string;
  }) => {
    try {
      const newEvent = await createEvent({
        ...eventData,
        creatorId: currentUser!.id,
        participants: [currentUser!.id]
      });
      setEvents(prev => [...prev, newEvent]);
      setShowCreateEvent(false);
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
      setShowJoinEvent(false);
      toast.success('Successfully joined the event!');
    } catch (error) {
      console.error('Error joining event:', error);
      throw error;
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
    }
  };

  const handleDressAdded = async (eventId: string, dress: Dress) => {
    await checkDuplicateItems(eventId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">Your Events</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Join Event Button */}
          <button
            onClick={() => setShowJoinEvent(true)}
            className="flex items-center gap-2 bg-background border border-primary text-primary py-2 px-4 rounded-lg hover:bg-background/80 transition-colors"
          >
            <UserPlus size={20} />
            <span>Join Event</span>
          </button>

          {/* Create Event Button */}
          <button
            onClick={() => setShowCreateEvent(true)}
            className="flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PlusCircle size={20} />
            <span>Create Event</span>
          </button>

          <div className="pl-4 border-l border-gray-200">
            <UserMenu />
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-gray-600 mt-12">
          <p className="mb-4">No events yet.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowJoinEvent(true)}
              className="text-primary hover:text-primary-600"
            >
              Join an event
            </button>
            <span className="text-gray-400">or</span>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="text-primary hover:text-primary-600"
            >
              create your first event
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setSelectedEvent(event)}
              onDelete={() => handleDeleteEvent(event.id)}
              duplicates={duplicateItems[event.id]}
              participants={participants[event.id] || {}}
            />
          ))}
        </div>
      )}

      {showCreateEvent && (
        <CreateEventModal
          onClose={() => setShowCreateEvent(false)}
          onSubmit={handleCreateEvent}
        />
      )}

      {showJoinEvent && (
        <JoinEventModal
          onClose={() => setShowJoinEvent(false)}
          onJoin={handleJoinEvent}
        />
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDressAdded={(dress) => handleDressAdded(selectedEvent.id, dress)}
          participants={participants[selectedEvent.id] || {}}
        />
      )}
    </div>
  );
};
