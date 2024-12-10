// Color mappings with translations and variations
export const COLOR_MAPPINGS = {
  // English
  'black': 'Black',
  'white': 'White',
  'red': 'Red',
  'blue': 'Blue',
  'green': 'Green',
  'yellow': 'Yellow',
  'purple': 'Purple',
  'pink': 'Pink',
  'orange': 'Orange',
  'brown': 'Brown',
  'gray': 'Gray',
  'grey': 'Gray',
  'navy': 'Navy Blue',
  'beige': 'Beige',
  'cream': 'Cream',
  'ivory': 'Ivory',
  'gold': 'Gold',
  'silver': 'Silver',
  'bronze': 'Bronze',
  'burgundy': 'Burgundy',
  'maroon': 'Maroon',
  'teal': 'Teal',
  'olive': 'Olive',
  'khaki': 'Khaki',
  // Spanish translations
  'negro': 'Black',
  'blanco': 'White',
  'rojo': 'Red',
  'azul': 'Blue',
  'verde': 'Green',
  'amarillo': 'Yellow',
  'morado': 'Purple',
  'rosa': 'Pink',
  'naranja': 'Orange',
  'marrón': 'Brown',
  'gris': 'Gray',
  'dorado': 'Gold',
  'plateado': 'Silver',
  'beige': 'Beige',
  'crema': 'Cream',
  'marfil': 'Ivory'
};

// Article types with translations
export const ARTICLE_TYPES = {
  clothes: {
    name: 'Clothes',
    subcategories: {
      tops: {
        name: 'Tops',
        items: [
          // English
          'basic tee', 'tank top', 'long sleeve', 'crop top',
          'formal shirt', 'casual shirt', 'denim shirt', 'linen shirt',
          'silk blouse', 'lace blouse', 'ruffle blouse',
          'cotton polo', 'technical polo',
          'wool sweater', 'knit sweater', 'turtleneck',
          'hoodie', 'sweatshirt', 'vest',
          // Spanish
          'camiseta básica', 'tirantes', 'manga larga', 'crop top',
          'camisa formal', 'camisa informal', 'camisa vaquera', 'camisa lino',
          'blusa seda', 'blusa encaje', 'blusa volantes',
          'polo algodón', 'polo técnico',
          'jersey lana', 'jersey punto', 'cuello alto',
          'sudadera', 'chaleco'
        ]
      },
      bottoms: {
        name: 'Bottoms',
        items: [
          // English
          'pants', 'trousers', 'jeans', 'shorts', 'skirt',
          'dress pants', 'casual pants', 'cargo pants',
          'denim shorts', 'bermuda shorts',
          'pencil skirt', 'pleated skirt', 'midi skirt',
          'leggings', 'joggers',
          // Spanish
          'pantalón', 'vaqueros', 'shorts', 'falda',
          'pantalón vestir', 'pantalón casual', 'pantalón cargo',
          'shorts vaqueros', 'bermudas',
          'falda lápiz', 'falda plisada', 'falda midi',
          'leggings', 'joggers'
        ]
      },
      dresses: {
        name: 'Dresses',
        items: [
          // English
          'dress', 'gown', 'jumpsuit', 'romper',
          'formal dress', 'casual dress', 'evening dress',
          'summer dress', 'cocktail dress', 'maxi dress',
          // Spanish
          'vestido', 'mono', 'peto',
          'vestido formal', 'vestido casual', 'vestido noche',
          'vestido verano', 'vestido cóctel', 'vestido largo'
        ]
      },
      outerwear: {
        name: 'Outerwear',
        items: [
          // English
          'coat', 'jacket', 'blazer', 'cardigan',
          'winter coat', 'rain coat', 'trench coat',
          'leather jacket', 'denim jacket', 'bomber jacket',
          // Spanish
          'abrigo', 'chaqueta', 'blazer', 'cardigan',
          'abrigo invierno', 'impermeable', 'gabardina',
          'chaqueta cuero', 'chaqueta vaquera', 'bomber'
        ]
      }
    }
  },
  accessories: {
    name: 'Accessories',
    subcategories: {
      shoes: {
        name: 'Shoes',
        items: [
          // English
          'shoes', 'boots', 'sandals', 'sneakers',
          'heels', 'flats', 'loafers', 'oxfords',
          // Spanish
          'zapatos', 'botas', 'sandalias', 'zapatillas',
          'tacones', 'bailarinas', 'mocasines', 'oxford'
        ]
      },
      bags: {
        name: 'Bags',
        items: [
          // English
          'bag', 'handbag', 'purse', 'backpack',
          'tote', 'clutch', 'shoulder bag',
          // Spanish
          'bolso', 'cartera', 'mochila',
          'bolso tote', 'clutch', 'bandolera'
        ]
      },
      jewelry: {
        name: 'Jewelry',
        items: [
          // English
          'necklace', 'bracelet', 'ring', 'earrings',
          'pendant', 'brooch', 'anklet',
          // Spanish
          'collar', 'pulsera', 'anillo', 'pendientes',
          'colgante', 'broche', 'tobillera'
        ]
      },
      hats: {
        name: 'Hats',
        items: [
          // English
          'hat', 'cap', 'beanie', 'beret',
          'fedora', 'panama hat', 'sun hat',
          // Spanish
          'sombrero', 'gorra', 'gorro', 'boina',
          'fedora', 'pamela', 'sombrero sol'
        ]
      },
      other: {
        name: 'Other Accessories',
        items: [
          // English
          'scarf', 'belt', 'gloves', 'sunglasses',
          'wallet', 'watch', 'umbrella',
          // Spanish
          'bufanda', 'cinturón', 'guantes', 'gafas de sol',
          'cartera', 'reloj', 'paraguas'
        ]
      }
    }
  }
};