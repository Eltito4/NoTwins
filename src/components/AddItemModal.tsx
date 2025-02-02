import React, { useState } from 'react';
import { X, Link, Upload, ShoppingBag, Camera, Loader2 } from 'lucide-react';
import { DressScrapingModal } from './DressScrapingModal';
import { ImageUploadModal } from './ImageUploadModal';

interface AddItemModalProps {
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
}

export function AddItemModal({ onClose, onSubmit, isEventCreator }: AddItemModalProps) {
  const [mode, setMode] = useState<'select' | 'url' | 'image'>('select');

  const handleBack = () => {
    setMode('select');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Add New Item</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>

        {mode === 'select' ? (
          <div className="p-8">
            <div className="space-y-6">
              <button
                onClick={() => setMode('url')}
                className="w-full flex items-center gap-4 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20">
                  <ShoppingBag size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-lg mb-1">Planning to buy it?</h3>
                  <p className="text-gray-600">
                    Add an item from a website URL to check if someone else is planning to buy the same piece
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode('image')}
                className="w-full flex items-center gap-4 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20">
                  <Camera size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-lg mb-1">Already have it?</h3>
                  <p className="text-gray-600">
                    Upload a photo of your item and let AI help you identify and catalog it
                  </p>
                </div>
              </button>
            </div>
          </div>
        ) : mode === 'url' ? (
          <DressScrapingModal
            onClose={onClose}
            onSubmit={onSubmit}
            isEventCreator={isEventCreator}
            onBack={handleBack}
          />
        ) : (
          <ImageUploadModal
            onClose={onClose}
            onSubmit={onSubmit}
            isEventCreator={isEventCreator}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}