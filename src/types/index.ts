import { ProductType } from '../utils/categorization/types';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Dress {
  _id: string;
  id: string;
  userId: string;
  eventId: string;
  name: string;
  imageUrl: string;
  description?: string;
  color?: string;
  brand?: string;
  price?: number;
  type?: ProductType;
  isPrivate: boolean;
  createdAt?: Date;
}

export interface DuplicateInfo {
  name: string;
  items: Array<{
    id: string;
    userId: string;
    userName: string;
    color?: string;
  }>;
  type: 'exact' | 'partial';
}

export interface Event {
  id: string;
  shareId: string;
  name: string;
  date: string;
  location: string;
  description?: string;
  creatorId: string;
  participants: string[];
  dresses: Dress[];
  createdAt?: Date;
}

export interface ScrapedProduct {
  name: string;
  imageUrl: string;
  color?: string;
  brand?: string;
  price?: number;
  description?: string;
  type?: ProductType;
}

// Message types
export interface MessageItemDetails {
  name: string;
  imageUrl: string;
  price?: number;
  color?: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  title: string;
  body: string;
  suggestedItemUrl?: string;
  suggestedItemDetails?: MessageItemDetails;
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