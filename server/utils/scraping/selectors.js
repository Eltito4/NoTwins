export const selectors = {
    name: [
      // Generic selectors
      'h1',
      '[data-testid="product-name"]',
      '.product-name',
      '.product-title',
      '[itemprop="name"]',
      '#product-name',
      '.name',
      '.product-info h1',
      
      // Retailer specific selectors
      // H&M
      '.product-detail-name',
      '.pdp-heading',
      // Zara
      '.product-detail-info h1',
      '.product-name-wrapper h1',
      // ASOS
      '[data-test-id="product-title"]',
      '.product-hero h1',
      // Ladypipa
      '.product-single__title',
      // Mango
      '.product-name.text-title',
      // Massimo Dutti
      '.product-info__name',
      // Bershka & Stradivarius
      '.product-info-name',
      // El Corte Inglés
      '.product-title h1',
      // Ted Baker
      '.product-details__name',
      // Farfetch
      '[data-component="ProductName"]',
      // Net-a-Porter
      '.product-title span',
      // Matches Fashion
      '.pdp-header__product-name',
      // Selfridges
      '.product-description__name'
    ],
    
    description: [
      // Generic selectors
      '[data-testid="product-description"]',
      '.product-description',
      '.description',
      '[itemprop="description"]',
      'meta[name="description"]',
      '#product-description',
      '.details',
      '.product-details',
      
      // Retailer specific
      // H&M
      '.pdp-description',
      '.product-description-text',
      // Zara
      '.product-detail-description',
      // ASOS
      '[data-test-id="product-description"]',
      // Ladypipa
      '.product-single__description',
      // Mango
      '.product-details__description',
      // Massimo Dutti
      '.product-info__description',
      // Bershka & Stradivarius
      '.product-info-description',
      // El Corte Inglés
      '.product-description__text',
      // Ted Baker
      '.product-details__description',
      // Farfetch
      '[data-component="ProductDescription"]',
      // Net-a-Porter
      '.product-description',
      // Matches Fashion
      '.pdp-description',
      // Selfridges
      '.product-description__content'
    ],
    
    brand: [
      // Generic selectors
      '.brand',
      '[data-testid="product-brand"]',
      '[itemprop="brand"]',
      '.manufacturer',
      '#brand',
      '.product-brand',
      
      // Retailer specific
      // H&M
      '.product-detail-brand',
      // Zara
      '.product-detail-info__brand',
      // ASOS
      '[data-test-id="product-brand"]',
      // Ladypipa
      '.product-single__vendor',
      // Mango
      '.product-brand-name',
      // Massimo Dutti
      '.product-info__brand',
      // El Corte Inglés
      '.product-brand',
      // Ted Baker
      '.product-details__brand',
      // Farfetch
      '[data-component="BrandName"]',
      // Net-a-Porter
      '.designer-name',
      // Matches Fashion
      '.pdp-header__designer',
      // Selfridges
      '.product-description__brand'
    ],
    
    price: [
      // Generic selectors
      '.price',
      '[data-testid="product-price"]',
      '[itemprop="price"]',
      '.product-price',
      '.current-price',
      '#priceblock_ourprice',
      '.sale-price',
      '.actual-price',
      
      // Retailer specific
      // H&M
      '.product-price-value',
      // Zara
      '.price__amount',
      // ASOS
      '[data-test-id="current-price"]',
      // Ladypipa
      '.product-single__price',
      // Mango
      '.product-prices__price',
      // Massimo Dutti
      '.product-price span',
      // Bershka & Stradivarius
      '.current-price-elem',
      // El Corte Inglés
      '.price-amount',
      // Ted Baker
      '.product-details__price',
      // Farfetch
      '[data-component="Price"]',
      // Net-a-Porter
      '.price-sales',
      // Matches Fashion
      '.pdp-price',
      // Selfridges
      '.product-price__amount'
    ],
    
    color: [
      // Generic selectors
      '.color',
      '[data-testid="product-color"]',
      '[itemprop="color"]',
      '.selected-color',
      '.color-label',
      '#selected-color',
      '.variant-color',
      '.product-color',
      '.color-name',
      '.color-value',
      '[data-element="product-color"]',
      
      // Retailer specific
      // H&M
      '.product-input-label',
      '.product-detail-colour-picker__selected',
      // Zara
      '.product-detail-color-selector__selected',
      // ASOS
      '[data-test-id="colour-size-select"]',
      // Ladypipa
      '.product-single__color',
      // Mango
      '.color-selector__selected-color',
      // Massimo Dutti
      '.product-colors__selected',
      // Bershka & Stradivarius
      '.product-colors .selected',
      // El Corte Inglés
      '.product-color-name',
      // Ted Baker
      '.product-details__colour',
      // Farfetch
      '[data-component="ColorName"]',
      // Net-a-Porter
      '.selected-color',
      // Matches Fashion
      '.pdp-colour',
      // Selfridges
      '.product-description__colour'
    ],
    
    images: [
      // Open Graph and Twitter Card
      'meta[property="og:image"]',
      'meta[property="og:image:secure_url"]',
      'meta[property="product:image"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
      
      // Schema.org markup
      'script[type="application/ld+json"]',
      
      // Generic product image selectors
      '#product-image img',
      '.product-image img',
      '.main-image img',
      '.primary-image img',
      '[data-testid="product-image"]',
      '.gallery-image img',
      '.product-gallery img',
      '.product-photo img',
      '[role="presentation"] img',
      '.product img',
      '#main-image',
      '.main-image',
      '.featured-image img',
      '[data-zoom-image]',
      '[data-image]',
      'img[itemprop="image"]',
      '.product-media img',
      
      // Retailer specific
      // H&M
      '.product-detail-main-image-container img',
      '.product-images img',
      // Zara
      '.product-detail-image img',
      '.media-image img',
      // ASOS
      '.gallery-image img',
      '.product-carousel img',
      // Ladypipa
      '.product-single__media img',
      '.product__media img',
      // Mango
      '.product-images__image img',
      // Massimo Dutti
      '.product-media-wrapper img',
      // Bershka & Stradivarius
      '.product-image-wrapper img',
      // El Corte Inglés
      '.product-image__main img',
      // Ted Baker
      '.product-gallery__image',
      // Farfetch
      '[data-component="ProductImageMain"] img',
      // Net-a-Porter
      '.product-image img',
      // Matches Fashion
      '.pdp-image',
      // Selfridges
      '.product-gallery__image'
    ]
  };