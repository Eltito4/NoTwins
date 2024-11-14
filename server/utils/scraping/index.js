import { findBestImage } from './imageProcessor.js';
import { findProductColor } from './colorDetector.js';
import { detectArticleType } from './typeDetector.js';
import { COLOR_MAPPINGS, ARTICLE_TYPES } from './constants.js';
import { selectors } from './selectors.js';

export {
  findBestImage,
  findProductColor,
  detectArticleType,
  COLOR_MAPPINGS,
  ARTICLE_TYPES,
  selectors
};