import { CATEGORIES } from './categories.js';

export function detectProductType(text) {
  if (!text) return null;
  
  const normalizedText = text.toLowerCase();
  
  // CRITICAL: Enhanced Spanish and multilingual detection
  const dressKeywords = [
    // Spanish dress terms
    'vestido', 'vestidos', 'dress', 'dresses', 'gown', 'gowns',
    'vestido largo', 'vestido corto', 'vestido midi', 'vestido maxi',
    'vestido de punto', 'vestido de noche', 'vestido de fiesta',
    'vestido casual', 'vestido formal', 'vestido de verano',
    // French dress terms
    'robe', 'robes',
    // Italian dress terms
    'vestito', 'vestiti', 'abito', 'abiti'
  ];

  const topKeywords = [
    // Spanish top terms
    'blusa', 'blusas', 'camisa', 'camisas', 'camiseta', 'camisetas',
    'top', 'tops', 'jersey', 'jerseys', 'suéter', 'suéteres',
    'cardigan', 'cardigans', 'chaqueta punto', 'rebeca',
    // English top terms
    'shirt', 'shirts', 'blouse', 'blouses', 't-shirt', 'tshirt',
    'sweater', 'sweaters', 'hoodie', 'hoodies', 'tank', 'tanks',
    'pullover', 'pullovers', 'turtleneck', 'crop top'
  ];

  const bottomKeywords = [
    // Spanish bottom terms
    'pantalón', 'pantalones', 'falda', 'faldas', 'short', 'shorts',
    'vaqueros', 'jeans', 'leggings', 'mallas', 'palazzo',
    'falda larga', 'falda corta', 'minifalda', 'maxifalda',
    // English bottom terms
    'pants', 'trousers', 'skirt', 'skirts', 'jeans', 'shorts',
    'leggings', 'joggers', 'slacks', 'culottes'
  ];

  const shoeKeywords = [
    // Spanish shoe terms
    'zapato', 'zapatos', 'sandalia', 'sandalias', 'bota', 'botas',
    'zapatilla', 'zapatillas', 'tacón', 'tacones', 'bailarina', 'bailarinas',
    'mocasín', 'mocasines', 'alpargata', 'alpargatas', 'deportiva', 'deportivas',
    'botín', 'botines', 'stiletto', 'stilettos', 'plataforma', 'plataformas',
    // English shoe terms
    'shoe', 'shoes', 'boot', 'boots', 'sandal', 'sandals', 'sneaker', 'sneakers',
    'heel', 'heels', 'flat', 'flats', 'loafer', 'loafers', 'pump', 'pumps',
    'ballet flat', 'ballet flats', 'espadrille', 'espadrilles', 'high-heel',
    'high-heeled', 'ankle boot', 'ankle boots', 'stiletto', 'platform'
  ];

  const bagKeywords = [
    // Spanish bag terms
    'bolso', 'bolsos', 'cartera', 'carteras', 'mochila', 'mochilas',
    'bandolera', 'bandoleras', 'clutch', 'riñonera', 'riñoneras',
    'bolso de mano', 'bolso bandolera', 'bolso tote',
    // English bag terms
    'bag', 'bags', 'handbag', 'handbags', 'purse', 'purses',
    'backpack', 'backpacks', 'tote', 'totes', 'clutch', 'satchel',
    'crossbody', 'shoulder bag', 'messenger bag'
  ];

  const outerwearKeywords = [
    // Spanish outerwear terms
    'abrigo', 'abrigos', 'chaqueta', 'chaquetas', 'blazer', 'blazers',
    'cazadora', 'cazadoras', 'parka', 'parkas', 'gabardina', 'gabardinas',
    'poncho', 'ponchos', 'capa', 'capas', 'chaleco', 'chalecos',
    // English outerwear terms
    'coat', 'coats', 'jacket', 'jackets', 'blazer', 'blazers',
    'windbreaker', 'parka', 'raincoat', 'trench coat', 'vest', 'vests'
  ];

  // PRIORITY ORDER: Most specific first
  
  // 1. DRESSES - Highest priority for "vestido" detection
  for (const keyword of dressKeywords) {
    if (normalizedText.includes(keyword)) {
      return {
        category: 'clothes',
        subcategory: 'dresses',
        name: 'Dresses'
      };
    }
  }

  // 2. SHOES - Check before accessories general
  for (const keyword of shoeKeywords) {
    if (normalizedText.includes(keyword)) {
      return {
        category: 'accessories',
        subcategory: 'shoes',
        name: 'Shoes'
      };
    }
  }

  // 3. BAGS - Check before accessories general
  for (const keyword of bagKeywords) {
    if (normalizedText.includes(keyword)) {
      return {
        category: 'accessories',
        subcategory: 'bags',
        name: 'Bags'
      };
    }
  }

  // 4. TOPS
  for (const keyword of topKeywords) {
    if (normalizedText.includes(keyword)) {
      return {
        category: 'clothes',
        subcategory: 'tops',
        name: 'Tops'
      };
    }
  }

  // 5. BOTTOMS
  for (const keyword of bottomKeywords) {
    if (normalizedText.includes(keyword)) {
      return {
        category: 'clothes',
        subcategory: 'bottoms',
        name: 'Bottoms'
      };
    }
  }

  // 6. OUTERWEAR - Last for clothes to avoid conflicts
  for (const keyword of outerwearKeywords) {
    if (normalizedText.includes(keyword)) {
      return {
        category: 'clothes',
        subcategory: 'outerwear',
        name: 'Outerwear'
      };
    }
  }

  // 7. Fallback to original category detection
  for (const category of CATEGORIES) {
    for (const subcategory of category.subcategories) {
      if (subcategory.keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
        return {
          category: category.id,
          subcategory: subcategory.id,
          name: subcategory.name
        };
      }
    }
  }

  // 8. Default fallback
  return {
    category: 'clothes',
    subcategory: 'other',
    name: 'Other'
  };
}

export function getCategoryName(categoryId) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return category?.name || 'Other';
}

export function getSubcategoryName(categoryId, subcategoryId) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  const subcategory = category?.subcategories.find(s => s.id === subcategoryId);
  return subcategory?.name || 'Other';
}

export function getAllCategories() {
  return CATEGORIES;
}

export function getSubcategories(categoryId) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return category?.subcategories || [];
}