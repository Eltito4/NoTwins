export const luxuryRetailers = {
    'carolinaherrera.com': {
      transformUrl: (url) => {
        if (url.includes('/p-ready-to-wear/')) {
          const skuMatch = url.match(/\?sku=(\d+)/);
          const sku = skuMatch ? skuMatch[1] : '';
          return `https://www.carolinaherrera.com/api/products/${sku}`;
        }
        return url;
      },
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      },
      selectors: {
        name: [
          '.product-name h1',
          '[data-testid="product-name"]',
          '.pdp-title'
        ],
        price: [
          '.product-price',
          '[data-testid="product-price"]',
          '.price-value'
        ],
        color: [
          '.selected-color',
          '[data-testid="selected-color"]',
          '.color-selector .active'
        ],
        image: [
          '.product-image img',
          '[data-testid="product-image"]',
          'meta[property="og:image"]'
        ]
      },
      brand: {
        defaultValue: 'Carolina Herrera'
      }
    },
    'cos.com': {
      transformUrl: (url) => url.split('?')[0],
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      selectors: {
        name: [
          '.product-detail-title',
          '.pdp-title h1',
          '[data-testid="product-title"]'
        ],
        price: [
          '.product-price',
          '.pdp-price',
          '[data-testid="product-price"]'
        ],
        color: [
          '.product-color-name',
          '.selected-color',
          '[data-testid="selected-color"]'
        ],
        image: [
          '.product-detail-main-image img',
          '.pdp-image img',
          'meta[property="og:image"]'
        ]
      },
      brand: {
        defaultValue: 'COS'
      }
    }
  };