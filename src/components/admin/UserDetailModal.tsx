import React, { useState } from 'react';
import { X, User, Calendar, ShoppingBag, MessageSquare, Brain, DollarSign, Flag, AlertTriangle, Star, Shield } from 'lucide-react';
import { updateUserFlag } from '../../services/adminService';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface UserDetailModalProps {
  user: any;
  onClose: () => void;
}

export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);

  const handleFlagUpdate = async (flag: string, value: boolean, reason?: string) => {
    try {
      setLoading(true);
      await updateUserFlag(user.user.id, flag, value, reason);
      toast.success(`User ${flag} updated successfully`);
      // Refresh user data would go here
    } catch (error) {
      toast.error(`Failed to update user ${flag}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.user.name}</h2>
                <p className="text-gray-600">{user.user.email}</p>
                <p className="text-sm text-gray-500">
                  Joined {formatDistanceToNow(new Date(user.user.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Events</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {user.events?.length || 0}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Items</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {user.items?.length || 0}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">AI Usage</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {user.profile?.aiAssistance?.totalSuggestionsRequested || 0}
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Revenue</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-900 mt-1">
                    {formatCurrency(user.profile?.monetization?.totalCommissionGenerated || 0)}
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-4">
                  {user.recentActivity?.length > 0 ? (
                    <div className="space-y-3">
                      {user.recentActivity.slice(0, 10).map((activity: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-gray-600">
                            {activity.activityType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-400 ml-auto">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Events */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Events</h3>
                </div>
                <div className="p-4">
                  {user.events?.length > 0 ? (
                    <div className="space-y-3">
                      {user.events.map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{event.name}</p>
                            <p className="text-sm text-gray-600">{event.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {new Date(event.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {event.creatorId === user.user.id ? 'Creator' : 'Participant'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No events</p>
                  )}
                </div>
              </div>
            </div>

            {/* User Management */}
            <div className="space-y-6">
              {/* User Flags */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Flag className="w-5 h-5" />
                    User Flags
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">VIP User</span>
                    </div>
                    <button
                      onClick={() => handleFlagUpdate('isVip', !user.profile?.flags?.isVip)}
                      disabled={loading}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.profile?.flags?.isVip
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.profile?.flags?.isVip ? 'VIP' : 'Regular'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Influencer</span>
                    </div>
                    <button
                      onClick={() => handleFlagUpdate('isInfluencer', !user.profile?.flags?.isInfluencer)}
                      disabled={loading}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.profile?.flags?.isInfluencer
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.profile?.flags?.isInfluencer ? 'Influencer' : 'Regular'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Needs Attention</span>
                    </div>
                    <button
                      onClick={() => handleFlagUpdate('needsAttention', !user.profile?.flags?.needsAttention)}
                      disabled={loading}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.profile?.flags?.needsAttention
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.profile?.flags?.needsAttention ? 'Flagged' : 'Normal'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Suspended</span>
                    </div>
                    <button
                      onClick={() => handleFlagUpdate('isSuspended', !user.profile?.flags?.isSuspended)}
                      disabled={loading}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.profile?.flags?.isSuspended
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.profile?.flags?.isSuspended ? 'Suspended' : 'Active'}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Analytics */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Analytics
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Suggestions Requested</span>
                    <span className="font-medium">
                      {user.profile?.aiAssistance?.totalSuggestionsRequested || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Suggestions Clicked</span>
                    <span className="font-medium">
                      {user.profile?.aiAssistance?.totalSuggestionsClicked || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Confidence</span>
                    <span className="font-medium">
                      {((user.profile?.aiAssistance?.averageConfidenceScore || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="font-medium">
                      {user.profile?.aiAssistance?.totalSuggestionsRequested > 0
                        ? ((user.profile?.aiAssistance?.totalSuggestionsClicked / user.profile?.aiAssistance?.totalSuggestionsRequested) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Monetization */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Monetization
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Clicks</span>
                    <span className="font-medium">
                      {user.profile?.monetization?.totalProductClicks || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Commission Generated</span>
                    <span className="font-medium">
                      {formatCurrency(user.profile?.monetization?.totalCommissionGenerated || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Order Value</span>
                    <span className="font-medium">
                      {formatCurrency(user.profile?.monetization?.averageOrderValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lifetime Value</span>
                    <span className="font-medium">
                      {formatCurrency(user.profile?.monetization?.lifetimeValue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}