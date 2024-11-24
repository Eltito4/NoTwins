import React from 'react';
import { Event, Dress, User } from '../types';
import { PlusCircle } from 'lucide-react';
import { DressCard } from './DressCard';
import { DressScrapingModal } from './DressScrapingModal';
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

  const getDuplicateInfo = (dress: Dress) => {
    const duplicates = event.dresses.filter(d => 
      d._id !== dress._id && 
      d.name.toLowerCase() === dress.name.toLowerCase()
    );

    if (duplicates.length === 0) return undefined;

    // Group by color
    const itemsByColor = duplicates.reduce((acc, item) => {
      const color = (item.color || 'unknown').toLowerCase();
      if (!acc[color]) {
        acc[color] = [];
      }
      acc[color].push(item);
      return acc;
    }, {} as Record<string, Dress[]>);

    // Check if current user is involved
    const isUserInvolved = duplicates.some(d => d.userId === currentUser?.id);
    
    if (!isUserInvolved && !isEventCreator) return undefined;

    // Check for exact color matches
    const exactMatches = itemsByColor[dress.color?.toLowerCase() || 'unknown'] || [];
    
    if (exactMatches.length > 0) {
      return {
        type: 'exact' as const,
        items: exactMatches.map(item => ({
          userName: participants[item.userId]?.name || 'Unknown User',
          color: item.color
        }))
      };
    }

    // Return partial matches
    return {
      type: 'partial' as const,
      items: duplicates.map(item => ({
        userName: participants[item.userId]?.name || 'Unknown User',
        color: item.color
      }))
    };
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {event.dresses.map((dress) => {
            const duplicateInfo = getDuplicateInfo(dress);
            return (
              <DressCard
                key={dress._id}
                dress={dress}
                hasConflict={Boolean(duplicateInfo)}
                isEventCreator={isEventCreator}
                userName={participants[dress.userId]?.name}
                onDelete={handleDeleteDress}
                duplicateInfo={duplicateInfo}
              />
            );
          })}
        </div>
      )}

      {showScrapingModal && (
        <DressScrapingModal
          onClose={() => setShowScrapingModal(false)}
          onSubmit={handleAddDress}
          isEventCreator={isEventCreator}
          existingItems={event.dresses}
        />
      )}
    </div>
  );
}