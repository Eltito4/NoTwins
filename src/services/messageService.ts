import api from '../lib/api';
import { Message, SendMessageData, BroadcastMessageData, DuplicateAlertData } from '../types';
import toast from 'react-hot-toast';

export async function sendDirectMessage(data: SendMessageData): Promise<Message> {
  try {
    console.log('Sending message with data:', data);
    const response = await api.post('/messages/direct', data);
    toast.success('Message sent successfully');
    return response.data;
  } catch (error) {
    console.error('Message send error:', error);
    toast.error('Failed to send message');
    throw error;
  }
}

export async function sendBroadcastMessage(data: BroadcastMessageData): Promise<any> {
  try {
    const response = await api.post(`/messages/broadcast/${data.eventId}`, {
      title: data.title,
      body: data.body,
      suggestedItemUrl: data.suggestedItemUrl
    });
    toast.success(`Broadcast sent to all participants`);
    return response.data;
  } catch (error) {
    toast.error('Failed to send broadcast message');
    throw error;
  }
}

export async function sendDuplicateAlert(data: DuplicateAlertData): Promise<Message> {
  try {
    const response = await api.post('/messages/duplicate-alert', data);
    toast.success('Duplicate alert sent');
    return response.data;
  } catch (error) {
    toast.error('Failed to send duplicate alert');
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
    if (!messageId || messageId === 'undefined') {
      throw new Error('Invalid message ID');
    }
    await api.put(`/messages/${messageId}/read`);
  } catch (error) {
    console.error('Failed to mark message as read:', error);
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  if (!messageId || messageId === 'undefined') {
    throw new Error('Invalid message ID');
  }
  
  try {
    await api.delete(`/messages/${messageId}`);
  } catch (error) {
    console.error('Failed to delete message:', error);
    throw error;
  }
}

export async function getUnreadMessageCount(): Promise<number> {
  try {
    const response = await api.get('/messages/unread-count');
    return response.data.count;
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
}