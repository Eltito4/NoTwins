import React, { useState } from 'react';
import { X, Link, Loader2 } from 'lucide-react';
import { sendDirectMessage } from '../../services/messageService';
import { scrapeDressDetails } from '../../services/scrapingService';
import { useMessages } from '../../contexts/MessageContext';
import toast from 'react-hot-toast';

interface MessageComposerProps {
  toUserId: string;
  userName: string;
  eventId: string;
  onClose: () => void;
  relatedDressIds?: string[];
  multipleUsers?: Array<{userId: string, userName: string}>;
}

export function MessageComposer({ toUserId, userName, eventId, onClose, relatedDressIds, multipleUsers }: MessageComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [suggestedItemUrl, setSuggestedItemUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [scrapedItem, setScrapedItem] = useState<any>(null);
  const { loadMessages } = useMessages();

  const handleScrapeUrl = async () => {
    if (!suggestedItemUrl) return;

    setScrapingUrl(true);
    try {
      const item = await scrapeDressDetails(suggestedItemUrl);
      setScrapedItem(item);
      toast.success('Item details fetched successfully!');
    } catch (error) {
      toast.error('Failed to fetch item details');
    } finally {
      setScrapingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (multipleUsers && multipleUsers.length > 0) {
        // Send to multiple users
        const promises = multipleUsers.map(user => 
          sendDirectMessage({
            toUserId: user.userId,
            eventId,
            title: title.trim(),
            body: body.trim(),
            suggestedItemUrl: suggestedItemUrl || undefined,
            relatedDressIds
          })
        );
        await Promise.all(promises);
        toast.success(`Message sent to ${multipleUsers.length} users`);
      } else {
        // Send to single user
        await sendDirectMessage({
          toUserId,
          eventId,
          title: title.trim(),
          body: body.trim(),
          suggestedItemUrl: suggestedItemUrl || undefined,
          relatedDressIds
        });
      }

      await loadMessages();
      onClose();
    } catch (error) {
      // Error already handled in service
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {multipleUsers && multipleUsers.length > 0 
              ? `Send Message to ${multipleUsers.length} Users`
              : `Send Message to ${userName}`
            }
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {multipleUsers && multipleUsers.length > 0 && (
          <div className="p-4 bg-blue-50 border-b">
            <p className="text-sm text-blue-700 font-medium">Sending to:</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {multipleUsers.map(user => (
                <span key={user.userId} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {user.userName}
                </span>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Message subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Your message..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suggested Alternative (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={suggestedItemUrl}
                onChange={(e) => setSuggestedItemUrl(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={handleScrapeUrl}
                disabled={!suggestedItemUrl || scrapingUrl}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {scrapingUrl ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Link size={16} />
                )}
              </button>
            </div>
          </div>

          {scrapedItem && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">{scrapedItem.name}</h3>
              <div className="flex gap-4">
                <img
                  src={scrapedItem.imageUrl}
                  alt={scrapedItem.name}
                  className="w-20 h-20 object-cover rounded"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col gap-2">
                  {scrapedItem.brand && (
                    <p className="text-sm text-gray-600">Brand: {scrapedItem.brand}</p>
                  )}
                  {scrapedItem.price && (
                    <p className="text-sm text-gray-600">Price: ${scrapedItem.price}</p>
                  )}
                  {scrapedItem.color && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: scrapedItem.color }}
                      />
                      <span className="text-sm text-gray-600">{scrapedItem.color}</span>
                    </div>
                  )}
                  {scrapedItem.type && (
                    <p className="text-sm text-gray-600">
                      Type: {scrapedItem.type.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}