import React, { useState, useEffect } from 'react';
import { X, Lightbulb, ShoppingBag, Palette, Sparkles, ExternalLink, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
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
  sponsor?: {
    available: boolean;
    message: string;
    futureFeature: boolean;
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
    loadSuggestions();
  }, [dressId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await getSuggestionsForDuplicate(dressId);
      setSuggestions(data.suggestions);
      setEventInfo(data.event);
      setUserItems(data.userOtherItems);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAction = async (suggestion: Suggestion, action: 'like' | 'dislike' | 'search') => {
    try {
      await trackSuggestionInteraction(suggestion.title, action);
      
      if (action === 'search') {
        // Open search in new tab with suggested terms
        const searchQuery = suggestion.searchTerms.join(' ');
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' fashion shopping')}`;
        window.open(searchUrl, '_blank');
        toast.success('Search opened in new tab');
      } else if (action === 'like') {
        toast.success('Thanks for the feedback!');
      } else if (action === 'dislike') {
        toast.success('Feedback noted, we\'ll improve our suggestions');
      }
    } catch (error) {
      console.error('Error tracking suggestion action:', error);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'color_alternative':
        return <Palette className="w-5 h-5 text-purple-600" />;
      case 'style_variation':
        return <Sparkles className="w-5 h-5 text-blue-600" />;
      case 'complementary':
        return <Heart className="w-5 h-5 text-pink-600" />;
      case 'coordination':
        return <ShoppingBag className="w-5 h-5 text-green-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'color_alternative':
        return 'Color Alternative';
      case 'style_variation':
        return 'Style Variation';
      case 'complementary':
        return 'Complementary Item';
      case 'coordination':
        return 'Wardrobe Coordination';
      default:
        return 'Suggestion';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'color_alternative':
        return 'border-purple-200 bg-purple-50';
      case 'style_variation':
        return 'border-blue-200 bg-blue-50';
      case 'complementary':
        return 'border-pink-200 bg-pink-50';
      case 'coordination':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                Smart Suggestions
              </h2>
              <p className="text-gray-600 mt-1">
                AI-powered alternatives for "{dressName}"
              </p>
              {eventInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  Event: {eventInfo.name} • {new Date(eventInfo.date).toLocaleDateString()}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">AI is analyzing your wardrobe...</p>
                <p className="text-sm text-gray-500 mt-1">Generating personalized suggestions</p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No suggestions available</p>
              <p className="text-gray-500 mt-1">Try adding more items to your wardrobe for better recommendations</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User's Other Items Context */}
              {userItems.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Your Other Items in This Event:</h3>
                  <div className="flex flex-wrap gap-2">
                    {userItems.map((item, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {item.name} {item.color && `(${item.color})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="grid gap-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-6 ${getSuggestionColor(suggestion.type)} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getSuggestionIcon(suggestion.type)}
                        <div>
                          <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {getSuggestionTypeLabel(suggestion.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-white px-2 py-1 rounded-full border">
                          Priority {suggestion.priority}/5
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{suggestion.description}</p>

                    <div className="bg-white rounded-lg p-4 mb-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">Suggested Item:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <p className="font-medium">{suggestion.item.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Color:</span>
                          <p className="font-medium">{suggestion.item.color}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Style:</span>
                          <p className="font-medium">{suggestion.item.style}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="font-medium">{suggestion.item.subcategory}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Why this works:</h5>
                      <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                    </div>

                    {/* Real Product Recommendations */}
                    {suggestion.realProducts && Object.keys(suggestion.realProducts).length > 0 && (
                      <div className="bg-white rounded-lg border-2 border-primary/20 p-4 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                          Real Product Recommendations
                        </h4>
                        <div className="space-y-4">
                          {Object.entries(suggestion.realProducts).map(([category, categoryData]) => (
                            <div key={category} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="font-medium text-gray-800">{categoryData.label}</h5>
                                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                                  {categoryData.priceRange}
                                </span>
                              </div>
                              <div className="grid gap-3">
                                {categoryData.products.map((product, productIndex) => (
                                  <div key={productIndex} className="bg-white rounded-lg p-3 border hover:shadow-md transition-shadow">
                                    <div className="flex gap-3">
                                      <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-16 h-20 object-cover rounded bg-gray-100"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://via.placeholder.com/64x80/CCCCCC/666666?text=${encodeURIComponent(product.retailer)}`;
                                        }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <h6 className="font-medium text-gray-900 text-sm truncate">
                                          {product.name}
                                        </h6>
                                        <p className="text-xs text-gray-500 mb-1">{product.retailer}</p>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="font-semibold text-primary">
                                            €{product.price}
                                          </span>
                                          {product.rating && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-yellow-400">★</span>
                                              <span className="text-xs text-gray-600">
                                                {product.rating} ({product.reviews})
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className={`text-xs px-2 py-1 rounded-full ${
                                            product.inStock 
                                              ? 'bg-green-100 text-green-700' 
                                              : 'bg-red-100 text-red-700'
                                          }`}>
                                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                                          </span>
                                          <button
                                            onClick={() => {
                                              window.open(product.url, '_blank');
                                              // Track product click separately
                                              trackSuggestionInteraction(suggestion.title, 'product_click');
                                            }}
                                            className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-600 transition-colors flex items-center gap-1"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            View
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
                    {/* Future Sponsor Integration */}
                    {suggestion.sponsor?.futureFeature && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-purple-700">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm font-medium">Coming Soon: Sponsored Suggestions</span>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          We'll soon partner with brands to show you exactly where to buy these items!
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSuggestionAction(suggestion, 'like')}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-100 rounded-full transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Helpful
                        </button>
                        <button
                          onClick={() => handleSuggestionAction(suggestion, 'dislike')}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          Not helpful
                        </button>
                      </div>
                      <button
                        onClick={() => handleSuggestionAction(suggestion, 'search')}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Search for this
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