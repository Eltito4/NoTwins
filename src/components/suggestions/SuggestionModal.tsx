import React, { useState, useEffect } from 'react';
import { X, Lightbulb, ShoppingBag, ExternalLink, Heart, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { getSuggestionsForDuplicate, trackSuggestionInteraction } from '../../services/suggestionService';
import toast from 'react-hot-toast';

interface Suggestion {
  type: 'color_alternative' | 'style_variation' | 'complementary' | 'coordination';
  title: string;
  description: string;
  item: {
    name: string;
    category: string;
    subcategory: string;
    color: string;
    style: string;
  };
  reasoning: string;
  searchTerms: string[];
  priority: number;
  realProducts?: {
    [key: string]: {
      label: string;
      priceRange: string;
      products: Array<{
        name: string;
        price: number;
        currency: string;
        retailer: string;
        url: string;
        image: string;
        inStock: boolean;
        rating: number;
        reviews: number;
      }>;
    };
  };
}

interface SuggestionModalProps {
  dressId: string;
  dressName: string;
  onClose: () => void;
}

export function SuggestionModal({ dressId, dressName, onClose }: SuggestionModalProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [userItems, setUserItems] = useState<any[]>([]);

  useEffect(() => {
    console.log('SuggestionModal mounted with dressId:', dressId);
    loadSuggestions();
  }, [dressId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      console.log('Loading suggestions for dress:', dressId);
      const data = await getSuggestionsForDuplicate(dressId);
      console.log('Received suggestions data:', data);
      setSuggestions(data.suggestions || []);
      setEventInfo(data.event);
      setUserItems(data.userOtherItems || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error('Error al cargar sugerencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAction = async (suggestion: Suggestion, action: 'like' | 'dislike' | 'search') => {
    try {
      await trackSuggestionInteraction(suggestion.title, action);
      
      if (action === 'search') {
        const searchQuery = suggestion.searchTerms.join(' ');
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' moda comprar')}`;
        window.open(searchUrl, '_blank');
        toast.success('Búsqueda abierta en nueva pestaña');
      } else if (action === 'like') {
        toast.success('¡Gracias por tu feedback!');
      } else if (action === 'dislike') {
        toast.success('Feedback registrado, mejoraremos las sugerencias');
      }
    } catch (error) {
      console.error('Error tracking suggestion action:', error);
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'variacion_color':
        return 'Alternativa de Color';
      case 'alternativa_estilo':
        return 'Variación de Estilo';
      case 'complementario':
        return 'Artículo Complementario';
      case 'estilo_alternativo':
        return 'Coordinación de Guardarropa';
      default:
        return 'Sugerencia';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'variacion_color':
        return 'bg-purple-50 border-purple-200';
      case 'alternativa_estilo':
        return 'bg-blue-50 border-blue-200';
      case 'complementario':
        return 'bg-pink-50 border-pink-200';
      case 'estilo_alternativo':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Lightbulb className="w-7 h-7 text-yellow-500" />
                Sugerencias Inteligentes
              </h2>
              <p className="text-gray-600 mt-2 text-lg">
                Alternativas generadas por IA para <span className="font-semibold">"{dressName}"</span>
              </p>
              {eventInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  📅 {eventInfo.name} • {new Date(eventInfo.date).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">La IA está analizando tu guardarropa...</p>
                <p className="text-sm text-gray-500">Generando sugerencias personalizadas</p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-20">
              <Lightbulb className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay sugerencias disponibles</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Intenta agregar más artículos a tu guardarropa para obtener mejores recomendaciones personalizadas
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* User's Other Items */}
              {userItems.length > 0 && (
                <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    👗 Tus Otros Artículos en Este Evento:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {userItems.map((item, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-8">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-6 ${getSuggestionColor(suggestion.type)} transition-all hover:shadow-lg`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{suggestion.title}</h3>
                        <span className="inline-block bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 border">
                          {getSuggestionTypeLabel(suggestion.type)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          ⭐ Prioridad {suggestion.priority}/5
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">{suggestion.description}</p>

                    {/* Suggested Item Details */}
                    <div className="bg-white rounded-lg p-4 mb-6 border-2 border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">🎯 Artículo Sugerido:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm text-gray-500 block">Nombre:</span>
                          <p className="font-medium text-gray-900">{suggestion.item.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">Color:</span>
                          <p className="font-medium text-gray-900">{suggestion.item.color}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">Estilo:</span>
                          <p className="font-medium text-gray-900">{suggestion.item.style}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 block">Tipo:</span>
                          <p className="font-medium text-gray-900">{suggestion.item.subcategory}</p>
                        </div>
                      </div>
                    </div>

                    {/* Why it works */}
                    <div className="mb-6 p-4 bg-white/70 rounded-lg border border-gray-200">
                      <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        💡 ¿Por qué funciona?
                      </h5>
                      <p className="text-gray-700">{suggestion.reasoning}</p>
                    </div>

                    {/* Budget Categories - Simplified */}
                    {suggestion.realProducts && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-green-200">
                        <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          🛍️ Opciones por Presupuesto
                        </h4>
                        
                        <div className="grid gap-6 md:grid-cols-3">
                          {Object.entries(suggestion.realProducts).map(([category, categoryData]) => (
                            <div key={category} className="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-primary transition-colors">
                              {/* Budget Header */}
                              <div className="text-center mb-4">
                                <h5 className="font-bold text-lg text-gray-900 mb-1">
                                  {categoryData.label}
                                </h5>
                                <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                                  {categoryData.priceRange}
                                </span>
                              </div>

                              {/* Products */}
                              <div className="space-y-3">
                                {categoryData.products.slice(0, 2).map((product, productIndex) => (
                                  <div key={productIndex} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-gray-50">
                                    <div className="flex gap-3">
                                      <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-16 h-20 object-cover rounded bg-gray-200 flex-shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://via.placeholder.com/64x80/CCCCCC/666666?text=${encodeURIComponent(product.retailer)}`;
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <h6 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                                          {product.name}
                                        </h6>
                                        <p className="text-xs text-gray-500 mb-2">{product.retailer}</p>
                                        
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <span className="font-bold text-primary text-lg">
                                              €{product.price}
                                            </span>
                                            {product.rating && (
                                              <div className="flex items-center gap-1 mt-1">
                                                <span className="text-yellow-400 text-sm">★</span>
                                                <span className="text-xs text-gray-600">
                                                  {product.rating} ({product.reviews})
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          <button
                                            onClick={() => {
                                              window.open(product.url, '_blank');
                                              trackSuggestionInteraction(suggestion.title, 'product_click');
                                              toast.success('Abriendo producto en nueva pestaña');
                                            }}
                                            className="bg-primary text-white px-3 py-1 rounded text-xs font-medium hover:bg-primary-600 transition-colors flex items-center gap-1"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            Ver
                                          </button>
                                        </div>
                                        
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSuggestionAction(suggestion, 'like')}
                          className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors font-medium"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Útil
                        </button>
                        <button
                          onClick={() => handleSuggestionAction(suggestion, 'dislike')}
                          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          No útil
                        </button>
                      </div>
                      <button
                        onClick={() => handleSuggestionAction(suggestion, 'search')}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Buscar Esto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}