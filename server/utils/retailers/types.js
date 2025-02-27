/**
 * @typedef {Object} RetailerConfig
 * @property {string} name - The name of the retailer
 * @property {'EUR'|'USD'} defaultCurrency - The default currency used by the retailer
 * @property {Object} selectors - CSS selectors for extracting product information
 * @property {string[]} selectors.name - Selectors for product name
 * @property {string[]} selectors.price - Selectors for product price
 * @property {string[]} selectors.color - Selectors for product color
 * @property {string[]} selectors.image - Selectors for product image
 * @property {string[]} [selectors.brand] - Optional selectors for product brand
 * @property {function} [transformUrl] - Optional function to transform the URL
 * @property {Object} [headers] - Optional custom headers for requests
 * @property {Object} [brand] - Optional brand information
 * @property {string} [brand.defaultValue] - Default brand name
 */

export const RetailerConfigType = {};