import { useState } from 'react';
import { X, Link, Loader2, Eye, EyeOff } from 'lucide-react';
import { scrapeDressDetails } from '../services/scrapingService';
import { ScrapedProduct } from '../types';
import { ProductType } from '../utils/categorization/types';
import { detectProductType } from '../utils/categorization/detector';
import { getCategoryName, getSubcategoryName, getAllCategories } from '../utils/categorization';
import { formatPrice } from '../utils/currency';
import { AVAILABLE_COLORS } from '../utils/colorUtils';
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
    type?: ProductType;
    isPrivate: boolean;
  }) => void;
  isEventCreator: boolean;
}

export function DressScrapingModal({ onClose, onSubmit, isEventCreator }: DressScrapingModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

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
      const type = detectProductType(data.name + ' ' + (data.description || ''));
      setScrapedData(data);
      setSelectedType(type);
      setSelectedCategory(type.category);
      setSelectedSubcategory(type.subcategory);
      if (data.color) {
        setSelectedColor(data.color);
      }
      toast.success('Product details fetched successfully!');
    } catch (error) {
      // Error is already handled in scrapeDressDetails
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapedData || !selectedType) return;

    onSubmit({
      name: scrapedData.name,
      imageUrl: scrapedData.imageUrl,
      description: scrapedData.description,
      color: selectedColor || scrapedData.color,
      brand: scrapedData.brand,
      price: scrapedData.price,
      type: selectedType,
      isPrivate
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedSubcategory('');
    setSelectedType(null);
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subcategory = e.target.value;
    setSelectedSubcategory(subcategory);
    if (selectedCategory && subcategory) {
      setSelectedType({
        category: selectedCategory,
        subcategory: subcategory,
        name: getSubcategoryName(selectedCategory, subcategory)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
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
                className="bg-[#FFAB91] text-white px-4 py-2 rounded-lg hover:bg-[#E57373] disabled:opacity-50 flex items-center gap-2"
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
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <h3 className="text-xl font-semibold mb-4">{scrapedData.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={selectedSubcategory}
                      onChange={handleSubcategoryChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                      disabled={!selectedCategory}
                    >
                      <option value="">Select type</option>
                      {selectedCategory && categories
                        .find(c => c.id === selectedCategory)
                        ?.subcategories.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Color</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select a color</option>
                      {AVAILABLE_COLORS.map((color) => (
                        <option key={color.name} value={color.name}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {scrapedData.brand && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Brand</label>
                      <p className="mt-1 text-gray-900">{scrapedData.brand}</p>
                    </div>
                  )}

                  {scrapedData.price && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Price</label>
                      <p className="mt-1 text-gray-900">{formatPrice(scrapedData.price)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Preview</label>
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

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4 flex-shrink-0">
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