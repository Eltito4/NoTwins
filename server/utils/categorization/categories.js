export const CATEGORIES = [
  {
    id: 'clothes',
    name: 'Clothes',
    subcategories: [
      {
        id: 'tops',
        name: 'Tops',
        keywords: [
          'shirt', 'blouse', 'top', 't-shirt', 'tee', 'sweater',
          'hoodie', 'sweatshirt', 'tank', 'polo', 'jersey',
          'cardigan', 'pullover', 'turtleneck', 'crop',
          'tunic', 'camisole', 'bodysuit', 'bustier', 'corset'
        ]
      },
      {
        id: 'bottoms',
        name: 'Bottoms',
        keywords: [
          'pants', 'trousers', 'jeans', 'shorts', 'skirt',
          'leggings', 'joggers', 'sweatpants', 'slacks',
          'culottes', 'palazzo', 'capri', 'chinos', 'cargo',
          'bermuda', 'mini skirt', 'midi skirt', 'maxi skirt'
        ]
      },
      {
        id: 'dresses',
        name: 'Dresses',
        keywords: [
          'dress', 'gown', 'frock', 'sundress', 'cocktail dress',
          'evening dress', 'maxi dress', 'mini dress', 'jumpsuit',
          'romper', 'caftan', 'kimono', 'wrap dress', 'shift dress', 
          'sheath dress', 'a-line dress', 'bodycon dress',
          // Spanish dress terms - CRITICAL for detection
          'vestido', 'vestidos', 'vestido largo', 'vestido corto',
          'vestido de punto', 'vestido de noche', 'vestido de fiesta',
          'vestido midi', 'vestido maxi', 'vestido casual'
        ]
      },
      {
        id: 'outerwear',
        name: 'Outerwear',
        keywords: [
          'jacket', 'coat', 'blazer', 'cardigan', 'vest',
          'windbreaker', 'parka', 'raincoat', 'bomber',
          'trench coat', 'peacoat', 'duster', 'poncho',
          'cape', 'shrug', 'bolero'
        ]
      }
    ]
  },
  {
    id: 'accessories',
    name: 'Accessories',
    subcategories: [
      {
        id: 'shoes',
        name: 'Shoes',
        keywords: [
          'shoes', 'boots', 'sandals', 'sneakers', 'heels',
          'flats', 'loafers', 'oxfords', 'pumps', 'mules',
          'espadrilles', 'slippers', 'ankle boots', 'footwear',
          'ballet flats', 'platforms', 'wedges', 'stilettos',
          'ballerina', 'slingback', 'mary jane',
          // Spanish shoe terms - CRITICAL for detection
          'zapato', 'zapatos', 'sandalia', 'sandalias', 'bota', 'botas',
          'zapatilla', 'zapatillas', 'tacón', 'tacones', 'bailarina',
          'mocasín', 'alpargata', 'deportiva'
        ]
      },
      {
        id: 'bags',
        name: 'Bags',
        keywords: [
          'bag', 'purse', 'handbag', 'backpack', 'tote',
          'clutch', 'wallet', 'satchel', 'crossbody',
          'shoulder bag', 'duffel', 'messenger', 'hobo', 
          'bucket bag', 'wristlet', 'pouch',
          // Spanish bag terms - CRITICAL for detection
          'bolso', 'bolsos', 'cartera', 'carteras', 'mochila', 'mochilas',
          'bandolera', 'riñonera', 'bolso de mano', 'bolso tote'
        ]
      },
      {
        id: 'jewelry',
        name: 'Jewelry',
        keywords: [
          'necklace', 'bracelet', 'ring', 'earrings',
          'pendant', 'brooch', 'anklet', 'jewelry',
          'choker', 'bangle', 'cuff', 'chain', 'charm',
          'locket', 'pearls', 'gemstone'
        ]
      },
      {
        id: 'other',
        name: 'Other Accessories',
        keywords: [
          'scarf', 'belt', 'gloves', 'sunglasses',
          'hat', 'cap', 'beanie', 'watch', 'hair accessories',
          'headband', 'bandana', 'tie', 'bow tie', 'cufflinks',
          'umbrella', 'keychain', 'phone case'
        ]
      }
    ]
  }
];