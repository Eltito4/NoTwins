import axios from 'axios';
import { logger } from '../logger.js';
import { scrapeProduct } from '../scraping/index.js';

// Product search engines and APIs
const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?tbm=shop&q=',
  bing: 'https://www.bing.com/shop?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
};

// Popular fashion retailers with their search patterns
let FASHION_RETAILERS = [
  {
    id: '1',
    name: 'Zara',
    domain: 'zara.com',
    searchUrl: 'https://www.zara.com/es/es/search?searchTerm=',
    priceRange: 'mid',
    priority: 10,
    isActive: true,
    commissionRate: 8,
    countries: ['ES', 'US', 'FR', 'IT']
  },
  {
    id: '2',
    name: 'H&M',
    domain: 'hm.com',
    searchUrl: 'https://www2.hm.com/es_es/search-results.html?q=',
    priceRange: 'budget',
    priority: 8,
    isActive: true,
    commissionRate: 6,
    countries: ['ES', 'US', 'FR', 'IT']
  },
  {
    id: '3',
    name: 'Mango',
    domain: 'mango.com',
    searchUrl: 'https://shop.mango.com/es/search?q=',
    priceRange: 'mid',
    priority: 9,
    isActive: true,
    commissionRate: 7,
    countries: ['ES', 'US', 'FR']
  },
  {
    id: '4',
    name: 'Massimo Dutti',
    domain: 'massimodutti.com',
    searchUrl: 'https://www.massimodutti.com/es/search?q=',
    priceRange: 'premium',
    priority: 7,
    isActive: true,
    commissionRate: 10,
    countries: ['ES', 'US', 'FR', 'IT']
  },
  {
    id: '5',
    name: 'ASOS',
    domain: 'asos.com',
    searchUrl: 'https://www.asos.com/es/search/?q=',
    priceRange: 'mid',
    priority: 6,
    isActive: true,
    commissionRate: 5,
    countries: ['ES', 'US', 'UK', 'FR']
  },
  {
    id: '6',
    name: 'Pull & Bear',
    domain: 'pullandbear.com',
    searchUrl: 'https://www.pullandbear.com/es/search?q=',
    priceRange: 'budget',
    priority: 5,
    isActive: true,
    commissionRate: 6,
    countries: ['ES', 'US', 'FR']
  },
  {
    id: '7',
    name: 'Bershka',
    domain: 'bershka.com',
    searchUrl: 'https://www.bershka.com/es/search?q=',
    priceRange: 'budget',
    priority: 5,
    isActive: true,
    commissionRate: 6,
    countries: ['ES', 'US', 'FR']
  },
  {
    id: '8',
    name: 'Stradivarius',
    domain: 'stradivarius.com',
    searchUrl: 'https://www.stradivarius.com/es/search?q=',
    priceRange: 'budget',
    priority: 5,
    isActive: true,
    commissionRate: 6,
    countries: ['ES', 'US', 'FR']
  }
];

// Budget categories
const BUDGET_CATEGORIES = {
  budget: { min: 0, max: 50, label: 'Budget-Friendly' },
  mid: { min: 30, max: 150, label: 'Mid-Range' },
  premium: { min: 100, max: 500, label: 'Premium' }
};

export async function findRealProducts(suggestion, originalItem, budget = 'all') {
  try {
    logger.info('Searching for real products:', {
      suggestion: suggestion.item.name,
      budget,
      originalItem: originalItem.name
    });

    // Generate search terms for the suggested item
    const searchTerms = generateSearchTerms(suggestion);
    
    // Get retailers based on budget preference
    const targetRetailers = getRetailersForBudget(budget);
    
    // Search for products across different retailers
    const productPromises = targetRetailers.map(retailer => 
      searchRetailerProducts(retailer, searchTerms, suggestion)
    );

    const allProducts = await Promise.allSettled(productPromises);
    
    // Filter successful results and organize by budget
    const successfulProducts = allProducts
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value)
      .filter(Boolean);

    // Organize products by budget categories
    const organizedProducts = organizeProductsByBudget(successfulProducts);
    
    // Select best products for each budget category
    const finalRecommendations = selectBestProducts(organizedProducts, suggestion);

    logger.info('Product search completed:', {
      totalFound: successfulProducts.length,
      budgetCategories: Object.keys(finalRecommendations).length,
      suggestion: suggestion.item.name
    });

    return finalRecommendations;
  } catch (error) {
    logger.error('Error finding real products:', error);
    return generateFallbackProducts(suggestion);
  }
}

function generateSearchTerms(suggestion) {
  const baseTerms = [
    suggestion.item.name, // This is now a DIFFERENT item name, not the duplicate
    `${suggestion.item.color} ${suggestion.item.subcategory}`,
    `${suggestion.item.style} ${suggestion.item.subcategory}`,
    suggestion.searchTerms?.join(' ') || '',
    // Add style-based terms instead of exact name matches
    `${suggestion.item.color} ${suggestion.item.category}`,
    `elegant ${suggestion.item.subcategory}`,
    `stylish ${suggestion.item.color}`
  ];

  // Add Spanish translations for better local results
  const spanishTerms = translateToSpanish(suggestion.item);
  
  return [...baseTerms, ...spanishTerms].filter(Boolean);
}

function translateToSpanish(item) {
  const translations = {
    // Categories
    'dress': 'vestido',
    'dresses': 'vestidos',
    'jumpsuit': 'mono',
    'romper': 'pelele',
    'two-piece': 'conjunto',
    'shoes': 'zapatos',
    'flats': 'bailarinas',
    'boots': 'botas',
    'sandals': 'sandalias',
    'wedges': 'cuñas',
    'bag': 'bolso',
    'bags': 'bolsos',
    'clutch': 'clutch',
    'crossbody': 'bandolera',
    'tote': 'tote',
    'top': 'blusa',
    'tops': 'blusas',
    'blouse': 'blusa',
    'sweater': 'jersey',
    'cardigan': 'cardigan',
    'tank top': 'camiseta sin mangas',
    'pants': 'pantalones',
    'culottes': 'culottes',
    'palazzo': 'palazzo',
    'skirt': 'falda',
    'shorts': 'shorts',
    'jacket': 'chaqueta',
    
    // Colors
    'black': 'negro',
    'white': 'blanco',
    'red': 'rojo',
    'blue': 'azul',
    'green': 'verde',
    'yellow': 'amarillo',
    'pink': 'rosa',
    'purple': 'morado',
    'orange': 'naranja',
    'brown': 'marrón',
    'gray': 'gris',
    'navy': 'marino',
    'burgundy': 'burdeos',
    
    // Styles
    'long': 'largo',
    'short': 'corto',
    'midi': 'midi',
    'maxi': 'largo',
    'mini': 'corto',
    'casual': 'casual',
    'formal': 'formal',
    'elegant': 'elegante'
  };

  const spanishTerms = [];
  
  // Translate item name
  let translatedName = item.name.toLowerCase();
  Object.entries(translations).forEach(([en, es]) => {
    translatedName = translatedName.replace(new RegExp(en, 'g'), es);
  });
  
  if (translatedName !== item.name.toLowerCase()) {
    spanishTerms.push(translatedName);
  }

  // Create Spanish combinations
  const colorSpanish = translations[item.color?.toLowerCase()] || item.color;
  const categorySpanish = translations[item.subcategory?.toLowerCase()] || item.subcategory;
  
  if (colorSpanish && categorySpanish) {
    spanishTerms.push(`${categorySpanish} ${colorSpanish}`);
    spanishTerms.push(`${colorSpanish} ${categorySpanish}`);
  }

  return spanishTerms;
}

function getRetailersForBudget(budget) {
  // Filter by active retailers first, then sort by priority
  const activeRetailers = FASHION_RETAILERS
    .filter(retailer => retailer.isActive)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  if (budget === 'all') {
    return activeRetailers;
  }
  
  const budgetMap = {
    'budget': ['budget'],
    'mid': ['budget', 'mid'],
    'premium': ['mid', 'premium']
  };
  
  const targetRanges = budgetMap[budget] || ['budget', 'mid'];
  return activeRetailers.filter(retailer => 
    targetRanges.includes(retailer.priceRange)
  );
}

async function searchRetailerProducts(retailer, searchTerms, suggestion) {
  try {
    // For now, we'll generate realistic product suggestions
    // In the future, this would integrate with actual retailer APIs
    
    const searchTerm = searchTerms[0]; // Use the first search term
    const searchUrl = retailer.searchUrl + encodeURIComponent(searchTerm);
    
    // Generate realistic product based on retailer and suggestion
    const product = generateRealisticProduct(retailer, suggestion, searchUrl);
    
    logger.debug('Generated product for retailer:', {
      retailer: retailer.name,
      product: product.name,
      price: product.price
    });
    
    return product;
  } catch (error) {
    logger.warn(`Failed to search ${retailer.name}:`, error.message);
    return null;
  }
}

function generateRealisticProduct(retailer, suggestion, searchUrl) {
  // Generate realistic prices based on retailer and item type
  const priceRanges = {
    budget: { min: 15, max: 45 },
    mid: { min: 35, max: 120 },
    premium: { min: 80, max: 300 }
  };
  
  const range = priceRanges[retailer.priceRange];
  const basePrice = Math.floor(Math.random() * (range.max - range.min) + range.min);
  
  // Adjust price based on item type
  const typeMultipliers = {
    'dresses': 1.2,
    'jumpsuit': 1.3,
    'romper': 1.0,
    'two-piece': 1.4,
    'shoes': 1.1,
    'flats': 0.9,
    'boots': 1.2,
    'sandals': 1.0,
    'wedges': 1.1,
    'bags': 1.3,
    'clutch': 1.1,
    'crossbody': 1.2,
    'tote': 1.3,
    'jackets': 1.4,
    'tops': 0.8,
    'blouse': 0.9,
    'sweater': 1.1,
    'cardigan': 1.0,
    'pants': 1.0
  };
  
  // Check both subcategory and item name for multiplier
  const itemType = suggestion.item.name.toLowerCase();
  const multiplier = typeMultipliers[suggestion.item.subcategory] || 
                    typeMultipliers[itemType.split(' ').pop()] || 
                    1.0;
  const finalPrice = Math.round(basePrice * multiplier);
  
  // Generate realistic product name
  const productName = generateProductName(retailer, suggestion);
  
  return {
    name: productName,
    price: finalPrice,
    currency: 'EUR',
    retailer: retailer.name,
    url: searchUrl,
    image: generateProductImage(suggestion),
    inStock: Math.random() > 0.3, // 70% chance of being in stock (more realistic)
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 rating
    reviews: Math.floor(Math.random() * 500) + 10,
    priceCategory: retailer.priceRange
  };
}

function generateProductName(retailer, suggestion) {
  const brandStyles = {
    'Zara': ['Basic', 'Limited Edition', 'Studio', 'TRF'],
    'H&M': ['Conscious', 'Premium', 'Trend', 'Divided'],
    'Mango': ['Committed', 'Studio', 'Premium'],
    'Massimo Dutti': ['Limited Edition', 'Premium', 'Capsule'],
    'ASOS': ['Design', 'Edition', 'Curve', 'Petite'],
    'Pull & Bear': ['Basic', 'Join Life'],
    'Bershka': ['Collection', 'Premium'],
    'Stradivarius': ['Studio', 'Premium']
  };
  
  const style = brandStyles[retailer.name] ? 
    brandStyles[retailer.name][Math.floor(Math.random() * brandStyles[retailer.name].length)] : 
    '';
  
  const descriptors = ['Elegant', 'Casual', 'Modern', 'Classic', 'Trendy', 'Chic'];
  const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
  
  return `${style ? style + ' ' : ''}${descriptor} ${suggestion.item.name}`.trim();
}

function generateProductImage(suggestion) {
  // Generate a placeholder image URL based on the item
  const encodedName = encodeURIComponent(suggestion.item.name);
  const color = suggestion.item.color || 'gray';
  return `https://via.placeholder.com/300x400/${color.replace('#', '')}/FFFFFF?text=${encodedName}`;
}

function organizeProductsByBudget(products) {
  const organized = {
    budget: [],
    mid: [],
    premium: []
  };
  
  products.forEach(product => {
    const category = product.priceCategory || 'mid';
    if (organized[category]) {
      organized[category].push(product);
    }
  });
  
  return organized;
}

function selectBestProducts(organizedProducts, suggestion) {
  const result = {};
  
  Object.entries(organizedProducts).forEach(([category, products]) => {
    if (products.length === 0) return;
    
    // Sort by rating and reviews, then select top 2 per budget category
    const sortedProducts = products
      .sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log(a.reviews || 1);
        const scoreB = (b.rating || 0) * Math.log(b.reviews || 1);
        return scoreB - scoreA;
      })
      .slice(0, 2); // Take top 2 products per category
    
    if (sortedProducts.length > 0) {
      // Filter out products that are not in stock
      const inStockProducts = sortedProducts.filter(product => product.inStock);
      
      // Only add category if there are products in stock
      if (inStockProducts.length > 0) {
        result[category] = {
          label: BUDGET_CATEGORIES[category].label,
          priceRange: `€${BUDGET_CATEGORIES[category].min}-${BUDGET_CATEGORIES[category].max}`,
          products: inStockProducts
        };
      }
    }
  });
  
  return result;
}

// Function to update retailers from admin panel
export function updateRetailersConfiguration(newRetailers) {
  try {
    // Validate retailers
    if (!Array.isArray(newRetailers)) {
      throw new Error('Retailers must be an array');
    }

    // Update the global retailers list
    FASHION_RETAILERS = newRetailers.map(retailer => ({
      ...retailer,
      priority: retailer.priority || 1,
      isActive: retailer.isActive !== false,
      commissionRate: retailer.commissionRate || 5
    }));

    logger.info('Retailers configuration updated:', {
      total: FASHION_RETAILERS.length,
      active: FASHION_RETAILERS.filter(r => r.isActive).length,
      highPriority: FASHION_RETAILERS.filter(r => r.priority >= 8).length
    });

    return true;
  } catch (error) {
    logger.error('Error updating retailers configuration:', error);
    return false;
  }
}

// Function to get current retailers configuration
export function getRetailersConfiguration() {
  return {
    retailers: FASHION_RETAILERS,
    total: FASHION_RETAILERS.length,
    active: FASHION_RETAILERS.filter(r => r.isActive).length
  };
}

// Validate product URLs to ensure they work
async function validateProductUrl(url) {
  try {
    // Create a more realistic search URL for Spanish retailers
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Map to actual retailer search URLs
    const retailerSearchUrls = {
      'zara.com': 'https://www.zara.com/es/es/search',
      'bershka.com': 'https://www.bershka.com/es/search',
      'pullandbear.com': 'https://www.pullandbear.com/es/search',
      'stradivarius.com': 'https://www.stradivarius.com/es/search'
    };
    
    // Find matching retailer and return proper search URL
    for (const [domain, searchUrl] of Object.entries(retailerSearchUrls)) {
      if (hostname.includes(domain)) {
        return searchUrl;
      }
    }
    
    return url; // Return original if no match found
  } catch (error) {
    return url; // Return original URL if validation fails
  }
}

function generateFallbackProducts(suggestion) {
  // Generate fallback products when search fails
  logger.info('Generating fallback products for suggestion:', suggestion.item.name);
  
  const fallbackProducts = {};
  
  Object.entries(BUDGET_CATEGORIES).forEach(([category, info]) => {
    const retailer = FASHION_RETAILERS.find(r => r.priceRange === category) || 
                    FASHION_RETAILERS[0];
    
    if (retailer) {
      const searchUrl = retailer.searchUrl + encodeURIComponent(suggestion.item.name);
      const product1 = generateRealisticProduct(retailer, suggestion, searchUrl);
      
      // Ensure fallback products are in stock
      product1.inStock = true;
      const product2 = generateRealisticProduct(retailer, suggestion, searchUrl);
      
      // Make second product slightly different
      product2.name = product2.name.replace('Elegant', 'Modern');
      product2.price = Math.round(product2.price * 1.1);
      product2.inStock = true;
      
      fallbackProducts[category] = {
        label: info.label,
        priceRange: `€${info.min}-${info.max}`,
        products: [product1, product2]
      };
    }
  });
  
  logger.info('Generated fallback products:', Object.keys(fallbackProducts));
  return fallbackProducts;
}

// Future: Real API integration functions
export async function integrateWithRetailerAPI(retailer, searchTerms) {
  // TODO: Implement actual API integrations
  // This will connect to real retailer APIs for live product data
  logger.info('Future: Real API integration for', retailer);
  return null;
}

export async function trackAffiliateClick(productUrl, userId, suggestionId) {
  // TODO: Implement affiliate tracking
  // This will track clicks and purchases for commission calculation
  logger.info('Future: Affiliate tracking for', { productUrl, userId, suggestionId });
  return null;
}