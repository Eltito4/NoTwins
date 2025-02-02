import React from 'react';
import { Bell } from 'lucide-react';
import { useMessages } from '../../contexts/MessageContext';

export function MessageNotification() {
  const { unreadCount } = useMessages();

  if (unreadCount === 0) return null;

  return (
    <div className="relative">
      <Bell className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
        {unreadCount}
      </span>
    </div>
  );
}