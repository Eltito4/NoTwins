import React, { useState } from 'react';
import { X, Link, Loader2, Eye, EyeOff } from 'lucide-react';
import { scrapeDressDetails } from '../services/scrapingService';
import { Dress } from '../types';
import { AVAILABLE_COLORS, findClosestNamedColor, normalizeColorName } from '../utils/colorUtils';
import toast from 'react-hot-toast';

interface DressScrapingModalProps {
  onClose: () => void;
  onSubmit: (dressData: Omit<Dress, '_id' | 'id' | 'userId' | 'eventId'>) => void;
  isEventCreator: boolean;
  existingItems?: Dress[];
}

interface ScrapedData {
  name: string;
  imageUrl: string;
  color?: string;
  brand?: string;
  price?: number;
  description?: string;
  type?: string;
}

export function DressScrapingModal({ onClose, onSubmit, isEventCreator }: DressScrapingModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showColorSelect, setShowColorSelect] = useState(false);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const data = await scrapeDressDetails(url);
      
      // Handle color detection
      if (data.color) {
        const detectedColor = findClosestNamedColor(data.color);
        if (detectedColor) {
          setSelectedColor(detectedColor);
        } else {
          setShowColorSelect(true);
        }
      } else {
        setShowColorSelect(true);
      }
      
      setScrapedData(data);
      toast.success('Product details fetched successfully!');
    } catch (error) {
      // Error is already handled in scrapeDressDetails
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapedData) return;

    if (!selectedColor && showColorSelect) {
      toast.error('Please select a color');
      return;
    }

    onSubmit({
      name: scrapedData.name,
      imageUrl: scrapedData.imageUrl,
      description: scrapedData.description,
      color: selectedColor || scrapedData.color,
      brand: scrapedData.brand,
      price: scrapedData.price,
      type: scrapedData.type,
      isPrivate
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6 border-b">
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
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
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

              <div>
                <label className="font-medium text-gray-700">Color:</label>
                {showColorSelect ? (
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select a color</option>
                    {AVAILABLE_COLORS.map(color => (
                      <option key={color.name} value={color.name}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: AVAILABLE_COLORS.find(c => c.name === selectedColor)?.value }}
                    />
                    <span className="text-gray-900">{selectedColor}</span>
                    <button
                      type="button"
                      onClick={() => setShowColorSelect(true)}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {scrapedData.price && (
                <div>
                  <label className="font-medium text-gray-700">Price:</label>
                  <p className="text-gray-900">${scrapedData.price.toFixed(2)}</p>
                </div>
              )}

              <div>
                <label className="font-medium text-gray-700 block mb-2">Preview:</label>
                <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-lg">
                  <img
                    src={scrapedData.imageUrl}
                    alt={scrapedData.name}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
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

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add Item
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}