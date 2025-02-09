import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'clothes',
    name: 'Clothes',
    subcategories: [
      {
        id: 'tops',
        name: 'Tops',
        keywords: [
          'shirt', 'blouse', 'top', 't-shirt', 'sweater',
          'hoodie', 'sweatshirt', 'tank', 'polo', 'jersey',
          'cardigan', 'pullover', 'turtleneck'
        ]
      },
      {
        id: 'bottoms',
        name: 'Bottoms',
        keywords: [
          'pants', 'trousers', 'jeans', 'shorts', 'skirt',
          'leggings', 'joggers', 'sweatpants', 'slacks',
          'culottes', 'palazzo'
        ]
      },
      {
        id: 'dresses',
        name: 'Dresses',
        keywords: [
          'dress', 'gown', 'frock', 'sundress', 'cocktail dress',
          'evening dress', 'maxi dress', 'mini dress', 'jumpsuit',
          'romper'
        ]
      },
      {
        id: 'outerwear',
        name: 'Outerwear',
        keywords: [
          'jacket', 'coat', 'blazer', 'cardigan', 'vest',
          'windbreaker', 'parka', 'raincoat', 'bomber',
          'trench coat'
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
          'shoes', 'boots', 'sandals', 'sneakers', 'heels',
          'flats', 'loafers', 'oxfords', 'pumps', 'mules',
          'espadrilles', 'slippers', 'ankle boots', 'footwear',
          'ballet flats', 'platforms', 'wedges', 'stilettos'
        ]
      },
      {
        id: 'bags',
        name: 'Bags',
        keywords: [
          'bag', 'purse', 'handbag', 'backpack', 'tote',
          'clutch', 'wallet', 'satchel', 'crossbody',
          'shoulder bag'
        ]
      },
      {
        id: 'jewelry',
        name: 'Jewelry',
        keywords: [
          'necklace', 'bracelet', 'ring', 'earrings',
          'pendant', 'brooch', 'anklet', 'jewelry'
        ]
      },
      {
        id: 'other',
        name: 'Other Accessories',
        keywords: [
          'scarf', 'belt', 'gloves', 'sunglasses',
          'hat', 'cap', 'beanie', 'watch', 'hair accessories'
        ]
      }
    ]
  }
];