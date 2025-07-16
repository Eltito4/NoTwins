import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { Dress } from '../types';
import { AVAILABLE_COLORS } from '../utils/colors/constants';
import { getAllCategories, getSubcategoryName } from '../utils/categorization';

interface EditItemModalProps {
  dress: Dress;
  onClose: () => void;
  onSubmit: (updatedData: Partial<Dress>) => void;
}

export function EditItemModal({ dress, onClose, onSubmit }: EditItemModalProps) {
  const [formData, setFormData] = useState({
    name: dress.name || '',
    description: dress.description || '',
    color: dress.color || '',
    brand: dress.brand || '',
    price: dress.price ? dress.price.toString() : '',
    category: dress.type?.category || '',
    subcategory: dress.type?.subcategory || '',
    isPrivate: dress.isPrivate || false
  });

  const categories = getAllCategories();
  const currentCategorySubcategories = formData.category 
    ? categories.find(c => c.id === formData.category)?.subcategories || []
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    // Validate and format price
    let finalPrice = dress.price;
    if (formData.price) {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        alert('Por favor ingresa un precio válido');
        return;
      }
      finalPrice = Math.round(priceValue * 100) / 100;
    }

    const updatedData: Partial<Dress> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
      brand: formData.brand.trim(),
      price: finalPrice,
      isPrivate: formData.isPrivate
    };

    // Update type if category/subcategory changed
    if (formData.category && formData.subcategory) {
      updatedData.type = {
        category: formData.category,
        subcategory: formData.subcategory,
        name: getSubcategoryName(formData.category, formData.subcategory)
      };
    }

    onSubmit(updatedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Editar Artículo</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Preview */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <img
                  src={dress.imageUrl}
                  alt={dress.name}
                  className="w-full h-full object-cover rounded-lg bg-gray-100"
                />
                {dress.isPrivate && (
                  <div className="absolute top-2 right-2 bg-gray-900/70 text-white p-1 rounded-full">
                    <Eye size={12} />
                  </div>
                )}
              </div>
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
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={formData.subcategory}
                  onChange={e => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
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
                >
                  <option value="">Seleccionar color</option>
                  {AVAILABLE_COLORS.map(color => (
                    <option key={color.name} value={color.name}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio (€)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
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
                onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  formData.isPrivate
                    ? 'border-gray-300 text-gray-700'
                    : 'border-primary text-primary'
                }`}
              >
                {formData.isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}
                <span>{formData.isPrivate ? 'Privado' : 'Público'}</span>
              </button>
              <p className="text-sm text-gray-500">
                {formData.isPrivate
                  ? 'Solo visible para ti y el creador del evento'
                  : 'Visible para todos los participantes'}
              </p>
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}