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

// Fixed color mapping with exact color values and base colors
const COLOR_MAP: Record<string, { value: string; base: string }> = {
  'white': { value: '#FFFFFF', base: 'white' },
  'black': { value: '#000000', base: 'black' },
  'red': { value: '#FF0000', base: 'red' },
  'blue': { value: '#0000FF', base: 'blue' },
  'light blue': { value: '#ADD8E6', base: 'blue' },
  'dark blue': { value: '#00008B', base: 'blue' },
  'navy blue': { value: '#000080', base: 'blue' },
  'navy': { value: '#000080', base: 'blue' },
  'green': { value: '#008000', base: 'green' },
  'light green': { value: '#90EE90', base: 'green' },
  'dark green': { value: '#006400', base: 'green' },
  'yellow': { value: '#FFD700', base: 'yellow' },
  'purple': { value: '#800080', base: 'purple' },
  'pink': { value: '#FFC0CB', base: 'pink' },
  'light pink': { value: '#FFB6C1', base: 'pink' },
  'hot pink': { value: '#FF69B4', base: 'pink' },
  'orange': { value: '#FFA500', base: 'orange' },
  'brown': { value: '#8B4513', base: 'brown' },
  'gray': { value: '#808080', base: 'gray' },
  'grey': { value: '#808080', base: 'gray' },
  'dark gray': { value: '#404040', base: 'gray' },
  'light gray': { value: '#D3D3D3', base: 'gray' },
  'silver': { value: '#C0C0C0', base: 'silver' },
  'gold': { value: '#FFD700', base: 'gold' },
  'beige': { value: '#F5F5DC', base: 'beige' },
  'cream': { value: '#FFFDD0', base: 'cream' },
  'khaki': { value: '#C3B091', base: 'khaki' },
  'dark khaki': { value: '#BDB76B', base: 'khaki' },
  'olive': { value: '#808000', base: 'olive' },
  'burgundy': { value: '#800020', base: 'red' },
  'maroon': { value: '#800000', base: 'red' },
  'teal': { value: '#008080', base: 'blue' },
  'turquoise': { value: '#40E0D0', base: 'blue' },
  'coral': { value: '#FF7F50', base: 'orange' },
  'salmon': { value: '#FA8072', base: 'pink' },
  'magenta': { value: '#FF00FF', base: 'purple' },
  'violet': { value: '#8F00FF', base: 'purple' },
  'indigo': { value: '#4B0082', base: 'purple' },
  'pastel pink': { value: '#FFB6C1', base: 'pink' },
  'pastel blue': { value: '#B0E0E6', base: 'blue' },
  'pastel green': { value: '#98FB98', base: 'green' }
};

interface EventTrendsProps {
  dresses: Dress[];
}

export const EventTrends: FC<EventTrendsProps> = ({ dresses }) => {
  const { colorData, brandData, typeData } = useMemo(() => {
    const colors: Record<string, number> = {};
    const brands: Record<string, number> = {};
    const types: Record<string, { category: string; count: number }> = {};

    dresses.forEach(dress => {
      // Handle colors
      if (dress.color) {
        const colorKey = dress.color.toLowerCase();
        const baseColor = COLOR_MAP[colorKey]?.base || colorKey;
        colors[baseColor] = (colors[baseColor] || 0) + 1;
      }

      // Handle brands
      if (dress.brand) {
        const brand = dress.brand.toLowerCase();
        brands[brand] = (brands[brand] || 0) + 1;
      }

      // Handle types
      if (dress.type) {
        const [category, type] = dress.type.split(' - ');
        if (!types[category]) {
          types[category] = { category, count: 0 };
        }
        types[category].count++;
      }
    });

    return {
      colorData: colors,
      brandData: brands,
      typeData: Object.values(types).reduce((acc, { category, count }) => {
        acc[category] = count;
        return acc;
      }, {} as Record<string, number>)
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
      backgroundColor: Object.keys(colorData).map(color => COLOR_MAP[color]?.value || color),
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
    </div>
  );
};