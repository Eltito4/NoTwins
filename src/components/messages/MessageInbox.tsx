import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, X, Trash2, Bell, MessageSquare, Users } from 'lucide-react';
import { useMessages } from '../../contexts/MessageContext';
import { deleteMessage } from '../../services/messageService';
import toast from 'react-hot-toast';

interface MessageInboxProps {
  onClose: () => void;
}

export function MessageInbox({ onClose }: MessageInboxProps) {
  const { messages, markAsRead, loadMessages } = useMessages();

  const handleDelete = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await deleteMessage(messageId);
      await loadMessages();
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'event_broadcast':
        return <Users size={16} className="text-blue-500" />;
      case 'duplicate_alert':
        return <Bell size={16} className="text-red-500" />;
      case 'direct_message':
        return <MessageSquare size={16} className="text-green-500" />;
      default:
        return <MessageSquare size={16} className="text-gray-500" />;
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'event_broadcast':
        return 'Difusión del Evento';
      case 'duplicate_alert':
        return 'Alerta de Duplicado';
      case 'direct_message':
        return 'Mensaje Directo';
      default:
        return 'Mensaje';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Mensajes</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aún no hay mensajes
            </div>
          ) : (
            <div className="divide-y">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`p-4 ${!message.isRead ? 'bg-primary/5' : ''} hover:bg-gray-50 transition-colors`}
                  onClick={() => markAsRead(message.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getMessageIcon(message.type)}
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {getMessageTypeLabel(message.type)}
                        </span>
                        {message.event && (
                          <span className="text-xs text-gray-400">
                            • {message.event.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium truncate">{message.title}</h3>
                      <p className="text-sm text-gray-500">
                        From: {message.from?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                      <button
                        onClick={(e) => handleDelete(message.id, e)}
                        className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-red-50"
                        title="Delete message"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-gray-600 line-clamp-2">{message.body}</p>
                  
                  {/* Duplicate Alert Info */}
                  {message.type === 'duplicate_alert' && message.duplicateInfo && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2">
                        {message.duplicateInfo.duplicateType === 'exact' ? 'Exact Match' : 'Similar Items'}
                      </h4>
                      <div className="space-y-1">
                        {message.duplicateInfo.conflictingItems.map((item, index) => (
                          <div key={index} className="text-sm text-red-700">
                            <span className="font-medium">{item.userName}</span>: {item.itemName}
                            {item.color && <span className="text-red-600"> ({item.color})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Suggested Item */}
                  {message.suggestedItemUrl && message.suggestedItemDetails && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Suggested Alternative</h4>
                        <a
                          href={message.suggestedItemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-600 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>View Item</span>
                          <ExternalLink size={16} />
                        </a>
                      </div>
                      <div className="flex gap-4">
                        <img
                          src={message.suggestedItemDetails.imageUrl}
                          alt={message.suggestedItemDetails.name}
                          className="w-20 h-20 object-cover rounded"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-medium">{message.suggestedItemDetails.name}</p>
                          {message.suggestedItemDetails.brand && (
                            <p className="text-sm text-gray-600">
                              Brand: {message.suggestedItemDetails.brand}
                            </p>
                          )}
                          {message.suggestedItemDetails.price && (
                            <p className="text-sm text-gray-600">
                              Price: €{message.suggestedItemDetails.price}
                            </p>
                          )}
                          {message.suggestedItemDetails.color && (
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: message.suggestedItemDetails.color }}
                              />
                              <span className="text-sm text-gray-600">
                                {message.suggestedItemDetails.color}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}