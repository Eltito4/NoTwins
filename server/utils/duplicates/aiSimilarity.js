<parameter name="filePath">server/utils/duplicates/aiSimilarity.js</parameter>
<parameter name="contentType">content</parameter>
<parameter name="content">import axios from 'axios';
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
}</parameter>
</invoke>