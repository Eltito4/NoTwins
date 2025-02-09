import React, { useState } from 'react';
import { X, Link, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { scrapeDressDetails } from '../services/scrapingService';
import { AVAILABLE_COLORS } from '../utils/colorUtils';
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
  const [isPrivate, setIsPrivate] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
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
    try {
      const data = await scrapeDressDetails(url);
      setScrapedData(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        color: data.color || '',
        brand: data.brand || '',
        price: data.price ? data.price.toString() : '',
        category: data.type?.category || '',
        subcategory: data.type?.subcategory || ''
      });
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
          <p className="mt-2 text-sm text-gray-500">
            Enter a valid product URL from a supported retailer
          </p>
        </form>

        {scrapedData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="aspect-square w-full max-w-md mx-auto relative rounded-lg overflow-hidden bg-gray-100">
              <img
                src={scrapedData.imageUrl}
                alt={scrapedData.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            </div>

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
                />
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