// Combine all retailer configurations
const retailers = {
    'zara.com': {
      selectors: {
        name: ['.product-detail-info h1', '.product-name-wrapper h1'],
        price: ['.price__amount', '.product-price'],
        color: ['.product-detail-color-selector__selected', '.product-detail-selected-color'],
        image: ['.media-image img', '.product-detail-image img']
      }
    },
    'massimodutti.com': {
      selectors: {
        name: ['.product-info__name', '.product-name'],
        price: ['.product-price span', '.current-price'],
        color: ['.product-colors__selected', '.selected-color'],
        image: ['.product-media-wrapper img', '.pdp-image']
      }
    },
    'cos.com': {
      selectors: {
        name: ['.product-detail-title', '.pdp-title h1'],
        price: ['.product-price', '.pdp-price'],
        color: ['.product-color-name', '.selected-color'],
        image: ['.product-detail-main-image img', '.pdp-image img']
      }
    },
    'louisvuitton.com': {
      selectors: {
        name: ['.lv-product__title', '.product-name h1'],
        price: ['.lv-product__price', '.product-price'],
        color: ['.lv-product__color', '.product-color'],
        image: ['.lv-product__image img', '.product-images img']
      }
    }
    // Add more retailers as needed
  };
  
  export function getRetailerConfig(url) {
    try {
      const hostname = new URL(url).hostname;
      const retailerDomain = Object.keys(retailers).find(domain => 
        hostname.includes(domain)
      );
      
      return retailerDomain ? retailers[retailerDomain] : null;
    } catch {
      return null;
    }
  }
  
  export function getRetailerHeaders(retailerConfig) {
    return {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }