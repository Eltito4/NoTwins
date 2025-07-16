import { FC, useState, useEffect } from 'react';
import { Event, Dress, User } from '../types';
import { PlusCircle, X, Grid, BarChart, Lock, Eye, History } from 'lucide-react';
import { DressCard } from './DressCard';
import { AddItemModal } from './AddItemModal';
import { EventTrends } from './EventTrends';
import { EventHistory } from './EventHistory';
import { DuplicateAlerts } from './DuplicateAlerts';
import { ParticipantsList } from './ParticipantsList';
import { addDressToEvent, getEventDresses, deleteDress } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onDressAdded: () => void;
  participants: Record<string, User>;
}

export const EventDetailsModal: FC<EventDetailsModalProps> = ({ event, onClose, onDressAdded, participants }) => {
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'trends' | 'history'>('grid');
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

  const handleAddDress = async (dressData: Omit<Dress, '_id' | 'id' | 'userId' | 'eventId'>) => {
    try {
      const newDress = await addDressToEvent(event.id, dressData);
      setDresses(prevDresses => [...prevDresses, newDress]);
      onDressAdded();
      setShowAddItemModal(false);
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding dress:', error);
      toast.error('Failed to add item');
    }
  };

  const handleDeleteDress = async (dressId: string) => {
    try {
      await deleteDress(dressId);
      setDresses(prevDresses => prevDresses.filter(d => d._id !== dressId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting dress:', error);
      toast.error('Failed to delete item');
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">{event.name}</h2>
            <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('es-ES')}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2 p-4 border-b">
          <button
            onClick={() => setActiveView('grid')}
            className={`p-2 rounded-lg flex items-center gap-2 ${
              activeView === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span>Vista de Cuadrícula</span>
          </button>
          <button
            onClick={() => setActiveView('trends')}
            className={`p-2 rounded-lg flex items-center gap-2 ${
              activeView === 'trends' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <BarChart className="w-5 h-5" />
            <span>Tendencias</span>
          </button>
          {isEventCreator && (
            <button
              onClick={() => setActiveView('history')}
              className={`p-2 rounded-lg flex items-center gap-2 ${
                activeView === 'history' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <History className="w-5 h-5" />
              <span>Historial</span>
            </button>
          )}
          <div className="flex-grow" />
          <button
            onClick={() => setShowAddItemModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-600"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Agregar Artículo</span>
          </button>
        </div>

        <div className="flex-grow overflow-auto p-4">
          {activeView === 'grid' && (
            <>
              <DuplicateAlerts
                dresses={dresses}
                participants={participants}
                currentUserId={currentUser?.id}
                isEventCreator={isEventCreator}
              />
              <div className="mt-4 space-y-3">
                {dresses.map(dress => (
                  <DressCard
                    key={dress._id}
                    dress={dress}
                    onDelete={handleDeleteDress}
                    isEventCreator={isEventCreator}
                    userName={participants[dress.userId]?.name}
                    compact={true}
                  />
                ))}
              </div>
            </>
          )}
          {activeView === 'trends' && <EventTrends dresses={dresses} />}
          {activeView === 'history' && (
            <EventHistory 
              dresses={dresses} 
              participants={participants}
            />
          )}
        </div>
      </div>

      {showAddItemModal && (
        <AddItemModal
          onClose={() => setShowAddItemModal(false)}
          onSubmit={handleAddDress}
          isEventCreator={isEventCreator}
        />
      )}
    </div>
  );
}