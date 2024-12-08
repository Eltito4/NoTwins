import React, { useState } from 'react';
import { Event, DuplicateInfo, User } from '../types';
import { Calendar, MapPin, Users, Share2, Check, Copy, Trash2, AlertTriangle, AlertCircle, Eye, Lock } from 'lucide-react';
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
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
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

  // Rest of the component code remains the same until the alerts section

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
              {exactDuplicates.map((dup, idx) => (
                <div
                  key={`exact-${idx}`}
                  className="relative"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedAlert(expandedAlert === `exact-${idx}` ? null : `exact-${idx}`);
                    }}
                    className="w-full flex items-start gap-2 bg-red-50 p-2 rounded-lg text-left"
                  >
                    <AlertTriangle 
                      size={18} 
                      className="flex-shrink-0 mt-0.5 text-red-500 animate-[ring_4s_ease-in-out_infinite]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-600">
                        "{dup.name}" - {dup.items.length} items (same color)
                      </p>
                      {expandedAlert === `exact-${idx}` && (
                        <ul className="mt-1 space-y-1 text-xs text-gray-600">
                          {dup.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-center gap-2">
                              <span>{formatUserInfo(item)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </button>
                </div>
              ))}
              
              {partialDuplicates.map((dup, idx) => (
                <div
                  key={`partial-${idx}`}
                  className="relative"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedAlert(expandedAlert === `partial-${idx}` ? null : `partial-${idx}`);
                    }}
                    className="w-full flex items-start gap-2 bg-amber-50 p-2 rounded-lg text-left"
                  >
                    <AlertCircle 
                      size={18} 
                      className="flex-shrink-0 mt-0.5 text-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-600">
                        "{dup.name}" - {dup.items.length} items (different colors)
                      </p>
                      {expandedAlert === `partial-${idx}` && (
                        <ul className="mt-1 space-y-1 text-xs text-gray-600">
                          {dup.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-center gap-2">
                              <span>{formatUserInfo(item)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rest of the component remains the same */}
      </div>
    </div>
  );
}