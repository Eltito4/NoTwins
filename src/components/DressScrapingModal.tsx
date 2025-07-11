import React, { useState } from 'react';
import { Link, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { scrapeDressDetails } from '../services/scrapingService';
import { AVAILABLE_COLORS } from '../utils/colors';
import { getAllCategories, getSubcategoryName } from '../utils/categorization';
import { formatPrice } from '../utils/currency';
import { ScrapedProduct } from '../types';
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

export function DressScrapingModal({ onClose, onSubmit, isEventCreator, onBack }: DressScrapingModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingMessage, setFetchingMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '',
    brand: '',
    price: '',
    category: '',
    subcategory: ''
  });

  const categories = getAllCategories();

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    setFetchingMessage('Fetching product details... This may take a moment.');
    try {
      const data = await scrapeDressDetails(url);
      
      // Log the received data for debugging
      console.log('Received scraped data:', data);
      
      setScrapedData(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        color: data.color || '',
        brand: data.brand || '',
        price: data.price ? data.price.toString() : '',
        category: data.type?.category || 'clothes',
        subcategory: data.type?.subcategory || 'other'
      });
      
      // Log the form data for debugging
      console.log('Set form data:', {
        name: data.name || '',
        description: data.description || '',
        color: data.color || '',
        brand: data.brand || '',
        price: data.price ? data.price.toString() : '',
        category: data.type?.category || 'clothes',
        subcategory: data.type?.subcategory || 'other'
      });
      
      toast.success('Product details fetched successfully!');
    } catch (error) {
      // Error is already handled in scrapeDressDetails
    } finally {
      setLoading(false);
      setFetchingMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapedData) return;

    onSubmit({
      name: formData.name,
      imageUrl: scrapedData.imageUrl,
      description: formData.description,
      color: formData.color,
      brand: formData.brand,
      price: formData.price ? parseFloat(formData.price) : undefined,
      type: formData.category && formData.subcategory ? {
        category: formData.category,
        subcategory: formData.subcategory,
        name: getSubcategoryName(formData.category, formData.subcategory)
      } : undefined,
      isPrivate
    });
  };

  const handleImageError = () => {
    setImageError(true);
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
              pattern="https?://.*"
              title="Please enter a valid URL starting with http:// or https://"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
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
          {loading && fetchingMessage ? (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={16} />
                <p className="text-sm text-blue-700">{fetchingMessage}</p>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                We're analyzing the product page and extracting details...
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Enter a valid product URL from a supported retailer
            </p>
          )}
        </form>

        {scrapedData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {scrapedData.imageUrl && !scrapedData.imageUrl.includes('placeholder') ? (
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={scrapedData.imageUrl}
                  alt={scrapedData.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  onLoad={() => setImageError(false)}
                />
                {imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Image not available</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">No image available</p>
                  <p className="text-xs text-center mt-1">
                    Product details extracted successfully<br />
                    but image could not be retrieved
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subcategory: '' 
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.subcategory}
                  onChange={e => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                  disabled={!formData.category}
                >
                  <option value="">Select type</option>
                  {formData.category && categories
                    .find(c => c.id === formData.category)
                    ?.subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <select
                  value={formData.color}
                  onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="">Select color</option>
                  {AVAILABLE_COLORS.map(color => (
                    <option key={color.name} value={color.name}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  min="0"
                  step="0.01"
                  placeholder="Enter price in EUR"
                />
                {formData.price && (
                  <p className="mt-1 text-sm text-gray-600">
                    Price: {formatPrice(parseFloat(formData.price))}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                rows={3}
              />
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
          </form>
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