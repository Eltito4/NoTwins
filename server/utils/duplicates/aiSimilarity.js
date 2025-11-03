// MIGRATED TO CLAUDE - This file now uses Claude AI instead of Grok
import { analyzeSimilarItems as claudeAnalyzeSimilar, detectSmartDuplicates as claudeDetectDuplicates } from '../claude/index.js';
import { logger } from '../logger.js';

export async function analyzeSimilarItems(newItemName, existingItems) {
  try {
    logger.info('Using Claude for similarity analysis (migrated from Grok)');
    return await claudeAnalyzeSimilar(newItemName, existingItems);
  } catch (error) {
    logger.error('Claude similarity analysis error:', {
      error: error.message,
      newItem: newItemName,
      existingCount: existingItems.length
    });
    return [];
  }
}

export async function detectSmartDuplicates(newItem, existingItems) {
  try {
    logger.info('Using Claude for smart duplicate detection (migrated from Grok)');
    return await claudeDetectDuplicates(newItem, existingItems);
  } catch (error) {
    logger.error('Claude smart duplicate detection error:', {
      error: error.message,
      newItem: newItem.name
    });
    return [];
  }
}

function calculateNameSimilarity(name1, name2) {
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  // Jaccard similarity
  const set1 = new Set(n1.split(''));
  const set2 = new Set(n2.split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

export async function findAllDuplicates(dresses) {
  try {
    const duplicates = [];
    
    for (let i = 0; i < dresses.length; i++) {
      const currentDress = dresses[i];
      const remainingDresses = dresses.slice(i + 1);
      
      // 1. Exact name matches (existing logic)
      const exactMatches = remainingDresses.filter(dress => 
        dress.name.toLowerCase() === currentDress.name.toLowerCase()
      );
      
      // 2. AI similarity matches
      const similarMatches = await analyzeSimilarItems(
        currentDress.name, 
        remainingDresses
      );
      
      // Process exact matches
      if (exactMatches.length > 0) {
        const allExactItems = [currentDress, ...exactMatches];
        
        // Group by color for exact matches
        const colorGroups = {};
        allExactItems.forEach(item => {
          const color = (item.color || 'unknown').toLowerCase();
          if (!colorGroups[color]) colorGroups[color] = [];
          colorGroups[color].push(item);
        });
        
        // Add exact duplicates (same color)
        Object.entries(colorGroups).forEach(([color, items]) => {
          if (items.length > 1) {
            duplicates.push({
              name: currentDress.name,
              items: items.map(item => ({
                id: item._id,
                userId: item.userId,
                userName: item.userName || 'Unknown User',
                color: item.color
              })),
              type: 'exact'
            });
          }
        });
        
        // Add partial duplicates (different colors)
        if (Object.keys(colorGroups).length > 1) {
          duplicates.push({
            name: currentDress.name,
            items: allExactItems.map(item => ({
              id: item._id,
              userId: item.userId,
              userName: item.userName || 'Unknown User',
              color: item.color
            })),
            type: 'partial'
          });
        }
      }
      
      // Process AI similarity matches
      if (similarMatches.length > 0) {
        similarMatches.forEach(similarItem => {
          duplicates.push({
            name: `${currentDress.name} / ${similarItem.name}`,
            items: [
              {
                id: currentDress._id,
                userId: currentDress.userId,
                userName: currentDress.userName || 'Unknown User',
                color: currentDress.color
              },
              {
                id: similarItem._id,
                userId: similarItem.userId,
                userName: similarItem.userName || 'Unknown User',
                color: similarItem.color
              }
            ],
            type: 'similar',
            similarity: similarItem.similarity,
            reason: similarItem.reason
          });
        });
      }
    }
    
    return duplicates;
  } catch (error) {
    logger.error('Error finding all duplicates:', error);
    return [];
  }
}