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
  },
  'apparentia.com': {
    name: 'Apparentia',
    selectors: {
      name: ['.product-name', '.ficha-title', 'h1'],
      price: ['.price', '.product-price', '.current-price'],
      color: ['.color-selected', '.selected-color', '.variant-color'],
      image: ['.product-image img', '.gallery-image', 'meta[property="og:image"]'],
      brand: { defaultValue: 'Apparentia' }
    }
  },
  'meryfor.com': {
    name: 'Mery For',
    selectors: {
      name: ['.product-title', '.product__title', 'h1.title'],
      price: ['.product-price', '.price', '[data-product-price]'],
      color: ['.color-swatches .selected', '.variant-color', '.selected-color'],
      image: ['.product__media img', '.featured-image', 'meta[property="og:image"]'],
      brand: { defaultValue: 'Mery For' }
    }
  },
  'bgoandme.com': {
    name: 'BGO & Me',
    selectors: {
      name: ['.product__title', '.product-single__title', 'h1'],
      price: ['.product__price', '.price', '.product-price'],
      color: ['.single-option-selector', '.color-swatch.active', '.selected-color'],
      image: ['.product__media-item img', '.featured-image', 'meta[property="og:image"]'],
      brand: { defaultValue: 'BGO & Me' }
    }
  },
  'aliciarueda.com': {
    name: 'Alicia Rueda',
    selectors: {
      name: ['.product__title', '.product-single__title', 'h1'],
      price: ['.product__price', '.price', '.product-price'],
      color: ['.variant-input-wrap[data-option="Color"] .active', '.swatch-element.active'],
      image: ['.product__media img', '.featured-media', 'meta[property="og:image"]'],
      brand: { defaultValue: 'Alicia Rueda' }
    }
  },
  'seeiou.com': {
    name: 'See IOU',
    selectors: {
      name: ['.product__title', '.product-single__title', 'h1'],
      price: ['.product__price', '.price', '.product-price'],
      color: ['.variant-input-wrap[data-option="Color"] .active', '.swatch-element.active'],
      image: ['.product__media img', '.featured-media', 'meta[property="og:image"]'],
      brand: { defaultValue: 'See IOU' }
    }
  },
  'bruna.es': {
    name: 'Bruna',
    selectors: {
      name: ['.product__title', '.product-single__title', 'h1'],
      price: ['.product__price', '.price', '.product-price'],
      color: ['.variant-input-wrap[data-option="Color"] .active', '.swatch-element.active'],
      image: ['.product__media img', '.featured-media', 'meta[property="og:image"]'],
      brand: { defaultValue: 'Bruna' }
    }
  },
  'redondobrand.com': {
    name: 'Redondo Brand',
    selectors: {
      name: ['.product__title', '.product-single__title', 'h1'],
      price: ['.product__price', '.price', '.product-price'],
      color: ['.variant-input-wrap[data-option="Color"] .active', '.swatch-element.active'],
      image: ['.product__media img', '.featured-media', 'meta[property="og:image"]'],
      brand: { defaultValue: 'Redondo Brand' }
    }
  },
  'polinetmoi.com': {
    name: 'Poli & Moi',
    selectors: {
      name: ['.product-name', '.page-title', 'h1'],
      price: ['.product-price', '.price', '.current-price'],
      color: ['.color-picker .selected', '.color-option.active', '.selected-color'],
      image: ['.product-image img', '.gallery-image', 'meta[property="og:image"]'],
      brand: { defaultValue: 'Poli & Moi' }
    }
  },
  'carlaruiz.com': {
    name: 'Carla Ruiz',
    selectors: {
      name: ['.product-name', '.product-title', 'h1'],
      price: ['.product-price', '.price', '.current-price'],
      color: ['.color-selector .selected', '.variant-color', '.selected-color'],
      image: ['.product-image img', '.gallery-image', 'meta[property="og:image"]'],
      brand: { defaultValue: 'Carla Ruiz' }
    }
  }
};