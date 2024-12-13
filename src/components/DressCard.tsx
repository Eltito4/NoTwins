import React, { useState } from 'react';
import { Dress } from '../types';
import { Lock, Eye, Trash2, Loader2, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryName, getSubcategoryName } from '../utils/categorization';
import { formatPrice } from '../utils/currency';
import toast from 'react-hot-toast';

interface DressCardProps {
  dress: Dress;
  isEventCreator: boolean;
  userName?: string;
  onDelete: (dressId: string) => Promise<void>;
  duplicateInfo?: {
    type: 'exact' | 'partial';
    items: Array<{ userName: string; color?: string }>;
  };
}

export function DressCard({ 
  dress,
  isEventCreator,
  userName,
  onDelete,
  duplicateInfo
}: DressCardProps) {
  const { currentUser } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUser?.id === dress.userId;
  const canViewDetails = isOwner || !dress.isPrivate || isEventCreator;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting || !isOwner) return;

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

  return (
    <div className="relative bg-[#CADFD9] rounded-xl shadow-lg overflow-visible transition-transform hover:scale-105">
      {duplicateInfo && (
        <div className="absolute -top-2 -right-2 z-30">
          <div className={`relative group`}>
            <div className={`p-2 rounded-full ${
              duplicateInfo.type === 'exact' 
                ? 'bg-[#FFEBE8] text-[#D84315] animate-bounce'
                : 'bg-[#FFEDC2] text-[#8D6E63]'
            } shadow-lg cursor-pointer transition-transform hover:scale-110`}>
              <Bell size={20} className={`${duplicateInfo.type === 'exact' ? 'animate-[ring_4s_ease-in-out_infinite]' : ''}`} />
            </div>
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
              <p className="font-medium text-gray-900">
                {duplicateInfo.type === 'exact' ? 'Identical item found!' : 'Similar item found'}
              </p>
              <ul className="mt-2 space-y-1.5">
                {duplicateInfo.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{item.userName}</span>
                    {item.color && (
                      <>
                        <span className="text-gray-400">·</span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-gray-200"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.color}</span>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-t-xl">
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
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {dress.brand && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-1">Brand: {dress.brand}</p>
              )}
              {dress.price && (
                <p className="text-sm text-gray-500 mb-2">
                  Price: {formatPrice(dress.price)}
                </p>
              )}
              {dress.type && (
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-sm text-gray-500">
                    Category: {getCategoryName(dress.type.category)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Type: {dress.type.name}
                  </p>
                </div>
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
    </div>
  );
}