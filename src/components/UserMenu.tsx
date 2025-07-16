import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, Bell, Activity, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { MessageInbox } from './messages/MessageInbox';
import { useVisionStatus } from '../hooks/useVisionStatus';

export function UserMenu() {
  const { currentUser, signOut } = useAuth();
  const { hasUnreadMessages } = useMessages();
  const [showInbox, setShowInbox] = useState(false);


  const handleSignOut = () => {
    signOut();
  };


  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setShowInbox(true)}
        className="relative p-1.5 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
        aria-label="Mensajes"
      >
        <Bell size={18} />
        {hasUnreadMessages && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
        )}
      </button>

      <div className="flex items-center gap-2 text-gray-700">
        <UserIcon size={20} className="text-gray-500" />
        <span className="font-medium">{currentUser?.name}</span>
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <LogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>

      {showInbox && (
        <MessageInbox 
          onClose={() => setShowInbox(false)} 
        />
      )}
    </div>
  );
}