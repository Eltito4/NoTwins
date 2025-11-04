import React, { useState, useRef } from 'react';
import { Upload, ArrowLeft, Loader2, Eye, EyeOff, Camera, CheckCircle, AlertTriangle, HelpCircle, Link } from 'lucide-react';
import { analyzeGarmentImage } from '../services/visionService';
import { scrapeDressDetails } from '../services/scrapingService';
import { AVAILABLE_COLORS } from '../utils/colors/constants';
import { getAllCategories, getSubcategoryName } from '../utils/categorization';
import { formatPrice } from '../utils/currency';
import toast from 'react-hot-toast';

interface ImageUploadModalProps {
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

const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function ImageUploadModal({ onClose, onSubmit, isEventCreator, onBack }: ImageUploadModalProps) {
  const [inputMode, setInputMode] = useState<'photo' | 'url'>('photo');
  const [productUrl, setProductUrl] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = getAllCategories();

  // Debug logging
  React.useEffect(() => {
    console.log('Available categories:', categories);
    console.log('Available colors:', AVAILABLE_COLORS);
    console.log('Current form data:', formData);
  }, [categories, formData]);
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64Image = await convertBlobToBase64(file);
      setImageUrl(base64Image);
      await analyzeImage(base64Image);
    } catch (error) {
      toast.error('Failed to process image');
      console.error('File processing error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async (url: string) => {
    setAnalyzing(true);
    try {
      console.log('Starting image analysis...');
      const analysis = await analyzeGarmentImage(url);

      console.log('Analysis result:', analysis);

      // Validate analysis result
      if (!analysis || typeof analysis !== 'object') {
        throw new Error('Invalid analysis result received');
      }

      // Update form data with analysis results
      setFormData(prev => ({
        ...prev,
        name: analysis.name || '',
        brand: analysis.brand || '',
        color: analysis.color || '',
        description: analysis.description || '',
        category: analysis.type?.category || '',
        subcategory: analysis.type?.subcategory || '',
        price: analysis.price && !isNaN(analysis.price) ? analysis.price.toString() : ''
      }));

      // Set confidence score
      if (analysis.confidence?.overall) {
        setConfidence(analysis.confidence.overall);
      } else {
        setConfidence(0.8); // Default confidence
      }

      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze image: ' + (error.message || 'Unknown error'));

      // Set basic fallback data so form isn't empty
      setFormData(prev => ({
        ...prev,
        name: prev.name || 'Fashion Item',
        category: prev.category || 'clothes',
        subcategory: prev.subcategory || 'dresses'
      }));
      setConfidence(0.5);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUrlScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productUrl) {
      toast.error('Por favor ingresa una URL');
      return;
    }

    setLoading(true);
    setAnalyzing(true);
    try {
      console.log('Starting product scraping:', productUrl);
      const data = await scrapeDressDetails(productUrl);

      console.log('Scraped data:', data);

      // Set the image URL
      setImageUrl(data.imageUrl || '');

      // Update form data with scraped results
      setFormData({
        name: data.name || '',
        brand: data.brand || '',
        color: data.color || '',
        description: data.description || '',
        category: data.type?.category || 'clothes',
        subcategory: data.type?.subcategory || 'dresses',
        price: data.price ? data.price.toString() : ''
      });

      setConfidence(0.95); // High confidence for scraped data
      toast.success('¡Producto obtenido exitosamente!');
    } catch (error) {
      console.error('Scraping error:', error);
      // Error already handled in scrapeDressDetails
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    const missingFields = [];
    if (!imageUrl || !formData.name) {
      missingFields.push('name and image');
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

    console.log('Submitting form data:', formData);
    onSubmit({
      name: formData.name,
      imageUrl,
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

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="w-4 h-4" />;
    if (score >= 0.6) return <HelpCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
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
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold">
            {!imageUrl
              ? 'Agregar Artículo'
              : inputMode === 'url'
                ? 'Producto desde URL'
                : 'Artículo desde Foto'
            }
          </h2>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        {!imageUrl ? (
          <>
            {/* Mode Selector Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                type="button"
                onClick={() => setInputMode('photo')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  inputMode === 'photo'
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Camera size={20} />
                <span>Subir Foto</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  inputMode === 'url'
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Link size={20} />
                <span>Pegar URL</span>
              </button>
            </div>

            {/* Photo Upload Mode */}
            {inputMode === 'photo' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-600">
                  Haz clic para subir una foto o arrastra y suelta
                </p>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              /* URL Input Mode */
              <form onSubmit={handleUrlScrape} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del Producto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://www.zara.com/es/vestido-negro-p12345.html"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !productUrl}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Obteniendo...</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4" />
                          <span>Obtener</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    💡 Funciona con: Zara, Mango, H&M, y la mayoría de tiendas online
                  </p>
                </div>
              </form>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="aspect-square w-full max-w-md mx-auto relative rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
              {confidence !== null && (
                <div className={`absolute top-2 right-2 px-3 py-1.5 rounded-full border ${getConfidenceColor(confidence)} flex items-center gap-1.5 shadow-lg backdrop-blur-sm`}>
                  {getConfidenceIcon(confidence)}
                  <span className="text-sm font-medium">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              )}
              {imageError && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-3 mx-auto">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Error al cargar imagen</p>
                    <p className="text-xs mt-1">La imagen no se pudo mostrar correctamente</p>
                  </div>
                </div>
              )}
              {(loading || analyzing) && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="mt-2 font-medium">{analyzing ? 'IA Analizando Imagen...' : 'Procesando Imagen...'}</p>
                    {analyzing && (
                      <p className="mt-1 text-sm text-gray-300">Detectando tipo de ropa, color y marca</p>
                    )}
                  </div>
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
                <label className="block text-sm font-medium text-gray-700">
                  Marca
                  {!formData.brand && (
                    <span className="ml-2 text-xs text-amber-600 font-normal">
                      (Ingresar manualmente)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Ej: Zara, Mango, H&M..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
                {!formData.brand && (
                  <p className="mt-1 text-xs text-gray-500">
                    💡 La mayoría de vestidos no tienen logos visibles
                  </p>
                )}
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
                    <option disabled>Cargando categorías...</option>
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
                    <option disabled>Cargando colores...</option>
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
                  placeholder="0.00"
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
        {imageUrl && (
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