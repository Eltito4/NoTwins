import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'garments',
    name: 'Garments',
    subcategories: [
      {
        id: 'dresses',
        name: 'Dresses',
        keywords: [
          'dress', 'gown', 'frock', 'sundress', 'maxi', 'midi', 'mini',
          'vestido', 'robe', 'kleid', 'abito', 'платье'
        ]
      },
      {
        id: 'tops',
        name: 'Tops',
        keywords: [
          'top', 'blouse', 'shirt', 'tee', 't-shirt', 'sweater', 'pullover',
          'camiseta', 'blusa', 'chemise', 'hemd', 'camicia'
        ]
      },
      {
        id: 'pants',
        name: 'Pants',
        keywords: [
          'pants', 'trousers', 'jeans', 'leggings', 'slacks',
          'pantalón', 'pantalon', 'hose', 'pantalone'
        ]
      },
      {
        id: 'skirts',
        name: 'Skirts',
        keywords: [
          'skirt', 'midi skirt', 'mini skirt', 'maxi skirt',
          'falda', 'jupe', 'rock', 'gonna'
        ]
      },
      {
        id: 'outerwear',
        name: 'Outerwear',
        keywords: [
          'jacket', 'coat', 'blazer', 'cardigan', 'parka',
          'chaqueta', 'veste', 'jacke', 'giacca'
        ]
      }
    ]
  },
  {
    id: 'accessories',
    name: 'Accessories',
    subcategories: [
      {
        id: 'shoes',
        name: 'Shoes',
        keywords: [
          'shoes', 'boots', 'sandals', 'heels', 'sneakers', 'flats',
          'zapatos', 'botas', 'sandalias', 'schuhe', 'scarpe'
        ]
      },
      {
        id: 'bags',
        name: 'Bags',
        keywords: [
          'bag', 'handbag', 'purse', 'clutch', 'tote', 'backpack',
          'bolso', 'sac', 'tasche', 'borsa'
        ]
      },
      {
        id: 'jewelry',
        name: 'Jewelry',
        keywords: [
          'jewelry', 'necklace', 'bracelet', 'earrings', 'ring',
          'joya', 'collar', 'pulsera', 'anillo', 'pendientes'
        ]
      },
      {
        id: 'other_accessories',
        name: 'Other Accessories',
        keywords: [
          'belt', 'scarf', 'hat', 'gloves', 'sunglasses',
          'cinturón', 'bufanda', 'sombrero', 'guantes', 'gafas'
        ]
      }
    ]
  }
];