export const spanishRetailers = {
  'zara.com': {
    name: 'Zara',
    selectors: {
      name: [
        '.product-detail-info h1',
        '[data-qa-id="product-name"]',
        '.product-name',
        'meta[property="og:title"]'
      ],
      price: [
        '.price__amount',
        '[data-qa-id="product-price"]',
        '.product-price',
        'meta[property="product:price:amount"]'
      ],
      color: [
        '.product-detail-color-selector__selected',
        '[data-qa-id="selected-color"]',
        '.product-detail-selected-color'
      ],
      image: [
        '.media-image img',
        '[data-qa-id="product-image"]',
        'meta[property="og:image"]'
      ],
      brand: { defaultValue: 'Zara' }
    }
  },
  'elcorteingles.es': {
    name: 'El Corte Inglés',
    selectors: {
      name: [
        '.product-title h1',
        '.pdp-title',
        'meta[property="og:title"]'
      ],
      price: [
        '.price-amount',
        '.current-price',
        'meta[property="product:price:amount"]'
      ],
      color: [
        '.product-color-name',
        '.selected-color',
        '.color-selector .selected'
      ],
      image: [
        '.product-image__main img',
        '.gallery-image',
        'meta[property="og:image"]'
      ],
      brand: [
        '.product-brand',
        '.brand-name',
        'meta[property="product:brand"]'
      ]
    }
  },
  'massimodutti.com': {
    name: 'Massimo Dutti',
    selectors: {
      name: [
        '.product-info__name',
        '.product-name',
        'meta[property="og:title"]'
      ],
      price: [
        '.product-price span',
        '.current-price',
        'meta[property="product:price:amount"]'
      ],
      color: [
        '.product-colors__selected',
        '.selected-color',
        '.color-selector .selected'
      ],
      image: [
        '.product-media-wrapper img',
        '.pdp-image',
        'meta[property="og:image"]'
      ],
      brand: { defaultValue: 'Massimo Dutti' }
    }
  },
  'mango.com': {
    name: 'Mango',
    selectors: {
      name: [
        '.product-name.text-title',
        '.name-title',
        'meta[property="og:title"]'
      ],
      price: [
        '.product-prices__price',
        '.price-sale',
        'meta[property="product:price:amount"]'
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
      brand: { defaultValue: 'Mango' }
    }
  },
  'pronovias.com': {
    name: 'Pronovias',
    selectors: {
      name: [
        '.product-name h1',
        '.pdp-title',
        'meta[property="og:title"]'
      ],
      price: [
        '.product-price',
        '.price-current',
        'meta[property="product:price:amount"]'
      ],
      color: [
        '.product-color',
        '.selected-color',
        '.color-selector .selected'
      ],
      image: [
        '.product-gallery__image',
        '.pdp-main-image img',
        'meta[property="og:image"]'
      ],
      brand: { defaultValue: 'Pronovias' }
    }
  },
  'rosaclara.es': {
    name: 'Rosa Clará',
    selectors: {
      name: [
        '.product-name',
        '.pdp-title',
        'meta[property="og:title"]'
      ],
      price: [
        '.product-price',
        '.price-current',
        'meta[property="product:price:amount"]'
      ],
      color: [
        '.product-color',
        '.selected-color',
        '.color-selector .selected'
      ],
      image: [
        '.product-gallery__image',
        '.pdp-main-image img',
        'meta[property="og:image"]'
      ],
      brand: { defaultValue: 'Rosa Clará' }
    }
  },
  'scalperscompany.com': {
    name: 'Scalpers',
    selectors: {
      name: [
        '.product-name',
        '.pdp-title',
        'meta[property="og:title"]'
      ],
      price: [
        '.product-price',
        '.price-current',
        'meta[property="product:price:amount"]'
      ],
      color: [
        '.product-color',
        '.selected-color',
        '.color-selector .selected'
      ],
      image: [
        '.product-gallery__image',
        '.pdp-main-image img',
        'meta[property="og:image"]'
      ],
      brand: { defaultValue: 'Scalpers' }
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
  },
  'ladypipa.com': {
    name: 'Lady Pipa',
    selectors: {
      name: ['.product-title', '.product-single__title', '.product__title', 'h1.product-title'],
      price: ['.price', '.product-single__price', '.price__regular'],
      color: ['.variant-input-wrap[data-option="Color"] .active', '.swatch-element.active'],
      image: ['.product__media-item img', '.product-featured-media', 'meta[property="og:image"]'],
      brand: { defaultValue: 'Lady Pipa' }
    }
  }
};