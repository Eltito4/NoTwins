import React, { useState } from 'react';
import { Link, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { scrapeDressDetails } from '../services/scrapingService';
import { AVAILABLE_COLORS } from '../utils/colors/constants';
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

  // Debug logging
  React.useEffect(() => {
    console.log('Scraping modal - Available categories:', categories);
    console.log('Scraping modal - Available colors:', AVAILABLE_COLORS);
  }, [categories]);
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
        category: data.type?.category || 'accessories',
        subcategory: data.type?.subcategory || 'shoes'
      });
      
      // Log the form data for debugging
      console.log('Set form data:', {
        name: data.name || '',
        description: data.description || '',
        color: data.color || '',
        brand: data.brand || '',
        price: data.price ? data.price.toString() : '',
        category: data.type?.category || 'accessories',
        subcategory: data.type?.subcategory || 'shoes'
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

    // Validation checks
    const missingFields = [];
    if (!formData.name) {
      missingFields.push('name');
    }
    if (!formData.color) {
      missingFields.push('color');
    }
    if (!formData.category || !formData.subcategory) {
      missingFields.push('category and type');
    }
    if (!formData.brand) {
      missingFields.push('brand');
    }
    
    if (missingFields.length > 0) {
      toast.error(`⚠️ Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    // Validate and format price
    let finalPrice = undefined;
    if (formData.price) {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        toast.error('Please enter a valid price');
        return;
      }
      // Round to 2 decimal places
      finalPrice = Math.round(priceValue * 100) / 100;
    }
    onSubmit({
      name: formData.name,
      imageUrl: scrapedData.imageUrl,
      description: formData.description,
      color: formData.color,
      brand: formData.brand,
      price: finalPrice,
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

  // Get current category subcategories
  const currentCategorySubcategories = formData.category 
    ? categories.find(c => c.id === formData.category)?.subcategories || []
    : [];
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
          <h2 className="text-xl font-semibold">Agregar Artículo desde URL</h2>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <form onSubmit={handleScrape} className="mb-6">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/producto"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              required
              disabled={loading}
              pattern="https?://.*"
              title="Por favor ingresa una URL válida que comience con http:// o https://"
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
              <span>Obtener</span>
            </button>
          </div>
          {loading && fetchingMessage ? (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={16} />
                <p className="text-sm text-blue-700">Obteniendo detalles del producto... Esto puede tomar un momento.</p>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Estamos analizando la página del producto y extrayendo detalles...
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Ingresa una URL válida de producto de una tienda compatible
            </p>
          )}
        </form>

        {scrapedData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
              {scrapedData.imageUrl && !scrapedData.imageUrl.includes('placeholder') ? (
                <img
                  src={scrapedData.imageUrl}
                  alt={scrapedData.name}
                  className="w-full h-full object-cover rounded-lg"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  onLoad={() => setImageError(false)}
                />
              ) : null}
              
              {(imageError || !scrapedData.imageUrl || scrapedData.imageUrl.includes('placeholder')) && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">
                    {imageError ? 'Image failed to load' : 'No image available'}
                  </p>
                  <p className="text-xs text-center mt-1">
                    {imageError 
                      ? 'The image URL was found but failed to load'
                      : 'Product details extracted successfully but image could not be retrieved'
                    }
                  </p>
                  {scrapedData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(scrapedData.imageUrl, '_blank')}
                      className="mt-2 text-xs text-primary hover:text-primary-600 underline"
                    >
                      Try opening image in new tab
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Marca</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
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
                  <option value="">Seleccionar categoría</option>
                  {categories && categories.length > 0 ? categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  )) : (
                    <option disabled>Loading categories...</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={formData.subcategory}
                  onChange={e => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                  disabled={!formData.category}
                >
                  <option value="">Seleccionar tipo</option>
                  {currentCategorySubcategories.map(sub => (
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
                  <option value="">Seleccionar color</option>
                  {AVAILABLE_COLORS && AVAILABLE_COLORS.length > 0 ? AVAILABLE_COLORS.map(color => (
                    <option key={color.name} value={color.name}>
                      {color.name}
                    </option>
                  )) : (
                    <option disabled>Loading colors...</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  min="0"
                  step="0.01"
                  max="99999.99"
                  placeholder="Ingresa el precio en EUR"
                />
                {formData.price && (
                  <p className="mt-1 text-sm text-gray-600">
                    Precio: €{parseFloat(formData.price).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
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
                <span>{isPrivate ? 'Privado' : 'Público'}</span>
              </button>
              <p className="text-sm text-gray-500">
                {isPrivate
                  ? 'Solo visible para ti' + (isEventCreator ? ' y para ti como creador del evento' : '')
                  : 'Visible para todos los participantes'}
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
          Cancelar
        </button>
        {scrapedData && (
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Agregar Artículo
          </button>
        )}
      </div>
    </div>
  );
}