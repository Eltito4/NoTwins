export const spanishRetailers = {
  'elcorteingles.es': {
    name: 'El Corte Inglés',
    selectors: {
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
      ],
      image: [
        '.product-image__main img',
        '.product-gallery__image',
        'meta[property="og:image"]'
      ]
    }
  },
  'scalperscompany.com': {
    name: 'Scalpers',
    selectors: {
      name: [
        '.product-title',
        '.product__title',
        'h1.title'
      ],
      price: [
        '.product-price',
        '.price',
        '.current-price'
      ],
      color: [
        '.product-color',
        '.color-selector .selected',
        '.variant-color'
      ],
      image: [
        '.product-image img',
        '.product-gallery__image',
        'meta[property="og:image"]'
      ]
    }
  },
  'pronovias.com': {
    name: 'Pronovias',
    selectors: {
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
      ],
      image: [
        '.product-gallery__image',
        '.pdp-main-image img',
        'meta[property="og:image"]'
      ],
      brand: {
        defaultValue: 'Pronovias'
      }
    }
  },
  'rosaclara.es': {
    name: 'Rosa Clará',
    selectors: {
      name: [
        '.product-name',
        '.product-title',
        'h1.title'
      ],
      price: [
        '.product-price',
        '.price',
        '.current-price'
      ],
      color: [
        '.product-color',
        '.color-selector .selected',
        '.selected-color'
      ],
      image: [
        '.product-gallery img',
        '.product-image img',
        'meta[property="og:image"]'
      ],
      brand: {
        defaultValue: 'Rosa Clará'
      }
    }
  },
  'mango.com': {
    name: 'Mango',
    selectors: {
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
      ],
      image: [
        '.product-images__image img',
        '.image-container img',
        'meta[property="og:image"]'
      ],
      brand: {
        defaultValue: 'Mango'
      }
    }
  },
  'massimodutti.com': {
    name: 'Massimo Dutti',
    selectors: {
      name: [
        '.product-info__name',
        '.product-name',
        'h1.product-title'
      ],
      price: [
        '.product-price span',
        '.current-price',
        '.price-amount'
      ],
      color: [
        '.product-colors__selected',
        '.selected-color',
        '.color-selector .active'
      ],
      image: [
        '.product-media-wrapper img',
        '.pdp-image',
        'meta[property="og:image"]'
      ],
      brand: {
        defaultValue: 'Massimo Dutti'
      }
    }
  }
};