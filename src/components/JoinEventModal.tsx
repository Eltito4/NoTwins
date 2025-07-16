import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface JoinEventModalProps {
  onClose: () => void;
  onJoin: (shareId: string) => Promise<void>;
}

export function JoinEventModal({ onClose, onJoin }: JoinEventModalProps) {
  const [shareId, setShareId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareId.trim()) {
      toast.error('Please enter an event ID');
      return;
    }

    setLoading(true);
    try {
      await onJoin(shareId.trim().toUpperCase());
      toast.success('Successfully joined the event!');
      onClose();
    } catch (error) {
      toast.error('Failed to join event. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Unirse a Evento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ID del Evento</label>
            <input
              type="text"
              value={shareId}
              onChange={(e) => setShareId(e.target.value.toUpperCase())}
              placeholder="Ingresa el ID del evento (ej. ABC123)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 uppercase"
              maxLength={6}
              required
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500">
              Ingresa el ID de 6 caracteres que te compartieron
            </p>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              <span>Unirse al Evento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}