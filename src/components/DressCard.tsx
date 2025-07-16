import React from 'react';
import { Eye, EyeOff, Trash2, Lock, Edit } from 'lucide-react';
import { Dress } from '../types';
import { formatPrice } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DressCardProps {
  dress: Dress;
  onDelete?: (dressId: string) => Promise<void>;
  onEdit?: (dress: Dress) => void;
  isEventCreator: boolean;
  userName?: string;
  compact?: boolean;
}

export function DressCard({ dress, onDelete, onEdit, isEventCreator, userName, compact = false }: DressCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const { currentUser } = useAuth();

  const isOwner = dress.userId === currentUser?.id;
  const canView = !dress.isPrivate || isOwner || isEventCreator;
  const canEdit = isOwner;
  const canDelete = isOwner || isEventCreator;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer.'
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDelete(dress._id);
        toast.success('Artículo eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Error al eliminar artículo');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(dress);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex gap-4">
        <div className={`relative flex-shrink-0 ${!canView ? 'filter blur-sm' : ''}`}>
          {canView ? (
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
          ) : (
            <div className={`rounded-lg bg-gray-200 flex items-center justify-center ${
              compact ? 'w-24 h-24' : 'w-32 h-32'
            }`}>
              <Lock className="text-gray-400" size={compact ? 20 : 24} />
            </div>
          )}
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
                {canView ? dress.name : '••••••••••'}
              </h3>
              {userName && (
                <p className="text-sm text-gray-500 mt-0.5">Agregado por {userName}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canEdit && onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-1 text-blue-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                  title="Editar artículo"
                >
                  <Edit size={compact ? 16 : 18} />
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                  title="Eliminar artículo"
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

          <div className={`mt-2 grid grid-cols-2 gap-x-4 gap-y-1 ${!canView ? 'filter blur-sm' : ''}`}>
            {dress.brand && (
              <div className="text-sm text-gray-600 truncate">
                <span className="font-medium">Marca:</span> {canView ? dress.brand : '••••••'}
              </div>
            )}
            {dress.price && (
              <div className="text-sm text-gray-600 truncate">
                <span className="font-medium">Precio:</span> {canView ? formatPrice(dress.price) : '••••••'}
              </div>
            )}
            {dress.type && (
              <div className="text-sm text-gray-600 truncate">
                <span className="font-medium">Tipo:</span> {canView ? dress.type.name : '••••••'}
              </div>
            )}
            {dress.color && (
              <div className="text-sm text-gray-600 truncate flex items-center gap-1">
                <span className="font-medium">Color:</span>
                {canView ? (
                  <>
                    <div
                      className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: dress.color }}
                    />
                    {dress.color}
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0 bg-gray-300" />
                    ••••••
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}