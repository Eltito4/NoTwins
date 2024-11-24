import type { FC } from 'react';
import { useMemo } from 'react';
import { Dress } from '../types';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface EventTrendsProps {
  dresses: Dress[];
}

export const EventTrends: FC<EventTrendsProps> = ({ dresses }) => {
  const { colorData, brandData, typeData, retailerData } = useMemo(() => {
    const colors: Record<string, number> = {};
    const brands: Record<string, number> = {};
    const types: Record<string, number> = {};
    const retailers: Record<string, number> = {};

    dresses.forEach(dress => {
      // Handle colors
      if (dress.color) {
        const colorKey = dress.color.toLowerCase();
        colors[colorKey] = (colors[colorKey] || 0) + 1;
      }

      // Handle brands
      if (dress.brand) {
        const brand = dress.brand.toLowerCase();
        brands[brand] = (brands[brand] || 0) + 1;
      }

      // Handle types
      if (dress.type) {
        const type = dress.type.toLowerCase();
        types[type] = (types[type] || 0) + 1;
      }

      // Handle retailers
      if (dress.imageUrl) {
        try {
          const url = new URL(dress.imageUrl);
          const hostname = url.hostname.replace('www.', '');
          retailers[hostname] = (retailers[hostname] || 0) + 1;
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });

    return {
      colorData: colors,
      brandData: brands,
      typeData: types,
      retailerData: retailers
    };
  }, [dresses]);

  if (dresses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No data available for trends analysis</p>
        <p className="text-gray-400 mt-2">Add some items to see the trends</p>
      </div>
    );
  }

  const colorChartData = {
    labels: Object.keys(colorData).map(color => color.charAt(0).toUpperCase() + color.slice(1)),
    datasets: [{
      data: Object.values(colorData),
      backgroundColor: Object.keys(colorData).map(color => color.toLowerCase()),
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  const typeChartData = {
    labels: Object.keys(typeData).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
    datasets: [{
      data: Object.values(typeData),
      backgroundColor: [
        '#9333ea', // Purple
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#f59e0b', // Yellow
        '#10b981'  // Green
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  const brandChartData = {
    labels: Object.keys(brandData).map(brand => brand.charAt(0).toUpperCase() + brand.slice(1)),
    datasets: [{
      label: 'Number of Items',
      data: Object.values(brandData),
      backgroundColor: '#9333ea',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  const retailerChartData = {
    labels: Object.keys(retailerData).map(retailer => retailer.charAt(0).toUpperCase() + retailer.slice(1)),
    datasets: [{
      label: 'Items per Retailer',
      data: Object.values(retailerData),
      backgroundColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {Object.keys(typeData).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Article Types</h3>
          <div className="h-[300px] relative">
            <Pie data={typeChartData} options={pieOptions} />
          </div>
        </div>
      )}

      {Object.keys(colorData).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Color Distribution</h3>
          <div className="h-[300px] relative">
            <Pie data={colorChartData} options={pieOptions} />
          </div>
        </div>
      )}

      {Object.keys(brandData).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Popular Brands</h3>
          <div className="h-[300px] relative">
            <Bar data={brandChartData} options={barOptions} />
          </div>
        </div>
      )}

      {Object.keys(retailerData).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Retailers</h3>
          <div className="h-[300px] relative">
            <Bar data={retailerChartData} options={barOptions} />
          </div>
        </div>
      )}
    </div>
  );
};