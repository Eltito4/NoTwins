import React from 'react';
import { Dress } from '../types';
import { AlertTriangle, Lock, Eye, Trash2, Loader2, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DressCardProps {
  dress: Dress;
  hasConflict: boolean;
  isEventCreator: boolean;
  userName?: string;
  onImageLoad?: () => void;
  onDelete?: (dressId: string) => Promise<void>;
  duplicateInfo?: {
    type: 'exact' | 'partial';
    items: Array<{ userName: string; color?: string }>;
  };
}

export function DressCard({ 
  dress, 
  hasConflict, 
  isEventCreator, 
  userName, 
  onImageLoad,
  onDelete,
  duplicateInfo 
}: DressCardProps) {
  const { currentUser } = useAuth();
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isOwner = currentUser?.id === dress.userId;
  const canViewDetails = isOwner || !dress.isPrivate || isEventCreator;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    onImageLoad?.();
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error(`Failed to load image: ${dress.imageUrl}`);
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting || !isOwner) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this item? This action cannot be undone.'
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDelete(dress.id);
        toast.success('Item deleted successfully');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete item');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getRetailerName = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return null;
    }
  };

  const retailerName = dress.imageUrl ? getRetailerName(dress.imageUrl) : null;

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105">
      {(hasConflict || duplicateInfo) && (
        <div className={`absolute top-2 right-2 p-2 rounded-full shadow-lg z-10 group cursor-help ${
          duplicateInfo?.type === 'exact' ? 'bg-red-500' : 'bg-amber-500'
        }`}>
          <AlertTriangle size={20} className="text-white" />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 text-sm p-2 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            {duplicateInfo ? (
              <>
                <p className="font-medium">
                  {duplicateInfo.type === 'exact' ? 
                    'Exact duplicate found:' : 
                    'Similar items found:'
                  }
                </p>
                <ul className="mt-1">
                  {duplicateInfo.items.map((item, i) => (
                    <li key={i}>
                      {item.userName}
                      {item.color && ` (${item.color})`}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              "This item name exists in the event"
            )}
          </div>
        </div>
      )}

      {canViewDetails ? (
        <>
          <div className="aspect-square overflow-hidden bg-gray-100 relative">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}
            {!imageError ? (
              <img
                src={dress.imageUrl}
                alt={dress.name}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <p className="text-sm text-center px-4">
                  Image not available
                </p>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-lg font-semibold line-clamp-1">{dress.name}</p>
                {userName && (
                  <p className="text-sm text-gray-500">Added by {userName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-1 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Delete item"
                  >
                    {isDeleting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                )}
                {dress.isPrivate ? (
                  <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </div>
            {dress.brand && (
              <p className="text-sm text-gray-500 mb-2 line-clamp-1">Brand: {dress.brand}</p>
            )}
            {dress.price && (
              <p className="text-sm text-gray-500 mb-2">
                Price: ${dress.price.toFixed(2)}
              </p>
            )}
            {dress.type && (
              <p className="text-sm text-gray-500 mb-2 capitalize">
                Type: {dress.type}
              </p>
            )}
            {dress.color && (
              <div className="flex items-center mt-3 gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: dress.color }}
                  title={dress.color}
                />
                <span className="text-sm text-gray-500 capitalize line-clamp-1">{dress.color}</span>
              </div>
            )}
            {retailerName && (
              <div className="flex items-center mt-2 gap-2 text-gray-500">
                <Store size={16} />
                <span className="text-sm">{retailerName}</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
          <Lock className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-500">This item is private</p>
          <p className="text-sm text-gray-400 mt-1">Only visible to the owner{isEventCreator ? ' and event creator' : ''}</p>
        </div>
      )}
    </div>
  );
}