import React from 'react';
import { Dress, User } from '../types';
import { Bell } from 'lucide-react';

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
  const [expandedGroup, setExpandedGroup] = React.useState<string | null>(null);

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
                    <li key={item.id} className="flex items-center gap-2 text-gray-600">
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
              )}
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}