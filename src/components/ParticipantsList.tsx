import React, { useState } from 'react';
import { User } from '../types';
import { Users, Crown, ChevronDown, ChevronUp } from 'lucide-react';

interface ParticipantsListProps {
  participants: Record<string, User>;
  creatorId: string;
  compact?: boolean;
}

export function ParticipantsList({ participants, creatorId, compact = false }: ParticipantsListProps) {
  const [isOpen, setIsOpen] = useState(false);

  const participantsList = Object.values(participants);
  const creator = participantsList.find(p => p.id === creatorId);
  const otherParticipants = participantsList.filter(p => p.id !== creatorId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Users size={compact ? 16 : 18} />
        <span>{participantsList.length} participants</span>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
          {creator && (
            <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-100">
              <Crown size={16} className="text-amber-500" />
              <span className="font-medium text-gray-900">{creator.name}</span>
              <span className="text-xs text-purple-600 ml-auto">Creator</span>
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {otherParticipants.map(participant => (
              <div
                key={participant.id}
                className="px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="text-gray-900">{participant.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}