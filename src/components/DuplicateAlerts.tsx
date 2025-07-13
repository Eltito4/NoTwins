import React from 'react';
import { Dress, User } from '../types';
import { Bell, Mail, Users, Lightbulb } from 'lucide-react';
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
  const [expandedGroup, setExpandedGroup] = React.useState<string | null>(null);
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
    <div className={`space-y-2 ${compact ? 'px-4' : ''}`}>
      {duplicates.map((group, index) => (
        <div
          key={`${group.name}-${index}`}
          className={`relative ${
            group.type === 'exact' 
              ? 'bg-red-50'
              : 'bg-amber-50'
          } rounded-lg p-3`}
        >
          <button
            onClick={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
            className="w-full flex items-start gap-2 text-left"
          >
            <Bell 
              className={`flex-shrink-0 ${compact ? 'h-4 w-4' : 'h-5 w-5'} mt-0.5 ${
                group.type === 'exact' 
                  ? 'text-red-500 animate-[ring_4s_ease-in-out_infinite]' 
                  : 'text-amber-500'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${compact ? 'text-sm' : ''}`}>
                "{group.name}" - {group.items.length} items
                {group.type === 'exact' ? ' (same color)' : ' (different colors)'}
              </p>
              {expandedGroup === group.name && (
                <ul className={`mt-2 space-y-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-gray-600">
                      <div className="flex items-center gap-2">
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
                      </div>
                      {isEventCreator && item.userId !== currentUserId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessageToUser({ userId: item.userId, userName: item.userName });
                          }}
                          className="p-1 text-primary hover:text-primary-600 transition-colors"
                          title="Send message"
                        >
                          <Mail size={16} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              
              {/* AI Suggestions Button */}
              {expandedGroup === group.name && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const userItem = group.items.find(item => item.userId === currentUserId);
                      if (userItem) {
                        setShowSuggestions({ dressId: userItem.id, dressName: group.name });
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                  >
                    <Lightbulb size={16} />
                    <span>Get AI Suggestions</span>
                  </button>
                </div>
              )}
              
              {isEventCreator && expandedGroup === group.name && group.items.length > 1 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const usersToMessage = group.items
                        .filter(item => item.userId !== currentUserId)
                        .map(item => ({ userId: item.userId, userName: item.userName }));
                      setMessageToMultiple(usersToMessage);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                  >
                    <Users size={16} />
                    <span>Message All Users</span>
                  </button>
                </div>
              )}
            </div>
          </button>
        </div>
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
