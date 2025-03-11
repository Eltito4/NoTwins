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

  const getGeminiStatusColor = () => {
    if (loading) return 'text-yellow-500';
    if (!status?.gemini) return 'text-red-500';
    return status.gemini.initialized && status.gemini.hasApiKey ? 'text-green-500' : 'text-red-500';
  };

  const getGeminiStatusTooltip = () => {
    if (loading) return 'Gemini API: Connecting...';
    if (!status?.gemini) return 'Gemini API: Connection Error';
    if (!status.gemini.hasApiKey) return 'Gemini API: Missing API Key';
    return status.gemini.initialized ? 'Gemini API: Connected' : 'Gemini API: Connection Error';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Sparkles
          size={18}
          className={`${getGeminiStatusColor()} ${loading ? 'animate-spin' : ''}`}
          aria-label={getGeminiStatusTooltip()}
          title={getGeminiStatusTooltip()}
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