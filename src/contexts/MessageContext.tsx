import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message } from '../types/message';
import { getUserMessages, markMessageAsRead } from '../services/messageService';
import { useAuth } from './AuthContext';

interface MessageContextType {
  unreadCount: number;
  messages: Message[];
  loadMessages: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | null>(null);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { currentUser } = useAuth();

  const loadMessages = async () => {
    if (!currentUser) return;
    const userMessages = await getUserMessages();
    setMessages(userMessages);
  };

  const markAsRead = async (messageId: string) => {
    await markMessageAsRead(messageId);
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, readAt: new Date() } : msg
      )
    );
  };

  useEffect(() => {
    if (currentUser) {
      loadMessages();
      // Set up polling for new messages
      const interval = setInterval(loadMessages, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const unreadCount = messages.filter(msg => !msg.readAt).length;

  return (
    <MessageContext.Provider value={{ messages, unreadCount, loadMessages, markAsRead }}>
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