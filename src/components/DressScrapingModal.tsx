import React, { useState } from 'react';
import { X, Link, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { scrapeDressDetails } from '../services/scrapingService';
import { Dress } from '../types';
import toast from 'react-hot-toast';

interface DressScrapingModalProps {
  onClose: () => void;
  onSubmit: (dressData: {
    name: string;
    imageUrl: string;
    description?: string;
    color?: string;
    brand?: string;
    price?: number;
    type?: any;
    isPrivate: boolean;
  }) => void;
  isEventCreator: boolean;
  onBack: () => void;
}

interface ScrapedProduct {
  name: string;
  imageUrl: string;
  description?: string;
  color?: string;
  brand?: string;
  price?: number;
  type?: any;
}

export function DressScrapingModal({ onClose, onSubmit, isEventCreator, onBack }: DressScrapingModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const data = await scrapeDressDetails(url);
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

    onSubmit({
      name: scrapedData.name,
      imageUrl: scrapedData.imageUrl,
      description: scrapedData.description,
      color: scrapedData.color,
      brand: scrapedData.brand,
      price: scrapedData.price,
      type: scrapedData.type,
      isPrivate
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold">Add Item from URL</h2>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <form onSubmit={handleScrape} className="mb-6">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
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

        {scrapedData && (
          <div className="space-y-6">
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
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: scrapedData.color.toLowerCase() }}
                  />
                  <span className="text-gray-900">{scrapedData.color}</span>
                </div>
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
                    : 'border-primary text-primary'
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
        )}
      </div>

      <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        {scrapedData && (
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Add Item
          </button>
        )}
      </div>
    </div>
  );
}