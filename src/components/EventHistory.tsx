import React from 'react';
import { Dress, User } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingBag, Lock, Eye } from 'lucide-react';

interface EventHistoryProps {
  dresses: Dress[];
  participants: Record<string, User>;
}

export function EventHistory({ dresses, participants }: EventHistoryProps) {
  const sortedDresses = [...dresses].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Historial de Actividad</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {sortedDresses.map((dress, dressIdx) => {
            const user = participants[dress.userId];
            const timeAgo = formatDistanceToNow(new Date(dress.createdAt || 0), { addSuffix: true });

            return (
              <li key={dress._id}>
                <div className="relative pb-8">
                  {dressIdx !== sortedDresses.length - 1 && (
                    <span
                      className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                        <ShoppingBag className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{user?.name || 'Unknown User'}</span>
                        <p className="mt-0.5 text-gray-500">
                          Agregó "{dress.name}"
                          <span className="mx-1">·</span>
                          {timeAgo}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                          <img
                            src={dress.imageUrl}
                            alt={dress.name}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium text-gray-900">{dress.name}</div>
                          {dress.brand && (
                            <div className="text-sm text-gray-500">Marca: {dress.brand}</div>
                          )}
                          {dress.color && (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-4 w-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: dress.color }}
                              />
                              <span className="text-sm text-gray-500">{dress.color}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-500">
                            {dress.isPrivate ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="text-sm">
                              {dress.isPrivate ? 'Privado' : 'Público'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}