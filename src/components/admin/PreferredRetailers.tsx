import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  Star,
  TrendingUp,
  DollarSign,
  Eye
} from 'lucide-react';
import { getPreferredRetailers, updatePreferredRetailers } from '../../services/adminService';
import toast from 'react-hot-toast';

interface Retailer {
  id: string;
  name: string;
  domain: string;
  searchUrl: string;
  priceRange: 'budget' | 'mid' | 'premium';
  priority: number;
  isActive: boolean;
  commissionRate: number;
  countries: string[];
  description?: string;
}

export function PreferredRetailers() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRetailer, setNewRetailer] = useState<Partial<Retailer>>({
    name: '',
    domain: '',
    searchUrl: '',
    priceRange: 'mid',
    priority: 1,
    isActive: true,
    commissionRate: 5,
    countries: ['ES'],
    description: ''
  });

  useEffect(() => {
    loadRetailers();
  }, []);

  const loadRetailers = async () => {
    try {
      setLoading(true);
      const data = await getPreferredRetailers();
      setRetailers(data.retailers || getDefaultRetailers());
    } catch (error) {
      console.error('Error loading retailers:', error);
      // Load default retailers if API fails
      setRetailers(getDefaultRetailers());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRetailers = (): Retailer[] => [
    {
      id: '1',
      name: 'Zara',
      domain: 'zara.com',
      searchUrl: 'https://www.zara.com/es/es/search?searchTerm=',
      priceRange: 'mid',
      priority: 10,
      isActive: true,
      commissionRate: 8,
      countries: ['ES', 'US', 'FR', 'IT'],
      description: 'Fast fashion leader with trendy designs'
    },
    {
      id: '2',
      name: 'Mango',
      domain: 'mango.com',
      searchUrl: 'https://shop.mango.com/es/search?q=',
      priceRange: 'mid',
      priority: 9,
      isActive: true,
      commissionRate: 7,
      countries: ['ES', 'US', 'FR'],
      description: 'Contemporary fashion with Mediterranean style'
    },
    {
      id: '3',
      name: 'H&M',
      domain: 'hm.com',
      searchUrl: 'https://www2.hm.com/es_es/search-results.html?q=',
      priceRange: 'budget',
      priority: 8,
      isActive: true,
      commissionRate: 6,
      countries: ['ES', 'US', 'FR', 'IT'],
      description: 'Affordable fashion for everyone'
    },
    {
      id: '4',
      name: 'Massimo Dutti',
      domain: 'massimodutti.com',
      searchUrl: 'https://www.massimodutti.com/es/search?q=',
      priceRange: 'premium',
      priority: 7,
      isActive: true,
      commissionRate: 10,
      countries: ['ES', 'US', 'FR', 'IT'],
      description: 'Premium fashion with sophisticated designs'
    },
    {
      id: '5',
      name: 'ASOS',
      domain: 'asos.com',
      searchUrl: 'https://www.asos.com/es/search/?q=',
      priceRange: 'mid',
      priority: 6,
      isActive: true,
      commissionRate: 5,
      countries: ['ES', 'US', 'UK', 'FR'],
      description: 'Online fashion destination for young adults'
    }
  ];

  const handleSaveRetailers = async () => {
    try {
      await updatePreferredRetailers(retailers);
      toast.success('Preferred retailers updated successfully');
    } catch (error) {
      toast.error('Failed to update retailers');
    }
  };

  const handleAddRetailer = () => {
    if (!newRetailer.name || !newRetailer.domain) {
      toast.error('Name and domain are required');
      return;
    }

    const retailer: Retailer = {
      id: Date.now().toString(),
      name: newRetailer.name!,
      domain: newRetailer.domain!,
      searchUrl: newRetailer.searchUrl || `https://${newRetailer.domain}/search?q=`,
      priceRange: newRetailer.priceRange || 'mid',
      priority: newRetailer.priority || 1,
      isActive: newRetailer.isActive !== false,
      commissionRate: newRetailer.commissionRate || 5,
      countries: newRetailer.countries || ['ES'],
      description: newRetailer.description || ''
    };

    setRetailers(prev => [...prev, retailer]);
    setNewRetailer({
      name: '',
      domain: '',
      searchUrl: '',
      priceRange: 'mid',
      priority: 1,
      isActive: true,
      commissionRate: 5,
      countries: ['ES'],
      description: ''
    });
    setShowAddForm(false);
    toast.success('Retailer added successfully');
  };

  const handleDeleteRetailer = (id: string) => {
    setRetailers(prev => prev.filter(r => r.id !== id));
    toast.success('Retailer deleted');
  };

  const handleToggleActive = (id: string) => {
    setRetailers(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const handlePriorityChange = (id: string, direction: 'up' | 'down') => {
    setRetailers(prev => prev.map(r => {
      if (r.id === id) {
        const newPriority = direction === 'up' ? r.priority + 1 : r.priority - 1;
        return { ...r, priority: Math.max(1, Math.min(10, newPriority)) };
      }
      return r;
    }));
  };

  const getPriceRangeColor = (range: string) => {
    switch (range) {
      case 'budget': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedRetailers = [...retailers].sort((a, b) => b.priority - a.priority);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading retailers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Store className="w-6 h-6" />
              Preferred Retailers Configuration
            </h3>
            <p className="text-gray-600 mt-1">
              Configure which retailers appear more frequently in AI suggestions based on priority and commission rates.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Retailer
            </button>
            <button
              onClick={handleSaveRetailers}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Save size={20} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Retailers</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{retailers.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {retailers.filter(r => r.isActive).length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">Avg Commission</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              {(retailers.reduce((sum, r) => sum + r.commissionRate, 0) / retailers.length).toFixed(1)}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">High Priority</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {retailers.filter(r => r.priority >= 8).length}
            </p>
          </div>
        </div>
      </div>

      {/* Add Retailer Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Add New Retailer</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newRetailer.name || ''}
                onChange={(e) => setNewRetailer(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="e.g., Zara"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                type="text"
                value={newRetailer.domain || ''}
                onChange={(e) => setNewRetailer(prev => ({ ...prev, domain: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="e.g., zara.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search URL</label>
              <input
                type="url"
                value={newRetailer.searchUrl || ''}
                onChange={(e) => setNewRetailer(prev => ({ ...prev, searchUrl: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/search?q="
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select
                value={newRetailer.priceRange || 'mid'}
                onChange={(e) => setNewRetailer(prev => ({ ...prev, priceRange: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="budget">Budget (€0-50)</option>
                <option value="mid">Mid-Range (€30-150)</option>
                <option value="premium">Premium (€100-500)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newRetailer.priority || 1}
                onChange={(e) => setNewRetailer(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={newRetailer.commissionRate || 5}
                onChange={(e) => setNewRetailer(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newRetailer.description || ''}
              onChange={(e) => setNewRetailer(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="Brief description of the retailer..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRetailer}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Add Retailer
            </button>
          </div>
        </div>
      )}

      {/* Retailers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Retailers List (Sorted by Priority)</h3>
          <p className="text-sm text-gray-600 mt-1">
            Higher priority retailers appear more frequently in AI suggestions
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retailer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRetailers.map((retailer) => (
                <tr key={retailer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                          {retailer.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{retailer.name}</div>
                        <div className="text-sm text-gray-500">{retailer.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{retailer.priority}</span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handlePriorityChange(retailer.id, 'up')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          disabled={retailer.priority >= 10}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => handlePriorityChange(retailer.id, 'down')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          disabled={retailer.priority <= 1}
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriceRangeColor(retailer.priceRange)}`}>
                      {retailer.priceRange}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {retailer.commissionRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(retailer.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        retailer.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {retailer.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteRetailer(retailer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}