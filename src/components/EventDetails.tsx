import React from 'react';
import { Event, Dress, User } from '../types';
import { PlusCircle } from 'lucide-react';
import { DressCard } from './DressCard';
import { DressScrapingModal } from './DressScrapingModal';
import { DuplicateAlerts } from './DuplicateAlerts';
import { addDressToEvent, deleteDress } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface EventDetailsProps {
  event: Event;
  onBack: () => void;
  onDressAdded: (dress: Dress) => void;
  participants: Record<string, User>;
}

export function EventDetails({ event, onBack, onDressAdded, participants }: EventDetailsProps) {
  const [showScrapingModal, setShowScrapingModal] = React.useState(false);
  const { currentUser } = useAuth();
  const isEventCreator = currentUser?.id === event.creatorId;

  const handleAddDress = async (dressData: Omit<Dress, '_id' | 'id' | 'userId' | 'eventId'>) => {
    try {
      const newDress = await addDressToEvent(event.id, dressData);
      onDressAdded(newDress);
      setShowScrapingModal(false);
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding dress:', error);
      toast.error('Failed to add item');
    }
  };

  const handleDeleteDress = async (dressId: string) => {
    try {
      await deleteDress(dressId);
      onDressAdded(event.dresses.find(d => d._id === dressId)!);
    } catch (error) {
      console.error('Error deleting dress:', error);
      toast.error('Failed to delete item');
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            Back
          </button>
          <h2 className="text-2xl font-bold">{event.name}</h2>
        </div>
        <button
          onClick={() => setShowScrapingModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusCircle size={20} />
          <span>Add Item</span>
        </button>
      </div>

      <DuplicateAlerts
        dresses={event.dresses}
        participants={participants}
        currentUserId={currentUser?.id}
        isEventCreator={isEventCreator}
      />

      {event.dresses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No items added yet</p>
          <button
            onClick={() => setShowScrapingModal(true)}
            className="text-purple-600 hover:text-purple-700"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {event.dresses.map((dress) => (
            <DressCard
              key={dress._id}
              dress={dress}
              isEventCreator={isEventCreator}
              userName={participants[dress.userId]?.name}
              onDelete={handleDeleteDress}
              compact={true}
            />
          ))}
        </div>
      )}

      {showScrapingModal && (
        <DressScrapingModal
          onClose={() => setShowScrapingModal(false)}
          onSubmit={handleAddDress}
          isEventCreator={isEventCreator}
        />
      )}
    </div>
  );
}