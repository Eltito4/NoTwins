import React, { useState } from 'react';
import { X, Link, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { scrapeDressDetails } from '../services/scrapingService';
import { Dress } from '../types';
import toast from 'react-hot-toast';

interface DressScrapingModalProps {
  onClose: () => void;
  onSubmit: (itemData: {
    name: string;
    imageUrl: string;
    description?: string;
    color?: string;
    brand?: string;
    price?: number;
    isPrivate: boolean;
  }) => void;
  isEventCreator: boolean;
  existingItems?: Array<Dress & { userName?: string }>;
}

interface DuplicateInfo {
  type: 'exact' | 'partial';
  items: Array<{
    userName: string;
    color?: string;
  }>;
}

export function DressScrapingModal({ onClose, onSubmit, isEventCreator, existingItems = [] }: DressScrapingModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [scrapedData, setScrapedData] = useState<{
    name: string;
    imageUrl: string;
    description?: string;
    brand?: string;
    price?: number;
    color?: string;
  } | null>(null);

  const checkForDuplicates = (name: string, color?: string) => {
    const duplicates = existingItems.filter(item => 
      item.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicates.length > 0) {
      // Check for exact duplicates (same name and color)
      const exactDuplicates = color ? 
        duplicates.filter(d => d.color?.toLowerCase() === color.toLowerCase()) :
        [];

      if (exactDuplicates.length > 0) {
        return {
          type: 'exact' as const,
          items: exactDuplicates.map(d => ({
            userName: d.userName || 'Unknown User',
            color: d.color
          }))
        };
      }

      // If no exact duplicates but name matches exist
      return {
        type: 'partial' as const,
        items: duplicates.map(d => ({
          userName: d.userName || 'Unknown User',
          color: d.color
        }))
      };
    }

    return null;
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    setImageLoading(true);
    setImageError(false);
    setDuplicateInfo(null);
    
    try {
      const data = await scrapeDressDetails(url);
      setScrapedData(data);
      
      // Check for duplicates
      const duplicates = checkForDuplicates(data.name, data.color);
      setDuplicateInfo(duplicates);

      if (duplicates) {
        const message = duplicates.type === 'exact' ?
          'This exact item already exists in the event' :
          'An item with this name already exists in the event';
          
        toast.error(message, {
          icon: <AlertTriangle className="text-yellow-500" />,
          duration: 4000,
        });
      } else {
        toast.success('Product details fetched successfully!');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Failed to fetch product details. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapedData) return;

    try {
      onSubmit({
        ...scrapedData,
        isPrivate
      });
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item. Please try again.');
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error('Failed to load scraped image');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Add Item from URL</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleScrape} className="mt-6">
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Link size={20} />
                )}
                <span>Fetch</span>
              </button>
            </div>
          </form>
        </div>

        {scrapedData && (
          <form onSubmit={handleSave} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {duplicateInfo && (
                  <div className={`border-l-4 p-4 mb-4 ${
                    duplicateInfo.type === 'exact' ? 
                      'bg-red-50 border-red-400' : 
                      'bg-yellow-50 border-yellow-400'
                  }`}>
                    <div className="flex items-center">
                      <AlertTriangle className={`mr-3 ${
                        duplicateInfo.type === 'exact' ? 
                          'text-red-400' : 
                          'text-yellow-400'
                      }`} size={20} />
                      <div>
                        <p className={`text-sm ${
                          duplicateInfo.type === 'exact' ? 
                            'text-red-700' : 
                            'text-yellow-700'
                        }`}>
                          {duplicateInfo.type === 'exact' ? 
                            'This exact item already exists' : 
                            'Similar items found'
                          }
                        </p>
                        <ul className="mt-1 text-sm text-gray-600">
                          {duplicateInfo.items.map((item, index) => (
                            <li key={index}>
                              {item.userName}
                              {item.color && ` (${item.color})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-medium text-gray-700">Name:</label>
                  <p className="text-gray-900">{scrapedData.name}</p>
                </div>

                {scrapedData.brand && (
                  <div>
                    <label className="font-medium text-gray-700">Brand:</label>
                    <p className="text-gray-900">{scrapedData.brand}</p>
                  </div>
                )}

                {scrapedData.color && (
                  <div>
                    <label className="font-medium text-gray-700">Color:</label>
                    <p className="text-gray-900">{scrapedData.color}</p>
                  </div>
                )}

                {scrapedData.price && (
                  <div>
                    <label className="font-medium text-gray-700">Price:</label>
                    <p className="text-gray-900">${scrapedData.price.toFixed(2)}</p>
                  </div>
                )}

                <div>
                  <label className="font-medium text-gray-700 block mb-2">Preview:</label>
                  <div className="relative w-full h-64 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                      </div>
                    )}
                    {!imageError ? (
                      <img
                        src={scrapedData.imageUrl}
                        alt={scrapedData.name}
                        className={`w-full h-full object-contain transition-opacity duration-200 ${
                          imageLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <p className="text-sm text-center px-4">
                          Image preview not available
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      isPrivate
                        ? 'border-gray-300 text-gray-700'
                        : 'border-purple-500 text-purple-600'
                    }`}
                  >
                    {isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}
                    <span>{isPrivate ? 'Private' : 'Public'}</span>
                  </button>
                  <p className="text-sm text-gray-500">
                    {isPrivate
                      ? 'Only visible to you' + (isEventCreator ? ' and you as event creator' : '')
                      : 'Visible to all participants'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex-shrink-0">
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg text-white font-medium bg-green-500 hover:bg-green-600 transition-colors"
                >
                  Save Item
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}