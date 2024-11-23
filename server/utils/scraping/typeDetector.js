// Main article categories
const ARTICLE_CATEGORIES = {
  garment: {
    name: 'Garment',
    types: {
      dress: ['dress', 'gown', 'frock', 'vestido', 'robe', 'kleid'],
      top: ['top', 'blouse', 'shirt', 'sweater', 'camiseta', 'blusa', 'pullover'],
      pants: ['pants', 'trousers', 'jeans', 'leggings', 'pantalón', 'hose'],
      skirt: ['skirt', 'falda', 'jupe', 'gonna'],
      jacket: ['jacket', 'coat', 'blazer', 'chaqueta', 'manteau'],
      suit: ['suit', 'tuxedo', 'traje', 'anzug'],
      swimwear: ['swimsuit', 'bikini', 'bañador'],
      lingerie: ['bra', 'panties', 'ropa interior', 'sujetador']
    }
  },
  shoes: {
    name: 'Shoes',
    types: {
      heels: ['heels', 'pumps', 'tacones', 'stilettos'],
      boots: ['boots', 'botas', 'stiefel'],
      sneakers: ['sneakers', 'trainers', 'zapatillas'],
      sandals: ['sandals', 'sandalias', 'sandalen'],
      flats: ['flats', 'ballerinas', 'bailarinas']
    }
  },
  accessories: {
    name: 'Accessories',
    types: {
      scarf: ['scarf', 'bufanda', 'écharpe'],
      belt: ['belt', 'cinturón', 'ceinture'],
      hat: ['hat', 'cap', 'sombrero', 'chapeau'],
      gloves: ['gloves', 'guantes', 'gants'],
      sunglasses: ['sunglasses', 'gafas', 'lunettes']
    }
  },
  bags: {
    name: 'Bags',
    types: {
      handbag: ['handbag', 'purse', 'bolso', 'sac'],
      clutch: ['clutch', 'pochette', 'cartera'],
      backpack: ['backpack', 'mochila', 'rucksack'],
      tote: ['tote', 'shopper', 'bolsa'],
      crossbody: ['crossbody', 'messenger', 'bandolera']
    }
  },
  jewelry: {
    name: 'Jewelry',
    types: {
      necklace: ['necklace', 'collar', 'collier'],
      bracelet: ['bracelet', 'pulsera', 'bracelet'],
      earrings: ['earrings', 'pendientes', 'boucles'],
      ring: ['ring', 'anillo', 'bague'],
      brooch: ['brooch', 'broche', 'broche']
    }
  }
};

export function detectArticleType(name, description = '') {
  const text = `${name} ${description}`.toLowerCase();
  
  // Check each category and its types
  for (const [category, categoryData] of Object.entries(ARTICLE_CATEGORIES)) {
    for (const [type, keywords] of Object.entries(categoryData.types)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return {
            category: categoryData.name,
            type: type.charAt(0).toUpperCase() + type.slice(1)
          };
        }
      }
    }
  }

  // Additional checks for common patterns
  if (/\b(dress|vestido|robe)\b/i.test(text)) {
    return { category: 'Garment', type: 'Dress' };
  }
  if (/\b(shoes|zapatos|chaussures)\b/i.test(text)) {
    return { category: 'Shoes', type: 'Other' };
  }
  if (/\b(bag|bolso|sac)\b/i.test(text)) {
    return { category: 'Bags', type: 'Other' };
  }
  if (/\b(jewelry|joyas|bijoux)\b/i.test(text)) {
    return { category: 'Jewelry', type: 'Other' };
  }

  // Default fallback
  return { category: 'Other', type: 'Unknown' };
}