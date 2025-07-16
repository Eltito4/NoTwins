import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Users, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ParticipantsListProps {
  participants: Record<string, User>;
  creatorId: string;
  compact?: boolean;
}

export function ParticipantsList({ participants, creatorId, compact = false }: ParticipantsListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const isCreator = currentUser?.id === creatorId;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isCreator) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Users size={compact ? 16 : 18} />
        <span>{Object.keys(participants).length} participantes</span>
      </div>
    );
  }

  const participantsList = Object.values(participants);
  const creator = participantsList.find(p => p.id === creatorId);
  const otherParticipants = participantsList.filter(p => p.id !== creatorId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[#8D6E63] hover:text-[#D84315] transition-colors"
      >
        <Users size={compact ? 16 : 18} />
        <span>{participantsList.length} participantes</span>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-[#E57373] py-2 z-50">
          {creator && (
            <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-100">
              <Crown size={16} className="text-[#D84315]" />
              <span className="font-medium text-gray-900">{creator.name}</span>
              <span className="text-xs text-[#D84315] ml-auto">Creador</span>
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {otherParticipants.map(participant => (
              <div
                key={participant.id}
                className="px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className="text-gray-700">{participant.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}