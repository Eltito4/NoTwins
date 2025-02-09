import React from 'react';
import { Eye, EyeOff, Trash2, Lock } from 'lucide-react';
import { Dress } from '../types';
import { formatPrice } from '../utils/currency';
import toast from 'react-hot-toast';

interface DressCardProps {
  dress: Dress;
  onDelete?: (dressId: string) => Promise<void>;
  isEventCreator: boolean;
  userName?: string;
  compact?: boolean;
}

export function DressCard({ dress, onDelete, isEventCreator, userName, compact = false }: DressCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this item? This action cannot be undone.'
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDelete(dress._id);
        toast.success('Item deleted successfully');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete item');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={dress.imageUrl}
            alt={dress.name}
            className={`rounded-lg object-cover bg-gray-100 ${
              compact ? 'w-24 h-24' : 'w-32 h-32'
            }`}
            onError={handleImageError}
            style={{
              objectFit: imageError ? 'contain' : 'cover'
            }}
          />
          {dress.isPrivate && (
            <div className="absolute top-2 right-2 bg-gray-900/70 text-white p-1 rounded-full">
              <Lock size={14} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
                {dress.name}
              </h3>
              {userName && (
                <p className="text-sm text-gray-500 mt-0.5">Added by {userName}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                  title="Delete item"
                >
                  <Trash2 size={compact ? 16 : 18} />
                </button>
              )}
              {dress.isPrivate ? (
                <EyeOff size={compact ? 16 : 18} className="text-gray-400" />
              ) : (
                <Eye size={compact ? 16 : 18} className="text-gray-400" />
              )}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {dress.brand && (
              <div className="text-sm text-gray-600 truncate">
                <span className="font-medium">Brand:</span> {dress.brand}
              </div>
            )}
            {dress.price && (
              <div className="text-sm text-gray-600 truncate">
                <span className="font-medium">Price:</span> {formatPrice(dress.price)}
              </div>
            )}
            {dress.type && (
              <div className="text-sm text-gray-600 truncate">
                <span className="font-medium">Type:</span> {dress.type.name}
              </div>
            )}
            {dress.color && (
              <div className="text-sm text-gray-600 truncate flex items-center gap-1">
                <span className="font-medium">Color:</span>
                <div
                  className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: dress.color }}
                />
                {dress.color}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}