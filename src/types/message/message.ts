import { User } from '../user';
import { MessageItemDetails } from './details';

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