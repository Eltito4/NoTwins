export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Dress {
  _id: string; // MongoDB ID
  id: string; // Client-side ID
  userId: string;
  eventId: string;
  name: string;
  imageUrl: string;
  description?: string;
  color?: string;
  brand?: string;
  price?: number;
  type?: string;
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
  type?: string;
}