import React, { useState } from 'react';
import { Dress, User } from '../types';
import { Bell, Mail, Users, Lightbulb, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { MessageComposer } from './messages/MessageComposer';
import { SuggestionModal } from './suggestions/SuggestionModal';

interface DuplicateAlertsProps {
  dresses: Dress[];
  participants: Record<string, User>;
  currentUserId?: string;
  isEventCreator: boolean;
  compact?: boolean;
}

export function DuplicateAlerts({ 
  dresses, 
  participants, 
  currentUserId, 
  isEventCreator,
  compact = false 
}: DuplicateAlertsProps) {
  const [messageToUser, setMessageToUser] = React.useState<{userId: string, userName: string} | null>(null);
  const [messageToMultiple, setMessageToMultiple] = React.useState<Array<{userId: string, userName: string}> | null>(null);
  const [showSuggestions, setShowSuggestions] = React.useState<{dressId: string, dressName: string} | null>(null);

  const findDuplicates = () => {
    const duplicateGroups = new Map<string, {
      name: string;
      items: Array<{
        id: string;
        userId: string;
        userName: string;
        color?: string;
      }>;
      type: 'exact' | 'partial';
    }>();

    dresses.forEach(dress => {
      const name = dress.name.toLowerCase();
      const duplicates = dresses.filter(d => 
        d._id !== dress._id && 
        d.name.toLowerCase() === name &&
        (isEventCreator || d.userId === currentUserId || dress.userId === currentUserId)
      );

      if (duplicates.length > 0) {
        // Create a unique key for this group
        const key = `${name}-${dress.color || 'nocolor'}`;
        
        if (!duplicateGroups.has(key)) {
          // Group by color
          const allItems = [dress, ...duplicates];
          const itemsByColor = allItems.reduce((acc, item) => {
            const color = (item.color || 'unknown').toLowerCase();
            if (!acc[color]) acc[color] = [];
            acc[color].push(item);
            return acc;
          }, {} as Record<string, Dress[]>);

          // Check for exact color matches
          Object.entries(itemsByColor).forEach(([color, items]) => {
            if (items.length > 1) {
              duplicateGroups.set(`${key}-exact`, {
                name,
                items: items.map(item => ({
                  id: item._id,
                  userId: item.userId,
                  userName: participants[item.userId]?.name || 'Unknown User',
                  color: item.color
                })),
                type: 'exact'
              });
            }
          });

          // Add partial matches if there are different colors
          if (Object.keys(itemsByColor).length > 1) {
            duplicateGroups.set(`${key}-partial`, {
              name,
              items: allItems.map(item => ({
                id: item._id,
                userId: item.userId,
                userName: participants[item.userId]?.name || 'Unknown User',
                color: item.color
              })),
              type: 'partial'
            });
          }
        }
      }
    });

    return Array.from(duplicateGroups.values());
  };

  const duplicates = findDuplicates();
  if (duplicates.length === 0) return null;

  return (
    <div className={`space-y-3 ${compact ? 'px-4' : ''}`}>
      {duplicates.map((group, index) => (
        <DuplicateAlert
          key={`${group.name}-${index}`}
          group={group}
          compact={compact}
          currentUserId={currentUserId}
          isEventCreator={isEventCreator}
          onMessageUser={setMessageToUser}
          onMessageMultiple={setMessageToMultiple}
          onShowSuggestions={setShowSuggestions}
        />
      ))}

      {messageToUser && (
        <MessageComposer
          toUserId={messageToUser.userId}
          userName={messageToUser.userName}
          eventId={dresses[0]?.eventId || ''}
          onClose={() => setMessageToUser(null)}
        />
      )}

      {messageToMultiple && (
        <MessageComposer
          toUserId=""
          userName=""
          eventId={dresses[0]?.eventId || ''}
          multipleUsers={messageToMultiple}
          onClose={() => setMessageToMultiple(null)}
        />
      )}

      {showSuggestions && (
        <SuggestionModal
          dressId={showSuggestions.dressId}
          dressName={showSuggestions.dressName}
          onClose={() => setShowSuggestions(null)}
        />
      )}
    </div>
  );
}

interface DuplicateAlertProps {
  group: any;
  compact: boolean;
  currentUserId?: string;
  isEventCreator: boolean;
  onMessageUser: (user: {userId: string, userName: string}) => void;
  onMessageMultiple: (users: Array<{userId: string, userName: string}>) => void;
  onShowSuggestions: (data: {dressId: string, dressName: string}) => void;
}

function DuplicateAlert({ 
  group, 
  compact, 
  currentUserId, 
  isEventCreator, 
  onMessageUser, 
  onMessageMultiple, 
  onShowSuggestions 
}: DuplicateAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isExact = group.type === 'exact';
  const alertStyles = isExact 
    ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-red-100' 
    : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 shadow-amber-100';
  
  const iconColor = isExact ? 'text-red-600' : 'text-amber-600';
  const textColor = isExact ? 'text-red-800' : 'text-amber-800';

  return (
    <div className={`${alertStyles} border-2 rounded-xl p-4 shadow-lg transition-all duration-200 hover:shadow-xl`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isExact ? (
            <AlertTriangle className={`h-6 w-6 ${iconColor} animate-pulse`} />
          ) : (
            <Bell className={`h-6 w-6 ${iconColor}`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>
                {isExact ? '🚨 ¡Duplicado Exacto!' : '⚠️ Artículos Similares'}
              </h3>
              <p className={`text-sm ${textColor} opacity-90 mt-1`}>
                <span className="font-semibold">"{group.name}"</span> - {group.items.length} artículos
                {isExact ? ' (mismo color)' : ' (colores diferentes)'}
              </p>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-full hover:bg-white/50 transition-colors ${textColor}`}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          
          {/* Quick preview of users */}
          <div className="mt-2 flex flex-wrap gap-1">
            {group.items.slice(0, 3).map((item: any, index: number) => (
              <span key={item.id} className="inline-flex items-center gap-1 bg-white/70 px-2 py-1 rounded-full text-xs font-medium">
                <div
                  className="w-2 h-2 rounded-full border border-gray-300"
                  style={{ backgroundColor: item.color || '#ccc' }}
                />
                {item.userName}
              </span>
            ))}
            {group.items.length > 3 && (
              <span className="inline-flex items-center bg-white/70 px-2 py-1 rounded-full text-xs font-medium">
                +{group.items.length - 3} más
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/50">
          {/* Detailed user list */}
          <div className="space-y-2 mb-4">
            {group.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: item.color || '#ccc' }}
                  />
                  <div>
                    <span className="font-medium text-gray-900">{item.userName}</span>
                    {item.color && (
                      <span className="text-sm text-gray-600 ml-2">• {item.color}</span>
                    )}
                  </div>
                </div>
                
                {isEventCreator && item.userId !== currentUserId && (
                  <button
                    onClick={() => onMessageUser({ userId: item.userId, userName: item.userName })}
                    className="p-2 text-primary hover:text-primary-600 hover:bg-white/70 rounded-lg transition-colors"
                    title="Enviar mensaje"
                  >
                    <Mail size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const userItem = group.items.find((item: any) => item.userId === currentUserId);
                if (userItem) {
                  onShowSuggestions({ dressId: userItem.id, dressName: group.name });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md font-medium"
            >
              <Lightbulb size={16} />
              <span>Obtener Sugerencias IA</span>
            </button>
            
            {isEventCreator && group.items.length > 1 && (
              <button
                onClick={() => {
                  const usersToMessage = group.items
                    .filter((item: any) => item.userId !== currentUserId)
                    .map((item: any) => ({ userId: item.userId, userName: item.userName }));
                  onMessageMultiple(usersToMessage);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:from-primary-600 hover:to-blue-700 transition-all shadow-md font-medium"
              >
                <Users size={16} />
                <span>Enviar Mensaje a Todos</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}