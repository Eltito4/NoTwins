import { User } from './user';

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  title: string;
  body: string;
  suggestedItemUrl?: string;
  suggestedItemDetails?: {
    name: string;
    imageUrl: string;
    price?: number;
    color?: string;
  };
  createdAt: Date;
  readAt?: Date;
  relatedDressId?: string;
  from?: User;
  to?: User;
}

export interface MessageNotification {
  id: string;
  userId: string;
  messageId: string;
  read: boolean;
  createdAt: Date;
}

export interface SendMessageData {
  toUserId: string;
  title: string;
  body: string;
  suggestedItemUrl?: string;
  relatedDressId?: string;
}