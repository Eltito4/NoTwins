import { load } from 'cheerio';

// Common e-commerce platforms and their identifying features
const PLATFORM_SIGNATURES = {
  shopify: {
    indicators: [
      'Shopify.theme',
      'shopify-section',
      '/cdn.shopify.com/',
      'shopify-payment-button'
    ],
    selectors: {
      name: [
        '.product__title',
        '.product-single__title',
        'h1.title'
      ],
      price: [
        '.product__price',
        '.price',
        '[data-product-price]'
      ],
      color: [
        '.variant-input-wrap[data-option="Color"] .active',
        '.swatch-element.active',
        '.color-swatch.selected'
      ],
      image: [
        '.product__media-item img',
        '.featured-image',
        'meta[property="og:image"]'
      ]
    }
  },
  woocommerce: {
    indicators: [
      'woocommerce',
      'wp-content',
      'add_to_cart'
    ],
    selectors: {
      name: [
        '.product_title',
        '.entry-title',
        'h1.title'
      ],
      price: [
        '.price',
        '.amount',
        '.product-price'
      ],
      color: [
        '.color-variable-item.selected',
        '.selected-color',
        '.color-swatch.active'
      ],
      image: [
        '.woocommerce-product-gallery__image img',
        '.wp-post-image',
        'meta[property="og:image"]'
      ]
    }
  },
  prestashop: {
    indicators: [
      'prestashop',
      'presta-shop',
      'ps_shoppingcart'
    ],
    selectors: {
      name: [
        '.product-name',
        '.page-heading',
        'h1[itemprop="name"]'
      ],
      price: [
        '.product-price',
        '.current-price',
        '[itemprop="price"]'
      ],
      color: [
        '.color-pick.selected',
        '.color-option.selected',
        '.input-color:checked'
      ],
      image: [
        '#bigpic',
        '.product-cover img',
        'meta[property="og:image"]'
      ]
    }
  },
  magento: {
    indicators: [
      'Magento',
      'mage-init',
      'catalog-product-view'
    ],
    selectors: {
      name: [
        '.page-title',
        '.product-name',
        '[data-ui-id="page-title-wrapper"]'
      ],
      price: [
        '.price-box',
        '.product-info-price',
        '[data-price-type="finalPrice"]'
      ],
      color: [
        '.swatch-option.selected',
        '.color-swatch.active',
        '.selected-option'
      ],
      image: [
        '.gallery-placeholder img',
        '.product.media img',
        'meta[property="og:image"]'
      ]
    }
  }
};

export function detectPlatform($) {
  const html = $.html();
  
  for (const [platform, config] of Object.entries(PLATFORM_SIGNATURES)) {
    if (config.indicators.some(indicator => html.includes(indicator))) {
      return {
        platform,
        selectors: config.selectors
      };
    }
  }
  
  return null;
}

export function getGenericSelectors() {
  return {
    name: [
      'h1',
      '.product-title',
      '.product-name',
      '[itemprop="name"]',
      'meta[property="og:title"]'
    ],
    price: [
      '.price',
      '.product-price',
      '[itemprop="price"]',
      'meta[property="product:price:amount"]'
    ],
    color: [
      '.color-selector .selected',
      '.variant-color',
      '.selected-color',
      '[data-option="Color"]'
    ],
    image: [
      '.product-image img',
      '.gallery-image',
      'meta[property="og:image"]',
      '[itemprop="image"]'
    ]
  };
}