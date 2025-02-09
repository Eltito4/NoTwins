import React, { useState, useRef } from 'react';
import { Upload, ArrowLeft, Loader2, Eye, EyeOff, Camera, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { analyzeGarmentImage } from '../services/visionService';
import { AVAILABLE_COLORS } from '../utils/colorUtils';
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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
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
      const analysis = await analyzeGarmentImage(url);
      
      // Update form data with Gemini analysis results
      setFormData(prev => ({
        ...prev,
        name: analysis.name || '',
        brand: analysis.brand || '',
        color: analysis.color || '',
        description: analysis.description || '',
        category: analysis.type?.category || '',
        subcategory: analysis.type?.subcategory || '',
        price: analysis.price ? analysis.price.toString() : ''
      }));

      // Set confidence score
      if (analysis.confidence?.overall) {
        setConfidence(analysis.confidence.overall);
      }

      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSubmit({
      name: formData.name,
      imageUrl,
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
          <h2 className="text-xl font-semibold">Upload Item Photo</h2>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        {!imageUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600">
              Click to upload a photo or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="aspect-square w-full max-w-md mx-auto relative rounded-lg overflow-hidden bg-gray-100">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {confidence !== null && (
                <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-lg border ${getConfidenceColor(confidence)} flex items-center gap-1.5 shadow-lg`}>
                  {getConfidenceIcon(confidence)}
                  <span className="text-sm font-medium">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              )}
              {(loading || analyzing) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="mt-2">{analyzing ? 'Analyzing...' : 'Loading...'}</p>
                  </div>
                </div>
              )}
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
        {imageUrl && (
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