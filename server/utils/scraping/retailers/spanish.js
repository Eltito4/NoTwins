// Spanish retailers specific patterns and selectors
export const spanishRetailers = {
    'zara.com': {
      transformUrl: (url) => {
        if (url.includes('static.zara')) {
          return url.split('?')[0];
        }
        return url;
      },
      selectors: {
        image: [
          '.media-image img',
          '.product-detail-image img',
          '[data-qa-id="product-detail-image"]',
          'meta[property="og:image"]'
        ],
        name: [
          '.product-detail-info h1',
          '.product-name-wrapper h1',
          '[data-qa-id="product-name"]'
        ],
        price: [
          '.price__amount',
          '.product-price',
          '[data-qa-id="product-price"]'
        ],
        color: [
          '.product-detail-color-selector__selected',
          '.product-detail-selected-color',
          '[data-qa-id="selected-color"]'
        ]
      }
    },
    'mango.com': {
      transformUrl: (url) => url.split('?')[0],
      selectors: {
        image: [
          '.product-images__image img',
          '.image-container img',
          'meta[property="og:image"]'
        ],
        name: [
          '.product-name.text-title',
          '.name-title',
          'h1.product-name'
        ],
        price: [
          '.product-prices__price',
          '.price-sale',
          '.current-price'
        ],
        color: [
          '.color-selector__selected-color',
          '.selected-color',
          '.product-colors .active'
        ]
      }
    },
    'elcorteingles.es': {
      transformUrl: (url) => url,
      selectors: {
        image: [
          '.product-image__main img',
          '.product-gallery__image',
          'meta[property="og:image"]'
        ],
        name: [
          '.product-title h1',
          '.pdp-title',
          'h1[data-testid="product-title"]'
        ],
        price: [
          '.price-amount',
          '.current-price',
          '[data-testid="product-price"]'
        ],
        color: [
          '.product-color-name',
          '.selected-color',
          '.color-selector .selected'
        ]
      }
    },
    'pronovias.com': {
      transformUrl: (url) => url,
      selectors: {
        image: [
          '.product-gallery__image',
          '.pdp-main-image img',
          'meta[property="og:image"]'
        ],
        name: [
          '.product-name h1',
          '.pdp-title',
          'h1.product-title'
        ],
        price: [
          '.product-price',
          '.price-current',
          '.current-price'
        ],
        color: [
          '.product-color',
          '.selected-color',
          '.color-selector .active'
        ]
      }
    },
    'hm.com': {
      transformUrl: (url) => url.split('?')[0],
      selectors: {
        image: [
          '.product-detail-main-image-container img',
          '.product-images img',
          'meta[property="og:image"]'
        ],
        name: [
          '.product-detail-name',
          '.pdp-heading',
          'h1.product-name'
        ],
        price: [
          '.product-price-value',
          '.price-value',
          '[data-price]'
        ],
        color: [
          '.product-input-label',
          '.product-detail-colour-picker__selected',
          '.color-selector .selected'
        ]
      }
    },
    'sfera.com': {
      transformUrl: (url) => url,
      selectors: {
        image: [
          '.product-image img',
          '.gallery-image',
          'meta[property="og:image"]'
        ],
        name: [
          '.product-name',
          '.pdp-title',
          'h1.product-title'
        ],
        price: [
          '.product-price',
          '.current-price',
          '.price-amount'
        ],
        color: [
          '.color-selector .selected',
          '.selected-color',
          '.product-color'
        ]
      }
    }
    // Add more Spanish retailers...
  };