import api from '../lib/api';
import { Message, SendMessageData } from '../types/message';
import toast from 'react-hot-toast';

export async function sendMessage(data: SendMessageData): Promise<Message> {
  try {
    const response = await api.post('/messages', data);
    toast.success('Message sent successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to send message');
    throw error;
  }
}

export async function getUserMessages(): Promise<Message[]> {
  try {
    const response = await api.get('/messages');
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch messages');
    throw error;
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    await api.put(`/messages/${messageId}/read`);
  } catch (error) {
    console.error('Failed to mark message as read:', error);
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  if (!messageId) {
    throw new Error('Message ID is required');
  }
  
  try {
    await api.delete(`/messages/${messageId}`);
  } catch (error) {
    console.error('Failed to delete message:', error);
    throw error;
  }
}