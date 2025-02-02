import React, { useState, useRef } from 'react';
import { Upload, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { analyzeGarmentImage } from '../services/visionService';
import toast from 'react-hot-toast';

interface ImageUploadModalProps {
  onClose: () => void;
  onBack: () => void;
  onSubmit: (dressData: {
    name: string;
    imageUrl: string;
    description?: string;
    color?: string;
    brand?: string;
    type?: any;
    isPrivate: boolean;
  }) => void;
  isEventCreator: boolean;
}

export function ImageUploadModal({ onClose, onBack, onSubmit, isEventCreator }: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [itemName, setItemName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!previewUrl) return;

    setLoading(true);
    try {
      const result = await analyzeGarmentImage(previewUrl);
      setAnalysisResult(result);
      if (result.type?.name) {
        setItemName(result.type.name);
      }
      toast.success('Image analyzed successfully!');
    } catch (error) {
      toast.error('Failed to analyze image');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl || !itemName) {
      toast.error('Please provide a name for the item');
      return;
    }

    onSubmit({
      name: itemName,
      imageUrl: previewUrl,
      color: analysisResult?.color,
      brand: analysisResult?.brand,
      type: analysisResult?.type,
      isPrivate
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {!previewUrl ? (
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <Upload size={32} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports JPG, PNG, and WEBP
            </p>
          </div>
        ) : (
          <>
            <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-lg">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>

            {!analysisResult && (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white p-3 rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    <span>Analyze Image</span>
                  </>
                )}
              </button>
            )}

            {analysisResult && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {analysisResult.brand && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Brand
                    </label>
                    <p className="text-gray-900">{analysisResult.brand}</p>
                  </div>
                )}

                {analysisResult.color && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-200"
                        style={{ backgroundColor: analysisResult.color.toLowerCase() }}
                      />
                      <span className="text-gray-900">{analysisResult.color}</span>
                    </div>
                  </div>
                )}

                {analysisResult.type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <p className="text-gray-900">{analysisResult.type.name}</p>
                  </div>
                )}

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
          </>
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
        {analysisResult && (
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Add Item
          </button>
        )}
      </div>
    </form>
  );
}