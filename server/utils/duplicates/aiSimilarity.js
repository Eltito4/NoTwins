import axios from 'axios';
import { logger } from '../logger.js';

let deepseekClient = null;

function initializeDeepSeek() {
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  
  if (!API_KEY) {
    logger.error('Missing DEEPSEEK_API_KEY environment variable');
    return null;
  }

  try {
    deepseekClient = axios.create({
      baseURL: 'https://api.deepseek.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    return deepseekClient;
  } catch (error) {
    logger.error('Failed to initialize DeepSeek for similarity:', error);
    return null;
  }
}

export async function analyzeSimilarItems(newItemName, existingItems) {
  try {
    if (!deepseekClient) {
      deepseekClient = initializeDeepSeek();
      if (!deepseekClient) {
        logger.warn('DeepSeek not available for similarity analysis');
        return [];
      }
    }

    // Filter out items that are exactly the same (already handled by exact matching)
    const differentItems = existingItems.filter(item => 
      item.name.toLowerCase() !== newItemName.toLowerCase()
    );

    if (differentItems.length === 0) {
      return [];
    }

    const messages = [
      {
        role: "system",
        content: `You are a fashion similarity analyzer. Compare clothing item names to find similar items that could cause outfit conflicts.

        SIMILARITY RULES:
        1. Same type of clothing with different descriptions = SIMILAR
        2. Same brand/style with different colors/sizes = SIMILAR  
        3. Different clothing types = NOT SIMILAR
        4. Accessories vs clothing = NOT SIMILAR
        5. Consider Spanish, English, French, Italian names

        EXAMPLES:
        - "Vestido rojo largo" vs "Red maxi dress" = SIMILAR (same item type)
        - "Zapatos negros tacón" vs "Black high heels" = SIMILAR (same shoe type)
        - "Vestido" vs "Pantalón" = NOT SIMILAR (different types)
        - "Dress" vs "Bag" = NOT SIMILAR (different categories)

        Return similarity scores from 0.0 to 1.0:
        - 0.8-1.0 = Very similar (likely same item type)
        - 0.6-0.79 = Somewhat similar (related items)
        - 0.0-0.59 = Not similar`
      },
      {
        role: "user",
        content: `Analyze similarity between the new item and existing items:

        NEW ITEM: "${newItemName}"

        EXISTING ITEMS:
        ${differentItems.map((item, index) => `${index + 1}. "${item.name}"`).join('\n')}

        Return a JSON array with similarity scores:
        [
          {
            "itemIndex": 1,
            "itemName": "existing item name",
            "similarity": 0.85,
            "reason": "Both are long dresses, same style"
          }
        ]

        Only include items with similarity >= 0.6`
      }
    ];

    const response = await deepseekClient.post('/chat/completions', {
      model: "deepseek-chat",
      messages,
      temperature: 0.3,
      max_tokens: 800
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const similarities = JSON.parse(jsonMatch[0]);
      
      // Map back to original items and filter by threshold
      const similarItems = similarities
        .filter(sim => sim.similarity >= 0.6)
        .map(sim => ({
          ...differentItems[sim.itemIndex - 1],
          similarity: sim.similarity,
          reason: sim.reason
        }));

      logger.info('AI similarity analysis completed:', {
        newItem: newItemName,
        foundSimilar: similarItems.length,
        similarities: similarItems.map(item => ({
          name: item.name,
          score: item.similarity
        }))
      });

      return similarItems;
    }

    return [];
  } catch (error) {
    logger.error('AI similarity analysis error:', {
      error: error.message,
      newItem: newItemName,
      existingCount: existingItems.length
    });
    return []; // Fallback to no similarities on error
  }
}

export async function detectSmartDuplicates(newItem, existingItems) {
  try {
    if (!deepseekClient) {
      deepseekClient = initializeDeepSeek();
      if (!deepseekClient) {
        logger.warn('DeepSeek not available for smart duplicate detection');
        return [];
      }
    }

    // Filter items that could be duplicates based on basic criteria
    const potentialDuplicates = existingItems.filter(item => {
      // Same brand and color
      if (item.brand && newItem.brand && item.color && newItem.color) {
        if (item.brand.toLowerCase() === newItem.brand.toLowerCase() && 
            item.color.toLowerCase() === newItem.color.toLowerCase()) {
          return true;
        }
      }
      
      // Same type and color
      if (item.type?.subcategory && newItem.type?.subcategory && item.color && newItem.color) {
        if (item.type.subcategory === newItem.type.subcategory && 
            item.color.toLowerCase() === newItem.color.toLowerCase()) {
          return true;
        }
      }
      
      // Similar names (basic check)
      const similarity = calculateNameSimilarity(newItem.name, item.name);
      return similarity > 0.6;
    });

    if (potentialDuplicates.length === 0) {
      return [];
    }

    const messages = [
      {
        role: "system",
        content: `You are a fashion duplicate detector. Analyze if items are the same product with different names.

        CRITICAL RULES:
        1. Same brand + same color + same type = LIKELY DUPLICATE
        2. Different languages for same item = DUPLICATE ("Vestido Negro" = "Black Dress")
        3. Different descriptions for same item = DUPLICATE ("Formal Dress" = "Vestido Formal")
        4. Same visual appearance = DUPLICATE
        5. Different sizes of same item = DUPLICATE
        6. Different styling of same name = DUPLICATE

        EXAMPLES:
        - "Vestido Formal Negro" vs "Black Formal Dress" = DUPLICATE (same item, different language)
        - "Carolina Herrera Black Dress" vs "Vestido Negro Carolina Herrera" = DUPLICATE
        - "Red Zara Shirt" vs "Blue Zara Shirt" = NOT DUPLICATE (different colors)
        - "Nike Sneakers White" vs "Adidas Sneakers White" = NOT DUPLICATE (different brands)

        Return confidence score 0.0-1.0:
        - 0.9-1.0 = Definitely same item
        - 0.7-0.89 = Very likely same item  
        - 0.5-0.69 = Possibly same item
        - 0.0-0.49 = Different items`
      },
      {
        role: "user",
        content: `Analyze if these items are duplicates:

        NEW ITEM:
        - Name: "${newItem.name}"
        - Brand: "${newItem.brand || 'Unknown'}"
        - Color: "${newItem.color || 'Unknown'}"
        - Type: "${newItem.type?.name || 'Unknown'}"
        - Category: "${newItem.type?.category || 'Unknown'}"

        EXISTING ITEMS TO COMPARE:
        ${potentialDuplicates.map((item, index) => `
        ${index + 1}. "${item.name}"
           - Brand: "${item.brand || 'Unknown'}"
           - Color: "${item.color || 'Unknown'}"
           - Type: "${item.type?.name || 'Unknown'}"
           - User: "${item.userName || 'Unknown'}"
        `).join('')}

        Return JSON array with duplicate analysis:
        [
          {
            "itemIndex": 1,
            "itemName": "existing item name",
            "confidence": 0.95,
            "isDuplicate": true,
            "reason": "Same Carolina Herrera black formal dress, just different language",
            "type": "exact"
          }
        ]

        Only include items with confidence >= 0.7`
      }
    ];

    const response = await deepseekClient.post('/chat/completions', {
      model: "deepseek-chat",
      messages,
      temperature: 0.2,
      max_tokens: 800
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const text = response.data.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const duplicates = JSON.parse(jsonMatch[0]);
      
      // Map back to original items and filter by confidence
      const detectedDuplicates = duplicates
        .filter(dup => dup.confidence >= 0.7 && dup.isDuplicate)
        .map(dup => ({
          ...potentialDuplicates[dup.itemIndex - 1],
          confidence: dup.confidence,
          reason: dup.reason,
          duplicateType: dup.confidence >= 0.9 ? 'exact' : 'similar'
        }));

      logger.info('Smart duplicate detection completed:', {
        newItem: newItem.name,
        potentialCount: potentialDuplicates.length,
        detectedCount: detectedDuplicates.length,
        duplicates: detectedDuplicates.map(d => ({
          name: d.name,
          confidence: d.confidence,
          type: d.duplicateType
        }))
      });

      return detectedDuplicates;
    }

    return [];
  } catch (error) {
    logger.error('Smart duplicate detection error:', {
      error: error.message,
      newItem: newItem.name,
      potentialCount: potentialDuplicates?.length || 0
    });
    return []; // Fallback to no duplicates on error
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