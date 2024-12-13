import React, { useState } from 'react';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { MessageInbox } from './messages/MessageInbox';

export function UserMenu() {
  const { currentUser, signOut } = useAuth();
  const { unreadCount } = useMessages();
  const [showInbox, setShowInbox] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setShowInbox(true)}
        className="relative p-2 text-gray-600 hover:text-gray-800"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2 text-gray-700">
        <UserIcon size={20} className="text-gray-500" />
        <span className="font-medium">{currentUser?.name}</span>
      </div>

      <button
        onClick={signOut}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      {showInbox && <MessageInbox onClose={() => setShowInbox(false)} />}
    </div>
  );
}