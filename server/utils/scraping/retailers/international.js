export const internationalRetailers = {
    'asos.com': {
      transformUrl: (url) => url.split('?')[0],
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
      },
      selectors: {
        name: [
          '[data-test-id="product-title"]',
          '.product-hero h1',
          '.product-title'
        ],
        price: [
          '[data-test-id="current-price"]',
          '.current-price',
          '.product-price-amount'
        ],
        color: [
          '[data-test-id="colour-size-select"]',
          '.product-colour',
          '.colour-section'
        ],
        brand: [
          '[data-test-id="product-brand"]',
          '.brand-description',
          '.product-brand'
        ]
      }
    },
    'net-a-porter.com': {
      transformUrl: (url) => url.split('?')[0],
      selectors: {
        name: ['.product-title', '.pdp-title'],
        price: ['.price-sales', '.product-price'],
        color: ['.selected-color', '.product-color'],
        brand: ['.designer-name', '.product-brand']
      }
    },
    'matchesfashion.com': {
      transformUrl: (url) => url.split('?')[0],
      selectors: {
        name: ['.pdp-header__product-name'],
        price: ['.pdp-price'],
        color: ['.pdp-colour'],
        brand: ['.pdp-header__designer']
      }
    },
    'selfridges.com': {
      transformUrl: (url) => url.split('?')[0],
      selectors: {
        name: ['.product-description__name'],
        price: ['.product-price__amount'],
        color: ['.product-description__colour'],
        brand: ['.product-description__brand']
      }
    },
    'mytheresa.com': {
      transformUrl: (url) => url.split('?')[0],
      selectors: {
        name: ['.product-name'],
        price: ['.price-box'],
        color: ['.color-label'],
        brand: ['.product-brand']
      }
    },
    'farfetch.com': {
      transformUrl: (url) => url.split('?')[0],
      selectors: {
        name: ['[data-component="ProductName"]'],
        price: ['[data-component="Price"]'],
        color: ['[data-component="ColorName"]'],
        brand: ['[data-component="BrandName"]']
      }
    },
    'revolve.com': {
      transformUrl: (url) => url.split('?')[0],
      selectors: {
        name: ['.product-name'],
        price: ['.product-price'],
        color: ['.color-selection-title'],
        brand: ['.brand-name']
      }
    }
  };