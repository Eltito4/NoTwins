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

// Fixed color mapping with exact color values
const COLOR_MAP: Record<string, string> = {
  'white': '#FFFFFF',
  'black': '#000000',
  'red': '#FF0000',
  'blue': '#0000FF',
  'light blue': '#ADD8E6',
  'dark blue': '#00008B',
  'green': '#008000',
  'yellow': '#FFD700',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'orange': '#FFA500',
  'brown': '#8B4513',
  'gray': '#808080',
  'dark gray': '#404040',
  'light gray': '#D3D3D3',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'beige': '#F5F5DC',
  'cream': '#FFFDD0',
  'navy': '#000080',
  'khaki': '#C3B091',
  'dark khaki': '#BDB76B',
  'olive': '#808000',
  'pastel pink': '#FFB6C1',
  'pastel blue': '#B0E0E6',
  'pastel green': '#98FB98'
};

const getColorForName = (colorName: string): string => {
  const normalizedColor = colorName.toLowerCase();
  return COLOR_MAP[normalizedColor] || '#' + Math.floor(Math.random()*16777215).toString(16);
};

export const EventTrends: FC<EventTrendsProps> = ({ dresses }) => {
  const { colorData, brandData, typeData } = useMemo(() => {
    const colors: Record<string, number> = {};
    const brands: Record<string, number> = {};
    const types: Record<string, number> = {};

    dresses.forEach(dress => {
      if (dress.color) {
        const color = dress.color.toLowerCase();
        colors[color] = (colors[color] || 0) + 1;
      }
      if (dress.brand) {
        const brand = dress.brand.toLowerCase();
        brands[brand] = (brands[brand] || 0) + 1;
      }
      const type = dress.type || 'other';
      types[type] = (types[type] || 0) + 1;
    });

    return {
      colorData: colors,
      brandData: brands,
      typeData: types
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
      backgroundColor: Object.keys(colorData).map(color => getColorForName(color)),
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

  const typeChartData = {
    labels: Object.keys(typeData).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
    datasets: [{
      label: 'Number of Items',
      data: Object.values(typeData),
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