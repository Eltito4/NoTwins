import React from 'react';
import { Dress, User } from '../types';
import { AlertTriangle } from 'lucide-react';

interface DuplicateAlertsProps {
  dresses: Dress[];
  participants: Record<string, User>;
  currentUserId?: string;
  isEventCreator: boolean;
  compact?: boolean;
}

interface DuplicateGroup {
  name: string;
  items: Array<{
    id: string;
    userId: string;
    userName: string;
    color?: string;
  }>;
  type: 'exact' | 'partial';
}

export function DuplicateAlerts({ 
  dresses, 
  participants, 
  currentUserId, 
  isEventCreator,
  compact = false 
}: DuplicateAlertsProps) {
  const findDuplicates = () => {
    const duplicateGroups: DuplicateGroup[] = [];
    const processedNames = new Set<string>();

    dresses.forEach(dress => {
      const name = dress.name.toLowerCase();
      if (processedNames.has(name)) return;
      processedNames.add(name);

      const duplicates = dresses.filter(d => 
        d.name.toLowerCase() === name && 
        (isEventCreator || d.userId === currentUserId || dress.userId === currentUserId)
      );

      if (duplicates.length > 1) {
        // Group by color
        const itemsByColor = duplicates.reduce((acc, item) => {
          const color = (item.color || 'unknown').toLowerCase();
          if (!acc[color]) acc[color] = [];
          acc[color].push(item);
          return acc;
        }, {} as Record<string, Dress[]>);

        // Check for exact color matches
        Object.entries(itemsByColor).forEach(([color, items]) => {
          if (items.length > 1) {
            duplicateGroups.push({
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
          duplicateGroups.push({
            name,
            items: duplicates.map(item => ({
              id: item._id,
              userId: item.userId,
              userName: participants[item.userId]?.name || 'Unknown User',
              color: item.color
            })),
            type: 'partial'
          });
        }
      }
    });

    return duplicateGroups;
  };

  const duplicates = findDuplicates();
  if (duplicates.length === 0) return null;

  return (
    <div className={`space-y-2 ${compact ? 'px-4' : ''}`}>
      {duplicates.map((group, index) => (
        <div
          key={`${group.name}-${index}`}
          className={`flex items-start gap-2 p-2 rounded-lg ${
            group.type === 'exact' 
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          } ${compact ? 'text-sm' : ''}`}
        >
          <AlertTriangle 
            className={`flex-shrink-0 ${compact ? 'h-4 w-4' : 'h-5 w-5'} mt-0.5 ${
              group.type === 'exact' ? 'text-red-500' : 'text-amber-500'
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
              {isEventCreator ? (
                <>"{group.name}" - {group.items.length} items</>
              ) : (
                group.type === 'exact' ? 'Exact duplicate found' : 'Similar item found'
              )}
            </p>
            {(!compact || isEventCreator) && (
              <ul className={`mt-1 space-y-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span>{item.userName}</span>
                    {item.color && (
                      <>
                        <span className="text-gray-500">·</span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-current"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.color}</span>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}