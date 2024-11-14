import React, { useState, useEffect } from 'react';
import { Event, Dress } from '../types';
import { PlusCircle, X, Users, Grid, BarChart, Lock, Eye } from 'lucide-react';
import { DressCard } from './DressCard';
import { DressScrapingModal } from './DressScrapingModal';
import { EventTrends } from './EventTrends';
import { addDressToEvent, getEventDresses, deleteDress } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onDressAdded: (dress: Dress) => void;
}

export function EventDetailsModal({ event, onClose, onDressAdded }: EventDetailsModalProps) {
  const [showScrapingModal, setShowScrapingModal] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'trends'>('grid');
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const isEventCreator = currentUser?.id === event.creatorId;

  const loadDresses = async () => {
    try {
      setLoading(true);
      const fetchedDresses = await getEventDresses(event.id, true);
      setDresses(fetchedDresses);
    } catch (error) {
      console.error('Error loading dresses:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDresses();
  }, [event.id]);

  const handleAddDress = async (dressData: Omit<Dress, 'id' | 'userId' | 'eventId'>) => {
    try {
      const newDress = await addDressToEvent(event.id, dressData);
      setDresses(prevDresses => [...prevDresses, newDress]);
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
      setDresses(prevDresses => prevDresses.filter(d => d.id !== dressId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting dress:', error);
      toast.error('Failed to delete item');
      throw error;
    }
  };

  const checkDuplicates = (dress: Dress) => {
    return dresses.some(d => 
      d.id !== dress.id && 
      d.name.toLowerCase() === dress.name.toLowerCase()
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{event.name}</h2>
            {isEventCreator && (
              <span className="text-sm text-purple-600">Event Creator</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b z-10">
            <div className="p-6 flex justify-between items-center">
              <div className="space-y-2">
                <p className="text-gray-600">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-600">{event.location}</p>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    <span>{event.participants.length} participants</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2" title="Public items">
                      <Eye size={18} className="text-green-500" />
                      <span>{dresses.filter(d => !d.isPrivate).length}</span>
                    </div>
                    <div className="flex items-center gap-2" title="Private items">
                      <Lock size={18} className="text-gray-400" />
                      <span>{dresses.filter(d => d.isPrivate).length}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('grid')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      activeView === 'grid'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Grid size={18} />
                    <span>Grid</span>
                  </button>
                  <button
                    onClick={() => setActiveView('trends')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      activeView === 'trends'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <BarChart size={18} />
                    <span>Trends</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowScrapingModal(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <PlusCircle size={20} />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading items...</p>
              </div>
            ) : activeView === 'grid' ? (
              dresses.length === 0 ? (
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
                  {dresses.map((dress) => (
                    <DressCard
                      key={dress.id}
                      dress={dress}
                      hasConflict={checkDuplicates(dress)}
                      isEventCreator={isEventCreator}
                      onDelete={handleDeleteDress}
                    />
                  ))}
                </div>
              )
            ) : (
              <EventTrends dresses={dresses} />
            )}
          </div>
        </div>
      </div>

      {showScrapingModal && (
        <DressScrapingModal
          onClose={() => setShowScrapingModal(false)}
          onSubmit={handleAddDress}
          isEventCreator={isEventCreator}
          existingItems={dresses}
        />
      )}
    </div>
  );
}