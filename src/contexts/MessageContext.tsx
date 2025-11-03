import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../types';
import { getUserMessages, markMessageAsRead, getUnreadMessageCount } from '../services/messageService';
import { useAuth } from './AuthContext';

interface MessageContextType {
  unreadCount: number;
  messages: Message[];
  loadMessages: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  hasUnreadMessages: boolean;
  refreshUnreadCount: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | null>(null);

// Optimized polling configuration
const BASE_POLL_INTERVAL = 60000; // 60 seconds (reduced from 30)
const MAX_POLL_INTERVAL = 300000; // 5 minutes max backoff

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pollInterval, setPollInterval] = useState(BASE_POLL_INTERVAL);
  const previousUnreadCount = useRef(0);
  const { currentUser } = useAuth();

  const loadMessages = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userMessages = await getUserMessages();
      setMessages(userMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [currentUser]);

  const refreshUnreadCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const count = await getUnreadMessageCount();
      setUnreadCount(count);

      // Exponential backoff: if count hasn't changed, increase poll interval
      if (count === previousUnreadCount.current && count === 0) {
        setPollInterval(prev => Math.min(prev * 1.5, MAX_POLL_INTERVAL));
      } else if (count !== previousUnreadCount.current) {
        // Reset to base interval if there are new messages
        setPollInterval(BASE_POLL_INTERVAL);
      }

      previousUnreadCount.current = count;
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  }, [currentUser]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, readAt: new Date(), isRead: true } : msg
        )
      );
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (currentUser) {
      loadMessages();
      refreshUnreadCount();

      // Only poll for unread count (lighter query), not all messages
      const interval = setInterval(() => {
        refreshUnreadCount();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [currentUser, pollInterval, loadMessages, refreshUnreadCount]);

  const hasUnreadMessages = unreadCount > 0;

  return (
    <MessageContext.Provider value={{ 
      messages, 
      unreadCount, 
      loadMessages, 
      markAsRead,
      hasUnreadMessages,
      refreshUnreadCount
    }}>
      {children}
    </MessageContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};