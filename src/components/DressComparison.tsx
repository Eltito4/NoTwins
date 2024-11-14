import React from 'react';
import { Dress } from '../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DressComparisonProps {
  dresses: Dress[];
  selectedDress: Dress;
}

export function DressComparison({ dresses, selectedDress }: DressComparisonProps) {
  const conflicts = dresses.filter(dress => 
    dress.id !== selectedDress.id && (
      dress.color.toLowerCase() === selectedDress.color.toLowerCase() ||
      dress.style.toLowerCase() === selectedDress.style.toLowerCase()
    )
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Dress Comparison</h3>
      
      {conflicts.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={24} />
            <span className="font-medium">
              Found {conflicts.length} similar {conflicts.length === 1 ? 'dress' : 'dresses'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conflicts.map(dress => (
              <div key={dress.id} className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
                <img
                  src={dress.imageUrl}
                  alt={dress.description}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <p className="font-medium">{dress.style}</p>
                  <p className="text-sm text-gray-600">{dress.description}</p>
                  <div className="flex items-center mt-2 gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{ backgroundColor: dress.color }}
                    />
                    <span className="text-sm text-gray-500 capitalize">{dress.color}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle size={24} />
          <span className="font-medium">No similar dresses found!</span>
        </div>
      )}
    </div>
  );
}