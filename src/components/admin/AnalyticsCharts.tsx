import React, { useState, useEffect } from 'react';
import { getAiAnalytics } from '../../services/adminService';
import { Brain, TrendingUp, Users, MousePointer, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export function AnalyticsCharts() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAiAnalytics(dateRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  // Process data for charts
  const suggestionTrends = analyticsData?.suggestionMetrics || [];
  const clickMetrics = analyticsData?.clickMetrics || [];
  const userEngagement = analyticsData?.userEngagement || {};

  // Suggestion trends chart data
  const suggestionChartData = {
    labels: [...new Set(suggestionTrends.map((item: any) => item._id.date))].sort(),
    datasets: [
      {
        label: 'AI Suggestions',
        data: suggestionTrends.map((item: any) => item.count),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Click performance chart data
  const clickChartData = {
    labels: [...new Set(clickMetrics.map((item: any) => item._id.retailer))],
    datasets: [
      {
        label: 'Clicks',
        data: clickMetrics.map((item: any) => item.clicks),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ]
      }
    ]
  };

  // User engagement doughnut chart
  const engagementChartData = {
    labels: ['Active AI Users', 'Total Users'],
    datasets: [
      {
        data: [userEngagement.totalUsers || 0, 1000], // Mock total for demo
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(229, 231, 235, 0.8)'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">AI Analytics Dashboard</h3>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border rounded-lg px-3 py-2"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Suggestions</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {suggestionTrends.reduce((sum: number, item: any) => sum + item.count, 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MousePointer className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Clicks</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {clickMetrics.reduce((sum: number, item: any) => sum + item.clicks, 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Confidence</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {((userEngagement.avgConfidence || 0) * 100).toFixed(1)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {userEngagement.totalUsers || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggestion Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Suggestion Trends</h3>
          <div className="h-80">
            <Line data={suggestionChartData} options={chartOptions} />
          </div>
        </div>

        {/* Retailer Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Retailer Click Performance</h3>
          <div className="h-80">
            <Bar data={clickChartData} options={chartOptions} />
          </div>
        </div>

        {/* User Engagement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Engagement</h3>
          <div className="h-80">
            <Doughnut 
              data={engagementChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                },
              }} 
            />
          </div>
        </div>

        {/* Top Performing Suggestions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Suggestion Types</h3>
          <div className="space-y-4">
            {suggestionTrends.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item._id.suggestionType || 'General'}</p>
                  <p className="text-sm text-gray-500">
                    Avg Confidence: {((item.avgConfidence || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.count}</p>
                  <p className="text-sm text-gray-500">suggestions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}