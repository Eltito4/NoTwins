import { FC, useMemo } from 'react';
import { Dress } from '../types';
import { getCategoryName, getSubcategoryName } from '../utils/categorization';
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
  const { colorData, brandData, typeData } = useMemo(() => {
    const colors: Record<string, number> = {};
    const brands: Record<string, number> = {};
    const types: Record<string, number> = {};

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
        // Get the proper subcategory name
        const typeName = getSubcategoryName(dress.type.category, dress.type.subcategory);
        const type = typeName || dress.type.name || dress.type.subcategory;
        types[type] = (types[type] || 0) + 1;
      } else if (dress.type && dress.type.name) {
        // Fallback to type name if subcategory is not available
        const type = dress.type.name;
        types[type] = (types[type] || 0) + 1;
      }
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
      backgroundColor: Object.keys(colorData).map(color => {
        // Use the actual color value for the chart segments
        if (color.toLowerCase().includes('black')) return '#000000';
        if (color.toLowerCase().includes('white')) return '#FFFFFF';
        if (color.toLowerCase().includes('red')) return '#FF0000';
        if (color.toLowerCase().includes('blue')) return '#0000FF';
        if (color.toLowerCase().includes('green')) return '#008000';
        if (color.toLowerCase().includes('yellow')) return '#FFD700';
        if (color.toLowerCase().includes('purple')) return '#800080';
        if (color.toLowerCase().includes('pink')) return '#FFC0CB';
        if (color.toLowerCase().includes('orange')) return '#FFA500';
        if (color.toLowerCase().includes('brown')) return '#8B4513';
        if (color.toLowerCase().includes('gray')) return '#808080';
        if (color.toLowerCase().includes('leopard')) return '#D2691E';
        return '#CCCCCC'; // Default color
      }),
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  const typeChartData = {
    labels: Object.keys(typeData),
    datasets: [{
      data: Object.values(typeData),
      backgroundColor: [
        '#9333ea', // Purple
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#f59e0b', // Yellow
        '#10b981', // Green
        '#f97316', // Orange
        '#8b5cf6', // Violet
        '#06b6d4', // Cyan
        '#84cc16', // Lime
        '#ec4899'  // Pink
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 14 // Increased font size
          },
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => ({
                text: `${label} (${data.datasets[0].data[i]})`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].borderColor,
                lineWidth: data.datasets[0].borderWidth,
                hidden: false,
                index: i
              }));
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} items`;
          }
        }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 14 // Increased font size
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 14 // Increased font size
          }
        }
      }
    }
  };

  return (
    <div className="space-y-12 p-6">
      {Object.keys(typeData).length > 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Clothing Types</h3>
          <div className="h-[400px] relative">
            <Pie data={typeChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {Object.keys(colorData).length > 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Color Distribution</h3>
          <div className="h-[400px] relative">
            <Pie data={colorChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {Object.keys(brandData).length > 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Popular Brands</h3>
          <div className="h-[400px] relative">
            <Bar data={brandChartData} options={barOptions} />
          </div>
        </div>
      )}
    </div>
  );
};