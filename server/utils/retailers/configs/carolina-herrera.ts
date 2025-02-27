export const carolinaHerreraConfig = {
  name: 'Carolina Herrera',
  defaultCurrency: 'EUR',
  transformUrl: (url) => {
    // Check if this is a product URL with SKU
    if (url.includes('/p-ready-to-wear/') && url.includes('sku=')) {
      const skuMatch = url.match(/sku=(\d+)/);
      if (skuMatch) {
        const sku = skuMatch[1];
        return `https://www.carolinaherrera.com/api/products/${sku}`;
      }
    }
    return url;
  },
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  selectors: {
    name: [
      '.product-name h1',
      '[data-testid="product-name"]',
      '.pdp-title',
      'meta[property="og:title"]'
    ],
    price: [
      '.product-price',
      '[data-testid="product-price"]',
      '.price-value',
      'meta[property="product:price:amount"]'
    ],
    color: [
      '.selected-color',
      '[data-testid="selected-color"]',
      '.color-selector .active',
      'meta[property="product:color"]'
    ],
    image: [
      '.product-image img',
      '[data-testid="product-image"]',
      'meta[property="og:image"]',
      'meta[property="product:image"]'
    ],
    description: [
      '.product-description',
      '[data-testid="product-description"]',
      'meta[name="description"]'
    ]
  },
  brand: {
    defaultValue: 'Carolina Herrera'
  }
};