import React, { createContext, useContext, useState, useEffect } from 'react';
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

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  const loadMessages = async () => {
    if (!currentUser) return;
    try {
      const userMessages = await getUserMessages();
      setMessages(userMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const refreshUnreadCount = async () => {
    if (!currentUser) return;
    try {
      const count = await getUnreadMessageCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
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
  };

  useEffect(() => {
    if (currentUser) {
      loadMessages();
      refreshUnreadCount();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadMessages();
        refreshUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

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