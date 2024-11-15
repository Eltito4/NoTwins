import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, PlusCircle, UserPlus, User } from 'lucide-react';
import { CreateEventModal } from './CreateEventModal';
import { EventCard } from './EventCard';
import { EventDetailsModal } from './EventDetailsModal';
import { JoinEventModal } from './JoinEventModal';
import type { Event, Dress, DuplicateInfo } from '../types';
import { createEvent, getEventsByUser, joinEvent, deleteEvent, getEventDresses } from '../services/eventService';
import toast from 'react-hot-toast';

export const Dashboard: FC = () => {
  const { currentUser, signOut } = useAuth();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showJoinEvent, setShowJoinEvent] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicateItems, setDuplicateItems] = useState<Record<string, DuplicateInfo[]>>({});

  useEffect(() => {
    if (currentUser) {
      loadEvents();
    }
  }, [currentUser]);

  useEffect(() => {
    events.forEach(event => {
      checkDuplicateItems(event.id);
    });
  }, [events]);

  const checkDuplicateItems = async (eventId: string) => {
    try {
      const dresses = await getEventDresses(eventId);
      const duplicates: DuplicateInfo[] = [];
      
      // Group dresses by name
      const dressesByName = dresses.reduce((acc, dress) => {
        if (!acc[dress.name.toLowerCase()]) {
          acc[dress.name.toLowerCase()] = [];
        }
        acc[dress.name.toLowerCase()].push(dress);
        return acc;
      }, {} as Record<string, Dress[]>);

      // Check for duplicates
      for (const [, items] of Object.entries(dressesByName)) {
        if (items.length > 1) {
          // Group by color
          const itemsByColor = items.reduce((acc, item) => {
            const color = (item.color || 'unknown').toLowerCase();
            if (!acc[color]) {
              acc[color] = [];
            }
            acc[color].push(item);
            return acc;
          }, {} as Record<string, Dress[]>);

          // Check for exact duplicates (same color)
          for (const [, colorItems] of Object.entries(itemsByColor)) {
            if (colorItems.length > 1) {
              duplicates.push({
                name: items[0].name,
                items: colorItems.map(item => ({
                  id: item.id,
                  userId: item.userId,
                  userName: 'Loading...',
                  color: item.color
                })),
                type: 'exact'
              });
            }
          }

          // Check for partial duplicates (different colors)
          if (Object.keys(itemsByColor).length > 1) {
            duplicates.push({
              name: items[0].name,
              items: items.map(item => ({
                id: item.id,
                userId: item.userId,
                userName: 'Loading...',
                color: item.color
              })),
              type: 'partial'
            });
          }
        }
      }

      // Update user names for duplicates
      const userIds = [...new Set(duplicates.flatMap(d => d.items.map(i => i.userId)))];
      const userNames = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const response = await fetch(`/api/users/${userId}`);
            const data = await response.json();
            return [userId, data.name];
          } catch (error) {
            console.error('Error fetching user name:', error);
            return [userId, 'Unknown User'];
          }
        })
      );
      const userMap = Object.fromEntries(userNames);

      // Update duplicate items with user names
      duplicates.forEach(duplicate => {
        duplicate.items.forEach(item => {
          item.userName = userMap[item.userId];
        });
      });

      setDuplicateItems(prev => ({
        ...prev,
        [eventId]: duplicates
      }));
    } catch (error) {
      console.error('Error checking for duplicate items:', error);
    }
  };

  const loadEvents = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const userEvents = await getEventsByUser(currentUser.id);
      setEvents(userEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (data: {
    name: string;
    date: string;
    location: string;
    description: string;
  }) => {
    if (!currentUser?.id) return;

    try {
      const newEvent = await createEvent({
        ...data,
        creatorId: currentUser.id,
        participants: [currentUser.id]
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
      const joinedEvent = await joinEvent(shareId);
      setEvents(prev => [...prev, joinedEvent]);
      setShowJoinEvent(false);
      toast.success('Successfully joined the event!');
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error('Failed to join event');
      throw error;
    }
  };

  const handleDressAdded = async (eventId: string, newDress: Dress) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === eventId
          ? { ...event, dresses: [...event.dresses, newDress] }
          : event
      )
    );
    await checkDuplicateItems(eventId);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
      setDuplicateItems(prev => {
        const newState = { ...prev };
        delete newState[eventId];
        return newState;
      });
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
          <button
            onClick={() => setShowJoinEvent(true)}
            className="flex items-center gap-2 bg-white text-purple-600 border border-purple-600 py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <UserPlus size={20} />
            <span>Join Event</span>
          </button>
          <button
            onClick={() => setShowCreateEvent(true)}
            className="flex items-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusCircle size={20} />
            <span>Create Event</span>
          </button>
          <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
            <div className="flex items-center gap-2 text-gray-700">
              <User size={20} className="text-gray-500" />
              <span className="font-medium">{currentUser?.name}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-gray-600 mt-12">
          <p className="mb-4">No events yet.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowJoinEvent(true)}
              className="text-purple-600 hover:text-purple-700"
            >
              Join an event
            </button>
            <span className="text-gray-400">or</span>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="text-purple-600 hover:text-purple-700"
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
        />
      )}
    </div>
  );
};