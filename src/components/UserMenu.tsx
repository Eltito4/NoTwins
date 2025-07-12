import React, { useState } from 'react';
import { LogOut, User as UserIcon, Bell, Activity, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { MessageInbox } from './messages/MessageInbox';
import { useVisionStatus } from '../hooks/useVisionStatus';

export function UserMenu() {
  const { currentUser, signOut } = useAuth();
  const { hasUnreadMessages } = useMessages();
  const [showInbox, setShowInbox] = useState(false);
  const { status, loading } = useVisionStatus();

  const getVisionStatusColor = () => {
    if (loading) return 'text-yellow-500';
    if (!status) return 'text-red-500';
    return status.status === 'ok' ? 'text-green-500' : 'text-red-500';
  };

  const getVisionStatusTooltip = () => {
    if (loading) return 'Vision API: Connecting...';
    if (!status) return 'Vision API: Connection Error';
    return status.status === 'ok' ? 'Vision API: Connected' : 'Vision API: Connection Error';
  };

  const getGrokStatusColor = () => {
    if (loading) return 'text-yellow-500';
    if (!status?.grok) return 'text-red-500';
    return status.grok.initialized && status.grok.hasApiKey ? 'text-green-500' : 'text-yellow-500';
  };

  const getGrokStatusTooltip = () => {
    if (loading) return 'Grok API: Connecting...';
    if (!status?.grok) return 'Grok API: Connection Error';
    if (!status.grok.hasApiKey) return 'Grok API: Missing API Key';
    if (status.grok.error) return `Grok API: ${status.grok.error}`;
    return status.grok.initialized ? 'Grok API: Connected' : 'Grok API: Not Initialized';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Sparkles
          size={18}
          className={`${getGrokStatusColor()} ${loading ? 'animate-spin' : ''}`}
          aria-label={getGrokStatusTooltip()}
          title={getGrokStatusTooltip()}
        />
        <Activity 
          size={18} 
          className={`${getVisionStatusColor()} ${loading ? 'animate-spin' : ''}`}
          aria-label={getVisionStatusTooltip()}
          title={getVisionStatusTooltip()}
        />
        <button
          onClick={() => setShowInbox(true)}
          className="relative p-1.5 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          aria-label="Messages"
        >
          <Bell size={18} />
          {hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          )}
        </button>
      </div>

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

      {showInbox && (
        <MessageInbox 
          onClose={() => setShowInbox(false)} 
        />
      )}
    </div>
  );
}