import React, { useState } from 'react';
import { Event, DuplicateInfo, User } from '../types';
import { Calendar, MapPin, Users, Share2, Check, Copy, Trash2, AlertTriangle, Eye, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface EventCardProps {
  event: Event;
  onClick: () => void;
  onDelete?: () => void;
  duplicates?: DuplicateInfo[];
  participants: Record<string, User>;
}

export function EventCard({ event, onClick, onDelete, duplicates = [], participants }: EventCardProps) {
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentUser } = useAuth();

  const isCreator = currentUser?.id === event.creatorId;

  const userDuplicates = duplicates.filter(dup => 
    dup.items.some(item => item.userId === currentUser?.id) ||
    (isCreator && dup.items.length > 0)
  );

  const exactDuplicates = userDuplicates.filter(d => d.type === 'exact');
  const partialDuplicates = userDuplicates.filter(d => d.type === 'partial');

  const formatUserInfo = (item: { userId: string; color?: string }) => {
    const user = participants[item.userId];
    const userName = user?.name || 'Unknown User';
    return `${userName}${item.color ? ` - ${item.color}` : ''}`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/join/${event.shareId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${event.name}`,
          text: `Join my event "${event.name}" using the event ID: ${event.shareId}`,
          url: shareUrl
        });
      } catch (err) {
        await copyToClipboard(shareUrl);
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(event.shareId);
      toast.success('Event ID copied to clipboard!');
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      toast.error('Failed to copy event ID');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this event? This action cannot be undone.'
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDelete();
        toast.success('Event deleted successfully');
      } catch (error) {
        toast.error('Failed to delete event');
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const privateItems = event.dresses.filter(d => d.isPrivate).length;
  const publicItems = event.dresses.filter(d => !d.isPrivate).length;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-transform hover:scale-105"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{event.name}</h3>
          {isCreator && (
            <span className="text-sm text-purple-600">Event Creator</span>
          )}
          
          {userDuplicates.length > 0 && (
            <div className="mt-2 space-y-2">
              {exactDuplicates.length > 0 && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Exact duplicates found:</p>
                    <ul className="mt-1 space-y-1">
                      {exactDuplicates.map(dup => (
                        <li key={dup.name}>
                          "{dup.name}" ({dup.items.length} items, same color)
                          <ul className="ml-4 text-xs text-gray-600">
                            {dup.items.map(item => (
                              <li key={item.id}>
                                {formatUserInfo(item)}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {partialDuplicates.length > 0 && (
                <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Similar items found:</p>
                    <ul className="mt-1 space-y-1">
                      {partialDuplicates.map(dup => (
                        <li key={dup.name}>
                          "{dup.name}" ({dup.items.length} items, different colors)
                          <ul className="ml-4 text-xs text-gray-600">
                            {dup.items.map(item => (
                              <li key={item.id}>
                                {formatUserInfo(item)}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCreator && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50"
              title="Delete event"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={handleShare}
            className="p-2 text-purple-600 hover:text-purple-700 transition-colors rounded-lg hover:bg-purple-50"
            title="Share event"
          >
            {showShareSuccess ? (
              <Check size={20} className="text-green-500" />
            ) : (
              <Share2 size={20} />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={18} />
          <span>{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={18} />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <Users size={18} />
            <span>{event.participants.length} participants</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title="Public items">
              <Eye size={18} className="text-green-500" />
              <span>{publicItems}</span>
            </div>
            <div className="flex items-center gap-2" title="Private items">
              <Lock size={18} className="text-gray-400" />
              <span>{privateItems}</span>
            </div>
          </div>
        </div>
        {event.description && (
          <p className="text-gray-600 text-sm mt-2">{event.description}</p>
        )}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Event ID:</span>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-2 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors group"
            >
              <code className="text-sm">{event.shareId}</code>
              {showCopySuccess ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-gray-400 group-hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}