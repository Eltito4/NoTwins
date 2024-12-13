import React, { useState } from 'react';
import { X, Link, Loader2 } from 'lucide-react';
import { scrapeDressDetails } from '../../services/scrapingService';
import { sendMessage } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../contexts/MessageContext';
import toast from 'react-hot-toast';

interface MessageComposerProps {
  toUserId: string;
  userName: string;
  relatedDressId?: string;
  onClose: () => void;
}

export function MessageComposer({ toUserId, userName, relatedDressId, onClose }: MessageComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [suggestedUrl, setSuggestedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrapedItem, setScrapedItem] = useState<any>(null);
  const { loadMessages } = useMessages();

  const handleScrape = async () => {
    if (!suggestedUrl) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const details = await scrapeDressDetails(suggestedUrl);
      setScrapedItem(details);
      toast.success('Item details fetched successfully');
    } catch (error) {
      console.error('Failed to fetch item details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await sendMessage({
        toUserId,
        title,
        body,
        suggestedItemUrl: suggestedUrl,
        relatedDressId
      });
      await loadMessages();
      onClose();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Message to {userName}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-200"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-200"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Suggest Alternative Item</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="url"
                  value={suggestedUrl}
                  onChange={(e) => setSuggestedUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-200"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleScrape}
                  disabled={loading}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Link />}
                  <span>Fetch</span>
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

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                <span>Send Message</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}