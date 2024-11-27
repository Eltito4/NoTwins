import React from 'react';
import { Dress, User } from '../types';
import { AlertTriangle } from 'lucide-react';

interface DuplicateAlertsProps {
  dresses: Dress[];
  participants: Record<string, User>;
  currentUserId?: string;
  isEventCreator: boolean;
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

export function DuplicateAlerts({ dresses, participants, currentUserId, isEventCreator }: DuplicateAlertsProps) {
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
    <div className="space-y-3">
      {duplicates.map((group, index) => (
        <div
          key={`${group.name}-${index}`}
          className={`flex items-start gap-3 p-3 rounded-lg ${
            group.type === 'exact' 
              ? 'bg-red-50 text-red-800'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          <AlertTriangle 
            className={`flex-shrink-0 h-5 w-5 mt-0.5 ${
              group.type === 'exact' ? 'text-red-500' : 'text-amber-500'
            }`}
          />
          <div>
            <p className="font-medium">
              {group.type === 'exact' ? 'Exact duplicate found:' : 'Similar items found:'}
            </p>
            <p className="text-sm mt-1">
              "{group.name}" - {group.items.length} items
              {group.type === 'partial' && ' (different colors)'}
            </p>
            <ul className="mt-1 space-y-1">
              {group.items.map((item) => (
                <li key={item.id} className="text-sm flex items-center gap-2">
                  <span>{item.userName}</span>
                  {item.color && (
                    <>
                      <span className="text-gray-500">·</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full border border-current"
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
      ))}
    </div>
  );
}