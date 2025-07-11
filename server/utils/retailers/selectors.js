// Common selectors that work across most e-commerce sites
export const commonSelectors = {
  name: [
    // Zara specific
    '.product-detail-info__header-name',
    '.product-detail-info h1',
    '.product-name',
    
    // Massimo Dutti specific
    '.product-info__name',
    '.product-detail-name',
    
    // H&M specific
    '.product-detail-name',
    '.pdp-heading',
    
    // Mango specific
    '.product-name.text-title',
    '.name-title',
    
    // Meta tags
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[property="product:title"]',
    
    // Common product title selectors
    'h1[itemprop="name"]',
    '.product-name h1',
    '.product-title h1',
    '.pdp-title h1',
    '[data-testid="product-name"]',
    '[data-testid="product-title"]',
    '.product-detail-name',
    '.product-info__name',
    '.product-item-headline',
    '.primary.product-item-headline'
  ],
  price: [
    // Zara specific
    '.price__amount',
    '.product-detail-info__price',
    
    // Massimo Dutti specific
    '.product-price span',
    '.current-price',
    
    // H&M specific
    '.product-price-value',
    '.price-value',
    
    // Mango specific
    '.product-prices__price',
    '.price-sale',
    
    // Meta tags
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    
    // Common price selectors
    '[itemprop="price"]',
    '.product-price',
    '.price__amount',
    '.price-value',
    '[data-testid="product-price"]',
    '.current-price',
    '.price-amount',
    '.ProductPrice-module--priceValue',
    '.ProductPrice-module--priceWrapper__X_ww5'
  ],
  color: [
    // Zara specific
    '.product-detail-color-selector__selected',
    '.product-detail-selected-color',
    
    // Massimo Dutti specific
    '.product-colors__selected',
    '.selected-color',
    
    // H&M specific
    '.product-input-label',
    '.product-detail-colour-picker__selected',
    
    // Mango specific
    '.color-selector__selected-color',
    '.product-colors .active',
    
    // Common color selectors
    '[itemprop="color"]',
    '.selected-color',
    '.color-selector .active',
    '.product-color',
    '[data-testid="selected-color"]',
    '.color-picker__selected',
    '.variant-color',
    '.product-input-label',
    '.product-colors-module--name',
    '.color-attribute span'
  ],
  image: [
    // Zara specific
    '.media-image img',
    '.product-detail-image img',
    
    // Massimo Dutti specific
    '.product-media-wrapper img',
    '.pdp-image',
    
    // H&M specific
    '.product-detail-main-image-container img',
    '.product-images img',
    
    // Mango specific
    '.product-images__image img',
    '.image-container img',
    
    // Meta tags
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    'meta[name="twitter:image"]',
    
    // Common image selectors
    '[itemprop="image"]',
    '.product-image img',
    '.gallery-image img',
    '.pdp-image img',
    '[data-testid="product-image"]',
    'picture source[srcset]',
    '.product-detail-main-image-container img',
    '.product-detail-image img',
    '.product__media img'
  ],
  brand: [
    // Meta tags
    'meta[property="og:brand"]',
    'meta[property="product:brand"]',
    // Common brand selectors
    '[itemprop="brand"]',
    '.product-brand',
    '.brand-name',
    '[data-testid="product-brand"]',
    '.product-brand-logo'
  ],
  description: [
    // Meta tags
    'meta[name="description"]',
    'meta[property="og:description"]',
    // Common description selectors
    '[itemprop="description"]',
    '.product-description',
    '.pdp-description',
    '[data-testid="product-description"]',
    '.product-detail-description'
  ]
};