import React, { useState, useEffect } from 'react';
import { getRevenueAnalytics } from '../../services/adminService';
import { DollarSign, TrendingUp, ShoppingCart, Users, Loader2, AlertTriangle } from 'lucide-react';
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
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function RevenueAnalytics() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadRevenueData();
  }, [dateRange]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const data = await getRevenueAnalytics(dateRange);
      setRevenueData(data);
    } catch (error) {
      console.error('Error loading revenue analytics:', error);
      toast.error('Failed to load revenue data');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-2 text-gray-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">No revenue data available</p>
        </div>
      </div>
    );
  }

  const commissionData = revenueData?.commissionData || [];
  const topUsers = revenueData?.topUsers || [];
  const retailerPerformance = revenueData?.retailerPerformance || [];

  // Commission trends chart
  const commissionChartData = {
    labels: [...new Set(commissionData.map((item: any) => item._id.date))].sort(),
    datasets: [
      {
        label: 'Daily Commission',
        data: commissionData.map((item: any) => item.potentialCommission),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Retailer performance chart
  const retailerChartData = {
    labels: retailerPerformance.map((item: any) => item.retailer),
    datasets: [
      {
        label: 'Total Value (€)',
        data: retailerPerformance.map((item: any) => item.totalValue),
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

  const totalCommission = commissionData.reduce((sum: number, item: any) => sum + item.potentialCommission, 0);
  const totalClicks = retailerPerformance.reduce((sum: number, item: any) => sum + item.totalClicks, 0);
  const avgOrderValue = retailerPerformance.reduce((sum: number, item: any) => sum + item.avgPrice, 0) / (retailerPerformance.length || 1);

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Revenue Analytics Dashboard</h3>
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

      {/* Key Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Commission</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(totalCommission)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Clicks</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {totalClicks.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Order Value</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(avgOrderValue)}
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
                <dt className="text-sm font-medium text-gray-500 truncate">Top Users</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {topUsers.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Trends</h3>
          <div className="h-80">
            <Line data={commissionChartData} options={chartOptions} />
          </div>
        </div>

        {/* Retailer Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Retailer Performance</h3>
          <div className="h-80">
            <Bar data={retailerChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Top Performing Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Revenue Generating Users</h3>
          <div className="space-y-4">
            {topUsers.slice(0, 10).map((user: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{user.userId?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{user.userId?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    {formatCurrency(user.monetization?.totalCommissionGenerated || 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.monetization?.totalProductClicks || 0} clicks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retailer Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Retailer Performance Details</h3>
          <div className="space-y-4">
            {retailerPerformance.map((retailer: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{retailer.retailer}</p>
                  <p className="text-sm text-gray-500">
                    {retailer.uniqueUsers} unique users
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(retailer.totalValue)}</p>
                  <p className="text-sm text-gray-500">
                    {retailer.totalClicks} clicks • {formatCurrency(retailer.avgPrice)} avg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}