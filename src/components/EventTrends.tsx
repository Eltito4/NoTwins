import { FC, useMemo } from 'react';
import { Dress } from '../types';
import { getCategoryName, getSubcategoryName } from '../utils/categorization';
import { getColorValue } from '../utils/colors';
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

// Function to get the correct color for chart segments
function getColorForChart(colorName: string): string {
  const normalizedColor = colorName.toLowerCase();
  
  // Enhanced color mapping with proper hex values
  const colorMap: Record<string, string> = {
    // Basic colors
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFD700',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'orange': '#FFA500',
    'brown': '#8B4513',
    'gray': '#808080',
    'grey': '#808080',
    
    // Metallic colors - IMPORTANT: These should look metallic
    'gold': '#FFD700',
    'golden': '#FFD700',
    'dorado': '#FFD700',
    'silver': '#C0C0C0',
    'plateado': '#C0C0C0',
    'bronze': '#CD7F32',
    'bronce': '#CD7F32',
    
    // Extended colors
    'navy': '#000080',
    'navy blue': '#000080',
    'azul marino': '#000080',
    'burgundy': '#800020',
    'burdeos': '#800020',
    'maroon': '#800000',
    'granate': '#800000',
    'teal': '#008080',
    'olive': '#808000',
    'oliva': '#808000',
    'khaki': '#F0E68C',
    'caqui': '#F0E68C',
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'crema': '#FFFDD0',
    'ivory': '#FFFFF0',
    'marfil': '#FFFFF0',
    
    // Light variations
    'light blue': '#ADD8E6',
    'azul claro': '#ADD8E6',
    'dark blue': '#00008B',
    'azul oscuro': '#00008B',
    'light green': '#90EE90',
    'verde claro': '#90EE90',
    'dark green': '#006400',
    'verde oscuro': '#006400',
    'light pink': '#FFB6C1',
    'rosa claro': '#FFB6C1',
    'hot pink': '#FF69B4',
    'rosa fuerte': '#FF69B4',
    'light gray': '#D3D3D3',
    'gris claro': '#D3D3D3',
    'dark gray': '#A9A9A9',
    'gris oscuro': '#A9A9A9',
    
    // Patterns and prints
    'leopard': '#D2691E',
    'leopardo': '#D2691E',
    'tiger': '#FF8C00',
    'tigre': '#FF8C00',
    'zebra': '#000000',
    'cebra': '#000000',
    'animal print': '#8B4513',
    'estampado animal': '#8B4513',
    'floral': '#FF69B4',
    'floral print': '#FF69B4',
    'estampado floral': '#FF69B4'
  };
  
  // Try exact match first
  if (colorMap[normalizedColor]) {
    return colorMap[normalizedColor];
  }
  
  // Try partial matches
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return value;
    }
  }
  
  // Try to get color from utils
  const utilColor = getColorValue(colorName);
  if (utilColor && utilColor !== 'pattern-animal') {
    return utilColor;
  }
  
  // Default fallback
  return '#CCCCCC';
}

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
        // Get the proper subcategory name with proper type checking
        const category = typeof dress.type.category === 'string' ? dress.type.category : '';
        const subcategory = typeof dress.type.subcategory === 'string' ? dress.type.subcategory : '';
        const typeName = getSubcategoryName(category, subcategory);
        const type = typeName || (dress.type as any).name || subcategory || 'Other';
        types[type] = (types[type] || 0) + 1;
      } else if (dress.type && (dress.type as any).name) {
        // Fallback to type name if subcategory is not available
        const type = (dress.type as any).name;
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
        <p className="text-gray-500 text-lg">No hay datos disponibles para análisis de tendencias</p>
        <p className="text-gray-400 mt-2">Agrega algunos artículos para ver las tendencias</p>
      </div>
    );
  }

  const colorChartData = {
    labels: Object.keys(colorData).map(color => color.charAt(0).toUpperCase() + color.slice(1)),
    datasets: [{
      data: Object.values(colorData),
      backgroundColor: Object.keys(colorData).map(color => getColorForChart(color)),
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
          <h3 className="text-xl font-semibold mb-6">Tipos de Ropa</h3>
          <div className="h-[400px] relative">
            <Pie data={typeChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {Object.keys(colorData).length > 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Distribución de Colores</h3>
          <div className="h-[400px] relative">
            <Pie data={colorChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {Object.keys(brandData).length > 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-6">Marcas Populares</h3>
          <div className="h-[400px] relative">
            <Bar data={brandChartData} options={barOptions} />
          </div>
        </div>
      )}
    </div>
  );
};